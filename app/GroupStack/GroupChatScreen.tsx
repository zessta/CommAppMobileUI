import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatMessageServer, Group, Participants } from '@/constants/Types';
import { getGroupChatHistory, getGroupUsers, updateStatusOfTags } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import Checkbox from 'expo-checkbox';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  Composer,
  GiftedChat,
  IMessage as OriginalIMessage,
  InputToolbar,
  Send,
} from 'react-native-gifted-chat';
import Translator from 'react-native-translator';
import { v4 as uuidv4 } from 'uuid';
import AddMembersToGroup from './AddMemberToGroup';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import SendTagMessage, { TagMessageProp } from './SendTagMessage';
export type SelectedStatusTagProps = {
  eventTagStatusId: number;
  statusName: string;
  tagId: number;
};
interface IMessage extends OriginalIMessage {
  customData?: {
    statuses?: SelectedStatusTagProps[];
  };
}

// Custom Components
const HeaderLeft = ({ onBack, groupName }: { onBack: () => void; groupName: string }) => (
  <View style={styles.headerLeft}>
    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
      <IconSymbol size={24} name="arrow-back" color="#A08E67" />
    </TouchableOpacity>
    <Image
      source={{
        uri: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${groupName || 'Default'}`,
      }}
      style={styles.avatar}
    />
  </View>
);

const HeaderRight = ({
  onAddMember,
  onSendTagMessage,
}: {
  onAddMember: () => void;
  onSendTagMessage: () => void;
}) => (
  <View style={styles.headerRight}>
    <TouchableOpacity onPress={() => onSendTagMessage()} style={styles.headerIcon}>
      <IconSymbol size={24} name="poll" color="#A08E67" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => onAddMember()} style={styles.headerIcon}>
      <IconSymbol size={24} name="adduser" color="#A08E67" />
    </TouchableOpacity>
  </View>
);

const HeaderTitle = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.headerTitleContainer}>
    <Text style={styles.headerTitle}>{title}</Text>
  </TouchableOpacity>
);

const Placeholder = () => (
  <Animated.View entering={FadeIn} exiting={FadeOut}>
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Send a message to start the conversation</Text>
    </View>
  </Animated.View>
);

const TranslateBar = ({
  onTranslate,
  enteredText,
  setTranslatedText,
}: {
  onTranslate: (result: string) => void;
  enteredText: string;
  setTranslatedText: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [result, setResult] = useState<string>('');
  const [transLang, setTransLang] = useState<string>('te');
  const [isTeluguChecked, setIsTeluguChecked] = useState<boolean>(true);
  const [isHindiChecked, setIsHindiChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const languageList = useMemo(
    () => [
      { value: 'te', title: 'Telugu' },
      { value: 'hi', title: 'Hindi' },
    ],
    [],
  );

  const handleLangChange = useCallback((lang: string) => {
    if (lang === 'te') {
      setIsTeluguChecked(true);
      setIsHindiChecked(false);
      setTransLang('te');
    } else if (lang === 'hi') {
      setIsTeluguChecked(false);
      setIsHindiChecked(true);
      setTransLang('hi');
    }
  }, []);

  useEffect(() => {
    if (enteredText && enteredText !== 'Enter a URL') {
      setResult('');
    }
  }, [enteredText, transLang]);

  const handleTranslateButtonPress = useCallback(() => {
    if (!enteredText || result === 'Enter a URL') return;
    setLoading(true);
    setTimeout(() => {
      setTranslatedText(result);
      onTranslate(result);
      setLoading(false);
    }, 1000);
  }, [enteredText, result, onTranslate, setTranslatedText]);

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View style={styles.translateContainer}>
        {languageList.map((lang) => (
          <View style={styles.checkboxRow} key={lang.value}>
            <Checkbox
              value={lang.value === 'te' ? isTeluguChecked : isHindiChecked}
              onValueChange={() => handleLangChange(lang.value)}
              style={styles.checkbox}
              color={isTeluguChecked || isHindiChecked ? '#234B89' : undefined}
            />
            <Text style={styles.checkboxText}>{lang.title}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.translateButton} onPress={handleTranslateButtonPress}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.translateText}>Translate</Text>
          )}
        </TouchableOpacity>
        {enteredText && (
          <Translator
            from="en"
            to={transLang}
            value={enteredText}
            onTranslated={(t) => setResult(t)}
          />
        )}
      </View>
    </Animated.View>
  );
};

const AcceptButton = ({ onAccept }: { onAccept: () => void }) => (
  <Animated.View entering={FadeIn} exiting={FadeOut}>
    <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
      <Text style={styles.acceptText}>Accept</Text>
    </TouchableOpacity>
  </Animated.View>
);

// Main Component
const GroupChatScreen: React.FC = () => {
  const { selectedGroup: selectedGroupString } = useLocalSearchParams<{ selectedGroup: string }>();
  const selectedGroup: Group | null = useMemo(
    () => (selectedGroupString ? JSON.parse(selectedGroupString) : null),
    [selectedGroupString],
  );
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);
  const [groupUsers, setGroupUsers] = useState<Participants[]>([]);
  const [enteredText, setEnteredText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTagDialogVisible, setIsTagDialogVisible] = useState<boolean>(false);

  const groupUsersMemo = useMemo(() => groupUsers, [groupUsers]);

  const fetchGroupData = useCallback(async () => {
    if (!selectedGroup?.groupId) return;
    try {
      const [users, history] = await Promise.all([
        getGroupUsers(selectedGroup.groupId),
        getGroupChatHistory(selectedGroup.groupId),
      ]);
      setGroupUsers(users);
      const formattedMessages = history.map((chat: ChatMessageServer) => ({
        _id: uuidv4(),
        text: chat.messageText,
        createdAt: new Date(chat.createdOn),
        user: {
          _id: chat.senderId,
          name: users.find((u: Participants) => u.userId === chat.senderId)?.userName || 'Unknown',
          avatar: `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${users.find((u) => u.userId === chat.senderId)?.userName || 'User'}`,
        },
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching group data:', error);
    }
  }, [selectedGroup?.groupId]);

  useEffect(() => {
    if (!connection) return;

    const handleReceiveMessage = (
      senderId: number,
      message: string,
      groupName: string,
      groupId: number,
    ) => {
      setMessages((prev) =>
        GiftedChat.append(prev, [
          {
            _id: groupId || uuidv4(),
            text: message,
            createdAt: new Date(),
            user: {
              _id: senderId,
              name: groupUsers.find((u) => u.userId === senderId)?.userName || 'Unknown',
              avatar: `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${groupUsers.find((u) => u.userId === senderId)?.userName || 'User'}`,
            },
          },
        ]),
      );
    };

    const handleMemberAdded = (groupId: number, newMember: string) => {
      if (selectedGroup?.groupId === groupId) {
        fetchGroupData();
      }
    };

    connection.on('ReceiveGroupMessage', handleReceiveMessage);
    connection.on('GroupMemberAdded', handleMemberAdded);
    fetchGroupData();

    return () => {
      connection.off('ReceiveGroupMessage', handleReceiveMessage);
      connection.off('GroupMemberAdded', handleMemberAdded);
    };
  }, [connection, fetchGroupData, selectedGroup?.groupId, groupUsers]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!newMessages.length || !connection || connection.state !== 'Connected') return;
      const message = newMessages[0];
      try {
        await connection.invoke('SendMessageToGroup', selectedGroup?.groupId, message.text);
        setEnteredText('');
        fetchGroupData();
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [connection, selectedGroup?.groupId],
  );

  const handleTranslate = useCallback((trans: string) => {
    if (!trans || trans === 'Enter a URL') return;
    setTranslatedText(trans);
  }, []);

  const handleAcceptTranslation = useCallback(() => {
    setEnteredText(translatedText);
    setTranslatedText('');
  }, [translatedText]);

  const navigateToGroupDetails = useCallback(() => {
    router.push({
      pathname: '/GroupStack/GroupDetailsScreen',
      params: {
        group: JSON.stringify(selectedGroup),
        groupUsers: JSON.stringify(groupUsers),
      },
    });
  }, [selectedGroup, groupUsers]);

  // Handle status click
  const handleStatusClick = async (status: SelectedStatusTagProps) => {
    console.log(`Status clicked: ${status.statusName} (ID: ${status.eventTagStatusId})`);
    const updateStatus = await updateStatusOfTags(status.tagId, status.eventTagStatusId);
    console.log('voted succesfullt', updateStatus);
    // Add your custom function here, e.g., updateStatus(status);
  };

  const renderMessage = (props: any) => {
    const { currentMessage } = props;
    const isCurrentUser = currentMessage.user._id === user?.userId;

    // Split text into message and tag name (if applicable)
    const [messageText, tagName] = currentMessage.text.includes('\n')
      ? currentMessage.text.split('\n')
      : [currentMessage.text, null];

    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <View
          style={[
            styles.messageContainer,
            isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft,
          ]}>
          {!isCurrentUser && (
            <Image source={{ uri: currentMessage.user.avatar }} style={styles.messageAvatar} />
          )}
          <View style={styles.messageContent}>
            <Text style={styles.senderName}>{currentMessage.user.name}</Text>
            <View style={[styles.bubble, isCurrentUser ? styles.bubbleRight : styles.bubbleLeft]}>
              <Text style={[styles.bubbleText, { color: isCurrentUser ? '#FFF' : '#333' }]}>
                {messageText}
              </Text>
              {tagName && (
                <Text
                  style={[
                    styles.bubbleText,
                    { color: isCurrentUser ? '#D1C4E9' : '#0288D1', marginTop: 5 },
                  ]}>
                  {tagName}
                </Text>
              )}
              {currentMessage.customData?.statuses?.length > 0 && (
                <View style={styles.statusContainer}>
                  {currentMessage.customData.statuses.map((status: any) => (
                    <TouchableOpacity
                      key={status.eventTagStatusId}
                      style={styles.statusButton}
                      onPress={() => handleStatusClick(status)}>
                      <Text style={styles.statusText}>{status.statusName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>
              {currentMessage.createdAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {isCurrentUser && (
            <Image source={{ uri: currentMessage.user.avatar }} style={styles.messageAvatar} />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderDay = (props: any) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <Text style={styles.dayLabel}>
        {new Date(props.currentMessage.createdAt).toLocaleDateString('en-US', { weekday: 'long' })}
      </Text>
    </Animated.View>
  );

  const renderInputToolbar = (props: React.ComponentProps<typeof InputToolbar>) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        renderComposer={(composerProps) => (
          <View style={styles.composerContainer}>
            <Composer
              {...composerProps}
              textInputStyle={styles.input}
              placeholder="Enter a message..."
              placeholderTextColor="#757575"
            />
          </View>
        )}
        renderSend={(sendProps) => (
          <Send {...sendProps} containerStyle={styles.sendButton}>
            <IconSymbol size={24} name="send" color="#A08E67" />
          </Send>
        )}
      />
    );
  };
  const tagSendMessage = (tagMessage: TagMessageProp) => {
    if (!tagMessage.tag) return;

    const formattedText = `${tagMessage.message}\n${tagMessage.tag.name}`; // Message + Tag Name
    const statuses = tagMessage.tag.statuses; // Array of statuses
    const tagId = tagMessage.tag.eventTagId;
    setMessages((prev) =>
      GiftedChat.append(prev, [
        {
          _id: uuidv4(),
          text: formattedText,
          createdAt: new Date(),
          user: {
            _id: user?.userId!,
            name: user?.fullName,
            avatar: `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${user?.fullName}`,
          },
          // Custom property to store statuses
          customData: {
            statuses: statuses.map((status) => ({
              eventTagStatusId: status.eventTagStatusId,
              statusName: status.statusName,
              tagId: tagId,
            })),
          },
        },
      ]),
    );
  };
  if (isDialogVisible) {
    return (
      <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.dialogContainer}>
        <AddMembersToGroup
          setIsDialogVisible={setIsDialogVisible}
          selectedGroup={selectedGroup || { groupId: 0, groupName: '' }}
          groupUserList={groupUsers}
        />
      </Animated.View>
    );
  }

  if (isTagDialogVisible) {
    return (
      // <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.dialogContainer}>
      <SendTagMessage setIsTagDialogVisible={setIsTagDialogVisible} onSend={tagSendMessage} />
      // </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
          },
          headerLeft: () => (
            <HeaderLeft onBack={() => router.back()} groupName={selectedGroup?.groupName || ''} />
          ),
          headerTitle: () => (
            <HeaderTitle
              title={selectedGroup?.groupName || 'Group Chat'}
              onPress={navigateToGroupDetails}
            />
          ),
          headerRight: () => (
            <HeaderRight
              onAddMember={() => setIsDialogVisible(true)}
              onSendTagMessage={() => setIsTagDialogVisible(true)}
            />
          ),
        }}
      />
      <View style={styles.chatContainer}>
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: Number(user?.userId) || 0,
            name: user?.fullName || 'Unknown',
            avatar: `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${user?.fullName || 'User'}`,
          }}
          renderFooter={() => (messages.length === 0 ? <Placeholder /> : null)}
          onInputTextChanged={setEnteredText}
          text={enteredText}
          placeholder="Enter a message..."
          renderMessage={renderMessage}
          // renderDay={renderDay}
          renderInputToolbar={renderInputToolbar}
          inverted={true}
          // listViewProps={{
          //   contentContainerStyle: styles.chatListContent,
          // }}
        />
        <TranslateBar
          onTranslate={handleTranslate}
          enteredText={enteredText}
          setTranslatedText={setTranslatedText}
        />
        {translatedText && <Text style={styles.translatedText}>{translatedText}</Text>}
        {translatedText && <AcceptButton onAccept={handleAcceptTranslation} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fe',
  },
  chatContainer: {
    flex: 1,
  },
  chatListContent: {
    padding: 10,
    flexGrow: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginLeft: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  headerButton: {
    padding: 5,
  },
  headerIcon: {
    padding: 5,
    marginLeft: 10,
  },
  headerTitleContainer: {
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  translateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  translateButton: {
    backgroundColor: '#A08E67',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  translateText: {
    color: '#FFF',
    fontWeight: '600',
  },
  translatedText: {
    marginLeft: 10,
    marginVertical: 5,
    fontSize: 14,
    color: '#424242',
    backgroundColor: '#F6F8FE',
    padding: 8,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#43A047',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    margin: 10,
    elevation: 2,
  },
  acceptText: {
    color: '#FFF',
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
  },
  messageContainerLeft: {
    justifyContent: 'flex-start',
    marginRight: 50,
  },
  messageContainerRight: {
    justifyContent: 'flex-end',
    marginLeft: 50,
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 15,
    padding: 10,
    maxWidth: '100%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bubbleLeft: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 0,
  },
  bubbleRight: {
    backgroundColor: '#A08E67',
    borderBottomRightRadius: 0,
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#A08E67',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  dayLabel: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: '#A08E67',
    padding: 5,
    borderRadius: 10,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#f0f0f0',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    color: '#333',
    backgroundColor: '#F6F8FE',
  },
  sendButton: {
    padding: 5,
    marginLeft: 10,
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  checkbox: {
    marginRight: 5,
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
  },
  dialogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusButton: {
    backgroundColor: '#E0F7FA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#0277BD',
    fontWeight: '500',
  },
});

export default GroupChatScreen;

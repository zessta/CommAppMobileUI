import RenderMessage from '@/components/RenderMessage';
import TranslateBar from '@/components/TranslateBar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatMessageServer, Group, Participants } from '@/constants/Types';
import { getGroupChatHistory, getGroupUsers, updateStatusOfTags } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { groupMessageFormat, messageFormat } from '@/Utils/utils';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View ,Modal} from 'react-native';
import {
  Composer,
  GiftedChat,
  InputToolbar,
  IMessage as OriginalIMessage,
  Send,
} from 'react-native-gifted-chat';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import AddMembersToGroup from './AddMemberToGroup';
import SendTagMessage, { TagMessageProp } from './SendTagMessage';
import TagStatusUpdate from '@/components/TagStatusUpdate';
import TagStatusResponses from './TagStatusResponses';

export type SelectedStatusTagProps = {
  eventTagStatusId: number;
  statusName: string;
  tagId: number;
};

interface IMessage extends OriginalIMessage {
  customData?: {
    statuses?: SelectedStatusTagProps[];
  };
  eventTagId?: number | null;
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
    <TouchableOpacity onPress={onSendTagMessage} style={styles.headerIcon}>
      <IconSymbol size={24} name="poll" color="#A08E67" />
    </TouchableOpacity>
    <TouchableOpacity onPress={onAddMember} style={styles.headerIcon}>
      <IconSymbol size={24} name="adduser" color="#A08E67" />
    </TouchableOpacity>
  </View>
);

const HeaderTitle = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.headerTitleContainer}>
    <Text style={styles.headerTitle}>{title}</Text>
  </TouchableOpacity>
);

const Placeholder = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500); // Show placeholder after 0.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null; 

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Send a message to start the conversation</Text>
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
  const [isUpdateTagDialogVisible, setIsUpdateTagDialogVisible] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<number>();
  const [chatHistory, setChatHistory] = useState<ChatMessageServer[]>();
  // if (!user) {
  //   return (
  //     <View style={styles.container}>
  //       <Text>User not logged in</Text>
  //     </View>
  //   );
  // }

  const fetchGroupData = useCallback(async () => {
    if (!selectedGroup?.groupId) return;
    try {
      const [users, history] = await Promise.all([
        getGroupUsers(selectedGroup.groupId),
        getGroupChatHistory(selectedGroup.groupId),
      ]);
      setGroupUsers(users);
      setChatHistory(history);
      const formattedMessages: IMessage[] = await Promise.all(
        history.map(async (chat: ChatMessageServer) => {
          const formattedText = chat?.eventTagId
            ? `${chat.messageText}\n${chat.eventTagName}`
            : chat.messageText;
          const userName = users.find((u: Participants) => u.userId === chat.senderId)?.userName;

          return messageFormat({
            text: formattedText,
            userName: userName,
            senderId: chat.senderId,
            tagListResponse: null,
            createdOn: chat.createdOn,
            eventTagId: Number(chat?.eventTagId),
          });
        }),
      );
      setMessages(formattedMessages); // Ensure correct order for inverted chat
    } catch (error) {
      console.error('Error fetching group data:', error);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  useEffect(() => {
    if (!connection || connection.state !== 'Connected') return;

    const handleReceiveMessage = (
      senderId: number,
      message: string,
      groupName: string,
      groupId: number,
    ) => {
      const formattedMessage = groupMessageFormat({
        message: message,
        senderId: senderId,
        groupUsers: groupUsers,
      });
      setMessages((prev) => GiftedChat.append(prev, [formattedMessage]));
    };

    const handleMemberAdded = (groupId: number, newMember: string) => {
      if (selectedGroup?.groupId === groupId) {
        fetchGroupData();
      }
    };

    connection.on('ReceiveGroupMessage', handleReceiveMessage);
    connection.on('GroupMemberAdded', handleMemberAdded);

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
        fetchGroupData(); // Refresh messages after sending
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [connection, selectedGroup],
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

  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const handleStatusClick = async (currentUserMessage: any) => {
    if (currentUserMessage.user._id === user?.userId) {
      setSelectedTagId(currentUserMessage.eventTagId);
      setIsTagModalVisible(true);
    } else {
      setSelectedStatus(currentUserMessage.eventTagId);
      setIsUpdateTagDialogVisible(true);
    }
  };


  const tagSendMessage = async (tagMessage: TagMessageProp) => {
    // if (!tagMessage.tag || !connection || connection.state !== 'Connected') return;

    const formattedText = `${tagMessage.message}\n${tagMessage.tag.name}`;
    const tagId = tagMessage.tag.eventTagId;

    try {
      const sendMesRes = await connection!.invoke(
        'SendMessageToGroup',
        selectedGroup?.groupId,
        tagMessage.message,
      );
      if (sendMesRes) {
        await connection!.invoke(
          'AttachEventTagToMessage',
          Number(selectedGroup?.groupId),
          sendMesRes,
          Number(tagId),
        );
        const formatMessage = messageFormat({
          text: formattedText,
          senderId: user!.userId,
          userName: user!.fullName,
          tagListResponse: tagMessage.tag,
        });
        setMessages((prev) => GiftedChat.append(prev, [formatMessage]));
        Alert.alert('Success', 'Tag attached');
      }
      setEnteredText('');
    } catch (error) {
      console.error('Error sending tag message:', error);
      Alert.alert('Error', 'Failed to send tag message');
    }
  };

  const renderMessage = (props: any) => {
    return <RenderMessage messageProps={props} handleStatusClick={handleStatusClick} />;
  };

  const renderDay = (props: any) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <Text style={styles.dayLabel}>
        {new Date(props.currentMessage.createdAt).toLocaleDateString('en-US', { weekday: 'long' })}
      </Text>
    </Animated.View>
  );

  const renderInputToolbar = (props: React.ComponentProps<typeof InputToolbar>) => (
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

  // if (isUpdateTagDialogVisible) {
  //   return (
  //     <TagStatusUpdate
  //       selectedGroup={selectedGroup!}
  //       status={selectedStatus!}
  //       setIsUpdateTagDialogVisible={setIsUpdateTagDialogVisible}
  //     />
  //   );
  // }

  if (isTagDialogVisible) {
    return <SendTagMessage setIsTagDialogVisible={setIsTagDialogVisible} onSend={tagSendMessage} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#fff',
            // borderBottomWidth: 1,
            // borderBottomColor: '#f0f0f0',
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
      {isUpdateTagDialogVisible ? (
        <TagStatusUpdate
          selectedGroup={selectedGroup!}
          status={selectedStatus!}
          setIsUpdateTagDialogVisible={setIsUpdateTagDialogVisible}
        />
      ) : (
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
        renderInputToolbar={renderInputToolbar}
        inverted={true}
      />

      {/* Modal for TagStatusResponses */}
      <Modal
        visible={isTagModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTagModalVisible(false)}
      >
        <View style={styles.modalContainer}>
       
            {selectedTagId && (
            <TagStatusResponses
                    tagId={selectedTagId}
                            onClose={() => setIsTagModalVisible(false)} // Pass close function

            />
            )}
        </View>
      </Modal>
          <View style={styles.translateContainer}>
            <TouchableOpacity
              style={styles.translateButton}
              onPress={() => setIsTagDialogVisible(true)}>
              <IconSymbol size={24} name="poll" color="white" />

              {/* <Text style={styles.translateText}>Translate</Text> */}
            </TouchableOpacity>
          </View>
          {/* <TranslateBar
            onTranslate={handleTranslate}
            enteredText={enteredText}
            setTranslatedText={setTranslatedText}
          />
          {translatedText && (
            <>
              <Text style={styles.translatedText}>{translatedText}</Text>
              <AcceptButton onAccept={handleAcceptTranslation} />
            </>
          )} */}
        </View>
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

});

export default GroupChatScreen;

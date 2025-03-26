import RenderMessage from '@/components/RenderMessage';
import TranslateBar from '@/components/TranslateBar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatMessageServer, Group, Participants } from '@/constants/Types';
import { getGroupChatHistory, getGroupUsers, updateStatusOfTags } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { groupMessageFormat, messageFormat } from '@/Utils/utils';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
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
import { Fontisto, MaterialIcons } from '@expo/vector-icons';
import { blueColor, Colors } from '@/constants/Colors';

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

// Custom Header Component
const CustomHeader = ({
  onBack,
  groupName,
  title,
  onTitlePress,
  onAddMember,
  onSendTagMessage,
}: {
  onBack: () => void;
  groupName: string;
  title: string;
  onTitlePress: () => void;
  onAddMember: () => void;
  onSendTagMessage: () => void;
}) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerLeft}>
      <TouchableOpacity onPress={onBack} style={styles.headerButton}>
        <IconSymbol size={24} name="arrow-back" color={Colors.brightRed} />
      </TouchableOpacity>
      <Image
        source={{
          uri: `https://ui-avatars.com/api/?background=E5322D&color=FFF&name=${groupName || 'Default'}`,
        }}
        style={styles.avatar}
      />
    </View>
    <TouchableOpacity onPress={onTitlePress} style={styles.headerTitleContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
    </TouchableOpacity>
    <View style={styles.headerRight}>
      <TouchableOpacity onPress={onAddMember} style={styles.headerIcon}>
        <IconSymbol size={24} name="adduser" color={Colors.brightRed} />
      </TouchableOpacity>
    </View>
  </View>
);

// Placeholder Component (unchanged)
const Placeholder = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500);
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
  const [isTranslateBarVisible, setIsTranslateBarVisible] = useState<boolean>(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

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
      setMessages(formattedMessages);
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
        fetchGroupData();
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [connection, selectedGroup],
  );

  const handleTranslate = useCallback((trans: string) => {
    setEnteredText(trans);
  }, []);

  const navigateToGroupDetails = useCallback(() => {
    router.push({
      pathname: '/GroupStack/GroupDetailsScreen',
      params: {
        group: JSON.stringify(selectedGroup),
        groupUsers: JSON.stringify(groupUsers),
      },
    });
  }, [selectedGroup, groupUsers]);

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
          <IconSymbol size={24} name="send" color={Colors.brightRed} />
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

  return (
    <View style={styles.container}>
      <CustomHeader
        onBack={() => router.back()}
        groupName={selectedGroup?.groupName || ''}
        title={selectedGroup?.groupName || 'Group Chat'}
        onTitlePress={navigateToGroupDetails}
        onAddMember={() => setIsDialogVisible(true)}
        onSendTagMessage={() => setIsTagDialogVisible(true)}
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
          {isTagModalVisible && (
            <Modal
              visible={isTagModalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setIsTagModalVisible(false)}>
              <View style={styles.modalContainer}>
                {selectedTagId && (
                  <TagStatusResponses
                    tagId={selectedTagId}
                    onClose={() => setIsTagModalVisible(false)}
                  />
                )}
              </View>
            </Modal>
          )}
          {isTranslateBarVisible && (
            <TranslateBar
              onTranslate={handleTranslate}
              enteredText={enteredText}
              setTranslatedText={setTranslatedText}
            />
          )}
          <View style={styles.translateContainer}>
            <TouchableOpacity
              style={styles.translateButton}
              onPress={() => {
                setIsTagDialogVisible(true);
                setIsTranslateBarVisible(false);
              }}>
              <Fontisto
                name="hashtag"
                size={24}
                color={isTagDialogVisible ? Colors.brightRed : Colors.blueColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.translateButton}
              onPress={() => {
                setIsTranslateBarVisible(!isTranslateBarVisible);
                setIsTagDialogVisible(false);
              }}>
              <MaterialIcons
                name="translate"
                size={24}
                color={isTranslateBarVisible ? Colors.brightRed : Colors.blueColor}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isTagDialogVisible && (
        <SendTagMessage setIsTagDialogVisible={setIsTagDialogVisible} onSend={tagSendMessage} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 5,
  },
  headerIcon: {
    padding: 5,
    marginLeft: 10,
  },
  headerTitleContainer: {
    flex: 1,
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
    gap: 40,
  },
  translateButton: {
    // Add styling if needed
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
  dialogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default GroupChatScreen;
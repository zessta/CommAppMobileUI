import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatMessageServer, Group, Participants } from '@/constants/Types';
import { getGroupChatHistory, getGroupUsers } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bubble, GiftedChat, IMessage, MessageProps } from 'react-native-gifted-chat';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating unique message IDs
import AddMembersToGroup from './AddMemberToGroup';
import SendTag from './SendTag';

type GroupChatScreenProps = {
  selectedGroup: string;
};

export interface ICustomMessage extends IMessage {
  pollOptions?: {
    id: number;
    option: string;
    votes: number;
  }[] | null | undefined;
}

export interface ITag {
  description: string;
  eventTagId: number;
  name: string;
  statuses: {
    eventTagStatusId: number;
    statusName: string;
  }[];
}

const GroupChatScreen: React.FC = () => {
  const searchParams = useLocalSearchParams<GroupChatScreenProps>();
  const selectedGroup: Group = searchParams.selectedGroup
    ? JSON.parse(searchParams.selectedGroup)
    : null;

  const { user } = useUser(); // Access the user from context
  const connection = useSignalR(SOCKET_URL);
  const [messages, setMessages] = useState<ICustomMessage[]>([]);
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);
  const [groupUserList, setGroupUsersList] = useState<Participants[]>([]);
  const [isTagDialogVisible, setIsTagDialogVisible] = useState<boolean>(false);

  const handleIncomingMessage = useCallback((chatMes: ChatMessageServer) => {
    setMessages((prevMessages) =>
      GiftedChat.append(prevMessages, [
        {
          _id: chatMes.id || uuidv4(), // Use unique ID from server or generate if not available
          text: chatMes.messageText,
          createdAt: new Date(chatMes.createdOn).getTime(),
          user: { _id: chatMes.senderId, name: 'Test' }, // Replace with actual user data
        },
      ]),
    );
  }, []);

  useEffect(() => {
    if (connection) {
      connection.on('GroupMemberAdded', (groupId: number, newMember: string) => {
        console.log('GroupMemberAdded:', groupId, newMember);
      });

      connection.on('AddedToGroup', (groupId: number, groupName: string) => {
        console.log('AddedToGroup:', groupId, groupName);
      });

      getGroupConversationHistory();
    }

    return () => {
      if (connection) {
        connection.off('GroupMemberAdded');
        connection.off('AddedToGroup');
      }
    };
  }, [connection]);

  const getGroupConversationHistory = async () => {
    const groupUsers: Participants[] = await getGroupUsers(selectedGroup.groupId);
    setGroupUsersList(groupUsers);
    const groupChatHistory: ChatMessageServer[] = await getGroupChatHistory(selectedGroup.groupId);
    if (groupChatHistory.length) {
      const formattedMessages = groupChatHistory.map((chat: ChatMessageServer) => ({
        _id: chat.messageId || uuidv4(),
        text: chat.messageText,
        createdAt: new Date(chat.createdOn).getTime(),
        user: {
          _id: chat.senderId,
          name: groupUsers.find((user) => user.userId === chat.senderId)?.userName,
        },
      }));
      setMessages((prevMessages) => GiftedChat.append(prevMessages, formattedMessages));
    }
  };

  const onSendTagMessage = (tag?: ITag, message?: string) => {
    if(!tag) {
      alert('Please select a Tag');
      return;
    }
    if(!message || message?.trim() === '') {
      alert('Please enter a message');
      return;
    }
    //setting options for selecting poll
    const pollOptions = tag.statuses.map((status) => {
      const poll = {
        id: status.eventTagStatusId,
        option: status.statusName,
        votes: 0,
      }
      return poll;
    })
    const tagMessage: ICustomMessage = {
      _id: uuidv4(),
      text: message,
      createdAt: new Date().getTime(), 
      pollOptions: pollOptions,
      user: {
        _id: 105,
        // name: groupUsers.find((user) => user.userId === 105)?.userName,
      },
    }
    setMessages((prevMessages) => GiftedChat.append(prevMessages, [tagMessage]));
    setIsTagDialogVisible(false);
  }

  const onSend = useCallback(
    (newMessages: ICustomMessage[] = []) => {
      if (newMessages.length > 0) {
        const message = newMessages[0];
        if (connection && connection.state === 'Connected') {
          sendMessage(message.text);
        }
      }
    },
    [connection, user],
  );

  const sendMessage = async (messageText: string) => {
    try {
      await connection!.invoke('SendMessageToGroup', selectedGroup.groupId, messageText);
      console.log('coming here for sending mesg');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const handleReceivedMessage = useCallback(
    (senderName: string, senderId: number, message: string, groupName: string, groupId: number) => {
      console.log('recived mesaage', senderName, senderId, message, groupName, groupId);
      setMessages((prevMessages) =>
        GiftedChat.append(prevMessages, [
          {
            _id: groupId || uuidv4(),
            text: message,
            createdAt: new Date().getTime(),
            user: { _id: senderId, name: senderName },
          },
        ]),
      );
    },
    [user],
  );

  useEffect(() => {
    if (connection) {
      connection.on('ReceiveGroupMessage', handleReceivedMessage);
      return () => {
        connection.off('ReceiveGroupMessage', handleReceivedMessage);
      };
    }
  }, [connection, handleReceivedMessage]);

  const renderFooter = () => {
    if (messages.length === 0) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Send a message to start the conversation</Text>
        </View>
      );
    }
    return null;
  };

  const handleAddMember = () => {
    setIsDialogVisible(true);
    console.log('Add Member clicked');
  };

  const onPressGroupTitle = () => {
    router.push({
      pathname: '/GroupStack/GroupDetailsScreen',
      params: {
        group: JSON.stringify(selectedGroup),
        groupUsers: JSON.stringify(groupUserList),
      },
    });
  };

  const handleSendTag = () => setIsTagDialogVisible(true);

  const handleVote = (messageId: number, optionId: number) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg._id === messageId && msg.pollOptions) {
          return {
            ...msg,
            pollOptions: msg.pollOptions.map((opt) =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
          };
        }
        return msg;
      })
    );
  };

  // Custom render for poll messages
  const renderCustomMessage = (props) => {
    const { currentMessage } = props;
    if (currentMessage.pollOptions) {
      return (
        <View style={styles.pollContainer}>
          <Text style={styles.pollQuestion}>{currentMessage.text}</Text>
          {currentMessage.pollOptions.map((option : any) => (
            <TouchableOpacity
              key={option.id}
              style={styles.pollOption}
              onPress={() => handleVote(currentMessage._id, option.id)}
            >
              <Text style={styles.optionText}>
                {option.option} - ({option.votes})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return <Bubble {...props} />;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <TouchableOpacity
              onPress={() => onPressGroupTitle()}
              style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{selectedGroup.groupName}</Text>
            </TouchableOpacity>
          ),
          headerLargeStyle: { backgroundColor: 'blue' },
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                <IconSymbol size={28} name="arrow-back" color={'black'} />
              </TouchableOpacity>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${selectedGroup?.groupName || 'Default'}`,
                }}
                style={styles.avatar}
              />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.addButton} onPress={handleSendTag}>
                <IconSymbol size={28} name="poll" color={'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
                <IconSymbol size={28} name="adduser" color={'black'} />
              </TouchableOpacity>
            </View>
          ),
          headerTitleStyle: styles.headerTitle,
        }}
      />
      {!isDialogVisible ? (
        <GiftedChat
          messages={messages}
          onSend={(messages) => onSend(messages)}
          renderUsernameOnMessage={true}
          user={{
            _id: Number(user?.id),
            name: user?.name,
            avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${user?.name}`,
          }}
          renderMessage={renderCustomMessage}
          renderFooter={renderFooter}
          inverted
        />
      ) : (
        <AddMembersToGroup
          setIsDialogVisible={setIsDialogVisible}
          selectedGroup={selectedGroup}
          groupUserList={groupUserList}
        />
      )}
      {isTagDialogVisible ? <SendTag setIsTagDialogVisible={setIsTagDialogVisible} onSendTagMessage={onSendTagMessage} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  placeholderContainer: {
    padding: 10,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
    fontStyle: 'italic',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerButton: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 40, // Space for right buttons
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  pollContainer: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  pollQuestion: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  pollOption: {
    backgroundColor: 'white',
    color: 'black',
    padding: 8,
    marginVertical: 3,
    borderRadius: 5,
  },
  optionText: {
    color: "black",
    textAlign: "center",
  },

});

export default GroupChatScreen;

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { useUser } from '@/components/UserContext';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSignalR } from '@/services/signalRService';
import { SOCKET_URL } from '@/constants/Strings';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { ChatMessageServer, GroupList } from '@/constants/Types';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating unique message IDs
import { IconSymbol } from '@/components/ui/IconSymbol';
import AddMembersToGroup from './AddMemberToGroup';

type GroupChatScreenProps = {
  selectedGroup: string;
};

const GroupChatScreen: React.FC = () => {
  const searchParams = useLocalSearchParams<GroupChatScreenProps>();
  const selectedGroup: GroupList = searchParams.selectedGroup
    ? JSON.parse(searchParams.selectedGroup)
    : null;

  const { user } = useUser(); // Access the user from context
  const connection = useSignalR(SOCKET_URL);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);

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
        // alert(`You have been added to the group: ${group.GroupName}`);
      });

      connection.on('AddedToGroup', (groupId: number, groupName: string) => {
        console.log('AddedToGroup:', groupId, groupName);
        // alert(`A new member has been added to the group: ${group.GroupName}`);
      });

      getGroupChatHistory();
    }

    return () => {
      if (connection) {
        connection.off('GroupMemberAdded');
        connection.off('AddedToGroup');
      }
    };
  }, [connection]);

  const getGroupChatHistory = async () => {
    const groupChat = await connection!.invoke('GetGroupChatHistory', selectedGroup.GroupId);
    console.log('groupChat', groupChat);
    const groupMembers = await connection!.invoke('GetGroupMembers', selectedGroup.GroupId);
    console.log('groupMembers chatscreeb', groupMembers);
    if (groupChat.length) {
      const formattedMessages = groupChat.map((chat: ChatMessageServer) => ({
        _id: chat.id || uuidv4(),
        text: chat.messageText,
        createdAt: new Date(chat.createdOn).getTime(),
        user: { _id: chat.senderId, name: 'Test' }, // Replace with actual user data
      }));
      setMessages((prevMessages) => GiftedChat.append(prevMessages, formattedMessages));
    }
  };

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      // Check if the message is being sent by the current user
      if (newMessages.length > 0) {
        const message = newMessages[0];

        // Send the message via SignalR
        if (connection && connection.state === 'Connected') {
          sendMessage(message.text);
        }
      }
    },
    [connection, user],
  );

  const sendMessage = async (messageText: string) => {
    try {
      await connection!.invoke('SendMessageToGroup', selectedGroup.GroupId, messageText);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const handleReceivedMessage = useCallback(
    (senderName: string, senderId: number, message: string, groupName: string, groupId: number) => {
      setMessages((prevMessages) =>
        GiftedChat.append(prevMessages, [
          {
            _id: groupId || uuidv4(), // Use unique ID from server or generate if not available
            text: message,
            createdAt: new Date().getTime(),
            user: { _id: senderId, name: senderName }, // Replace with actual user data
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

  // Render a placeholder message when there are no messages
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
    // Implement the functionality to add a new member
    setIsDialogVisible(true);
    console.log('Add Member clicked');
    // Navigate to the screen where you can add members
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: selectedGroup.GroupName,
          headerLargeStyle: { backgroundColor: 'blue' },
          headerLeft: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 10,
                }}
                onPress={() => router.back()} // Use router.back() for back navigation in Expo Router
              >
                <IconSymbol size={28} name="arrow-back" color={'black'} />
              </TouchableOpacity>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?background=000000&color=FFF&name=Test`,
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  gap: 10,
                  rowGap: 10,
                  marginRight: 10, // Adds space between the avatar and the title
                }}
              />
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMember} // Handle the button press
            >
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
          ),
        }}
      />
      {!isDialogVisible ? (
        <GiftedChat
          messages={messages}
          onSend={(messages) => onSend(messages)}
          user={{
            _id: Number(user?.id),
            name: user?.name,
            avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${user?.name}`,
          }}
          renderFooter={renderFooter} // Add footer to show the placeholder
          inverted
        />
      ) : (
        <AddMembersToGroup setIsDialogVisible={setIsDialogVisible} selectedGroup={selectedGroup} />
      )}
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
  addButton: {
    paddingRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addButtonText: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});

export default GroupChatScreen;

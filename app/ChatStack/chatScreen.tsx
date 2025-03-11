import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSignalR } from '@/services/signalRService';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatDataProps } from '../(tabs)/chatListScreen';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { useRouter } from 'expo-router';

type ChatScreenProps = {
  receiverData: string;
  senderData: string;
  onlineUsers: string;
};

export interface UserInfo {
  UserName: string;
  UserId: number;
  ConnectionId: string;
}

export type ChatMessageServer = {
  conversationId: number;
  createdOn: string;
  messageId: string;
  messageStatus: number;
  messageText: string;
  messageType: number;
  senderId: number;
};

const ChatScreen: React.FC = () => {
  const searchParams = useLocalSearchParams<ChatScreenProps>();
  const receiverData = JSON.parse(searchParams.receiverData);
  const senderData = JSON.parse(searchParams.senderData);
  const onlineUsers = JSON.parse(searchParams.onlineUsers);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const connection = useSignalR(SOCKET_URL);

  const handleIncomingMessage = useCallback(
    (chatMes: ChatMessageServer, index: number, senderId: number, receiverId: number) => {
      const chatUser = chatMes.senderId === senderId ? senderId : receiverId;
      const chatUserName = chatMes.senderId === senderId ? senderData.name : receiverData.name;
      setMessages((prevMessages) =>
        GiftedChat.append(prevMessages, [
          {
            _id: index,
            text: chatMes.messageText,
            createdAt: Number(chatMes.createdOn),
            user: { _id: chatUser, name: chatUserName },
          },
        ]),
      );
    },
    [receiverData.name, senderData.name],
  );

  const setupConnection = useCallback(async () => {
    const testing = await connection!.invoke('GetUserList');
    const parsedTesting = JSON.parse(testing);
    setUsers(parsedTesting);

    const chatHisotry = await connection!.invoke(
      'GetChatHistory',
      Number(senderData.id),
      Number(receiverData.id),
    );
    if (chatHisotry.length) {
      chatHisotry.forEach((chat: ChatMessageServer, index: number) => {
        handleIncomingMessage(chat, index, Number(senderData.id), Number(receiverData.id));
      });
    }
    const testingGetUserChat = await connection!.invoke(
      'GetUserConversations',
      Number(senderData.id),
    );
  }, [connection, handleIncomingMessage, receiverData.id, senderData.id]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      setMessages((prevMessages) => GiftedChat.append(prevMessages, newMessages));

      if (!connection || connection.state !== 'Connected') {
        console.error('Cannot send message: SignalR connection is not established.');
        return;
      }

      const message = newMessages[0];
      sendMessage(message.text);
    },
    [connection, users],
  );

  const sendMessage = async (messageText: string) => {
    try {
      const receiverConnectionId = onlineUsers.find(
        (user: any) => user.UserName === receiverData.name,
      )?.ConnectionId;
      // Send the message to the server
      await connection!.invoke('SendMessageToUser', messageText, null, Number(receiverData.id));
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  // Handle the message reception via SignalR
  const handleReceivedMessage = useCallback(
    (
      senderUser: number,
      message: string,
      connectionID: string,
      receiverUser: number,
      messageId: number,
    ) => {
      // Add the received message to the chat UI
      setMessages((prevMessages) =>
        GiftedChat.append(prevMessages, [
          {
            _id: Math.random(),
            text: message,
            createdAt: Date.now(),
            user: { _id: receiverData.id, name: receiverData.name },
          },
        ]),
      );
    },
    [receiverData.name],
  );

  useEffect(() => {
    if (connection) {
      setupConnection();

      // Listen for incoming messages
      connection.on('ReceiveMessage', handleReceivedMessage);

      // Cleanup when the component is unmounted
      return () => {
        connection.off('ReceiveMessage', handleReceivedMessage);
      };
    }
  }, [connection, setupConnection, handleReceivedMessage]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: receiverData.name,
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
                {/* <Image
                source={require("path_to_your_back_arrow_icon")} // Add your back arrow image path here
                style={{ width: 24, height: 24, marginRight: 10 }}
              /> */}
              </TouchableOpacity>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${senderData.name}`,
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
        }}
      />
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: Number(senderData.id),
          name: senderData.name,
          avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${senderData.name}`,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default ChatScreen;

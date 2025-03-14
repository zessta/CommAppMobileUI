import { SOCKET_URL } from '@/constants/Strings';
import { ChatMessageServer } from '@/constants/Types';
import { getUsersChatHistory } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import * as signalR from '@microsoft/signalr';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { ChatDataProps } from '../(tabs)/chatListScreen';
import { IconSymbol } from '../../components/ui/IconSymbol';

type ChatScreenProps = {
  receiverData: string;
  senderData: string;
  conversationId: string;
};

const ChatScreen: React.FC = () => {
  const searchParams = useLocalSearchParams<ChatScreenProps>();
  const receiverData: ChatDataProps = JSON.parse(searchParams.receiverData);
  const senderData: ChatDataProps = JSON.parse(searchParams.senderData);
  const conversationId: number = Number(JSON.parse(searchParams.conversationId));
  const [messages, setMessages] = useState<IMessage[]>([]);
  const connection = useSignalR(SOCKET_URL);

  const handleIncomingMessage = useCallback(
    (chatMes: ChatMessageServer, index: number, senderId: number, receiverId: number) => {
      const chatUserName = chatMes.senderId === senderId ? senderData?.name : receiverData.name;
      setMessages((prevMessages) =>
        GiftedChat.append(prevMessages, [
          {
            _id: chatMes.messageId,
            text: chatMes.messageText,
            createdAt: Number(chatMes.createdOn),
            user: { _id: chatMes.senderId, name: chatUserName },
          },
        ]),
      );
    },
    [receiverData.name, senderData?.name],
  );

  const setupConnection = useCallback(async () => {
    if (!connection) return;
    const userChatHistoryData: ChatMessageServer[] = await getUsersChatHistory(conversationId);

    if (userChatHistoryData.length) {
      userChatHistoryData.reverse().forEach((chat: ChatMessageServer, index: number) => {
        handleIncomingMessage(chat, index, Number(senderData.id), Number(receiverData.id));
      });
    }

    // Listen for incoming messages
    connection.on('ReceiveMessage', handleReceivedMessage);
  }, [connection, handleIncomingMessage, receiverData.id, senderData.id, conversationId]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      setMessages((prevMessages) => GiftedChat.append(prevMessages, newMessages));

      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        console.error('Cannot send message: SignalR connection is not established.');
        return;
      }

      const message = newMessages[0];
      sendMessage(message.text);
    },
    [connection, senderData, receiverData],
  );

  const sendMessage = async (messageText: string) => {
    try {
      await connection!.invoke('SendMessageToUser', messageText, receiverData.id, 1);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const handleReceivedMessage = useCallback(
    (
      senderId: number,
      message: string,
      receiverId: number,
      messageId: number,
      attachmentId: number,
    ) => {
      // Add the received message to the chat UI
      setMessages((prevMessages) =>
        GiftedChat.append(prevMessages, [
          {
            _id: messageId, // Ensure unique message IDs
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

      return () => {
        if (connection) {
          // Cleanup the SignalR connection when the component unmounts
          connection.off('ReceiveMessage', handleReceivedMessage);
        }
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
              </TouchableOpacity>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${receiverData.name}`,
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
          name: senderData?.name,
          avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${senderData?.name}`,
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

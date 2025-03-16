import { SOCKET_URL } from '@/constants/Strings';
import { ChatDataProps, ChatMessageServer, ChatScreenProps } from '@/constants/Types';
import { getUsersChatHistory, uploadImage } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import * as signalR from '@microsoft/signalr';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Composer, GiftedChat, IMessage, InputToolbar, Send } from 'react-native-gifted-chat';
import { IconSymbol } from '../../components/ui/IconSymbol';

// Define the interface for the API response (adjust based on your API)
interface AttachmentUploadResponse {
  attachmentId: string;
}

const ChatScreen: React.FC = () => {
  const searchParams = useLocalSearchParams<ChatScreenProps>();
  const receiverData: ChatDataProps = JSON.parse(searchParams.receiverData);
  const senderData: ChatDataProps = JSON.parse(searchParams.senderData);
  const conversationId: number | undefined = searchParams?.conversationId
    ? Number(JSON.parse(searchParams?.conversationId))
    : undefined;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const connection = useSignalR(SOCKET_URL);

  // Request permission to access the gallery
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Sorry, we need media library permissions to make this work!',
          );
        }
      }
    })();
  }, []);

  const handleIncomingMessage = useCallback(
    (chatMes: ChatMessageServer, index: number, senderId: number, receiverId: number) => {
      const chatUserName: string =
        chatMes.senderId === senderId ? senderData?.name : receiverData.name;
      const message: IMessage = {
        _id: chatMes.messageId,
        text: chatMes.messageText,
        createdAt: Number(chatMes.createdOn),
        user: { _id: chatMes.senderId, name: chatUserName },
      };
      if (chatMes.attachmentId) {
        message.image = `${SOCKET_URL}/attachments/${chatMes.attachmentId}`;
      }
      setMessages((prevMessages) => GiftedChat.append(prevMessages, [message]));
    },
    [receiverData.name, senderData?.name],
  );

  const setupConnection = useCallback(async () => {
    if (!connection) return;
    if (conversationId) {
      const userChatHistoryData: ChatMessageServer[] = await getUsersChatHistory(conversationId);
      if (userChatHistoryData.length) {
        userChatHistoryData.reverse().forEach((chat: ChatMessageServer, index: number) => {
          handleIncomingMessage(chat, index, Number(senderData.id), Number(receiverData.id));
        });
      }
    }
    connection.on('ReceiveMessage', handleReceivedMessage);
  }, [connection, handleIncomingMessage, receiverData.id, senderData.id, conversationId]);

  const pickAndUploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri: string = result.assets[0].uri;
      const attachmentId: string | null = await uploadImage(uri);

      if (attachmentId) {
        const newMessage: IMessage = {
          _id: Math.random().toString(36).substring(7),
          text: '',
          createdAt: new Date(),
          user: {
            _id: Number(senderData.id),
            name: senderData?.name,
            avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${senderData?.name}`,
          },
          image: uri,
        };
        setMessages((prevMessages) => GiftedChat.append(prevMessages, [newMessage]));
        sendMessage('', attachmentId);
      }
    }
  };

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      setMessages((prevMessages) => GiftedChat.append(prevMessages, newMessages));
      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        console.error('Cannot send message: SignalR connection is not established.');
        return;
      }
      const message: IMessage = newMessages[0];
      sendMessage(message.text);
    },
    [connection, senderData, receiverData],
  );

  const sendMessage = async (messageText: string, attachmentId?: string) => {
    try {
      await connection!.invoke('SendMessageToUser', messageText, receiverData.id, 1, attachmentId);
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
      const newMessage: IMessage = {
        _id: messageId,
        text: message,
        createdAt: Date.now(),
        user: { _id: receiverData.id, name: receiverData.name },
      };
      if (attachmentId) {
        newMessage.image = `${SOCKET_URL}/attachments/${attachmentId}`;
      }
      setMessages((prevMessages) => GiftedChat.append(prevMessages, [newMessage]));
    },
    [receiverData.name],
  );

  useEffect(() => {
    if (connection) {
      setupConnection();
      return () => {
        if (connection) {
          connection.off('ReceiveMessage', handleReceivedMessage);
        }
      };
    }
  }, [connection, setupConnection, handleReceivedMessage]);

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

  // Custom renderInputToolbar with proper typing
  const renderInputToolbar = (props: React.ComponentProps<typeof InputToolbar>) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        renderComposer={(composerProps) => (
          <View style={styles.composerContainer}>
            <TouchableOpacity onPress={pickAndUploadImage} style={styles.imageButton}>
              <IconSymbol size={24} name="image" color="#000" />
            </TouchableOpacity>
            <Composer
              {...composerProps}
              textInputStyle={styles.textInput}
              placeholder="Type a message..."
            />
          </View>
        )}
        renderSend={(sendProps) => (
          <Send {...sendProps} containerStyle={styles.sendButton}>
            <IconSymbol size={24} name="paperplane.fill" color="#000" />
          </Send>
        )}
      />
    );
  };

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
                onPress={() => router.back()}>
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
                  marginRight: 10,
                }}
              />
            </View>
          ),
        }}
      />
      <GiftedChat
        messages={messages}
        onSend={(messages: IMessage[]) => onSend(messages)}
        user={{
          _id: Number(senderData?.id),
          name: senderData?.name,
          avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${senderData?.name}`,
        }}
        renderFooter={renderFooter}
        renderInputToolbar={renderInputToolbar}
      />
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
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 0, // Remove default border
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageButton: {
    padding: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
});

export default ChatScreen;

import { SOCKET_URL } from '@/constants/Strings';
import { ChatDataProps, ChatMessageServer, ChatScreenProps, UserDTO } from '@/constants/Types';
import { getFileById, getImageById, getUsersChatHistory, uploadFile } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import * as signalR from '@microsoft/signalr';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Composer,
  GiftedChat,
  IMessage,
  InputToolbar,
  Send,
  Bubble,
} from 'react-native-gifted-chat';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { v4 as uuidv4 } from 'uuid';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher'; // For opening downloaded files on Android
import * as MediaLibrary from 'expo-media-library';
import FileDownloader from '@/Utils/fileDownloader';
import { Colors } from '@/constants/Colors';

export interface AttachmentUploadResponse {
  attachmentId: number;
  fileName?: string;
  fileType?: string;
}

interface FileMessage extends IMessage {
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

const ChatScreen: React.FC = () => {
  const searchParams = useLocalSearchParams<ChatScreenProps>();
  const receiverData: ChatDataProps = JSON.parse(searchParams.receiverData);
  const senderData: UserDTO = JSON.parse(searchParams.senderData);
  const conversationId: number | undefined = searchParams?.conversationId
    ? Number(JSON.parse(searchParams?.conversationId))
    : undefined;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const connection = useSignalR(SOCKET_URL);
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your media library');
        return false;
      }
    }
    return true;
  };
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
    requestPermissions();
  }, []);

  const handleIncomingMessage = useCallback(
    async (chatMes: ChatMessageServer, index: number, senderId: number, receiverId: number) => {
      const chatUserName: string =
        chatMes.senderId === senderId ? senderData?.fullName : receiverData.name;
      const message: FileMessage = {
        _id: uuidv4(),
        text: chatMes.messageText,
        createdAt: Number(chatMes.createdOn),
        user: { _id: chatMes.senderId, name: chatUserName },
      };

      if (chatMes.attachmentId) {
        const fileResponse = await getFileById(chatMes.attachmentId);
        if (fileResponse) {
          if (fileResponse.fileType.startsWith('image/')) {
            message.image = fileResponse.uri;
          } else {
            message.fileUrl = fileResponse.uri;
            message.fileName = fileResponse.fileName;
            message.fileType = fileResponse.fileType;
          }
        }
      }
      setMessages((prevMessages) => GiftedChat.append(prevMessages, [message]));
    },
    [receiverData.name, senderData?.fullName],
  );

  const setupConnection = useCallback(async () => {
    if (!connection) return;
    if (conversationId) {
      const userChatHistoryData: ChatMessageServer[] = await getUsersChatHistory(conversationId);
      console.log('userChatHistoryData', userChatHistoryData);
      if (userChatHistoryData.length) {
        userChatHistoryData.reverse().forEach((chat: ChatMessageServer, index: number) => {
          handleIncomingMessage(chat, index, Number(senderData.userId), Number(receiverData.id));
        });
      }
    }
    connection.on('ReceiveMessage', handleReceivedMessage);
  }, [connection, handleIncomingMessage, receiverData.id, senderData.userId, conversationId]);

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

  const sendMessage = async (messageText: string, attachmentId?: number) => {
    try {
      await connection!.invoke('SendMessageToUser', messageText, receiverData.id, attachmentId);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const handleReceivedMessage = useCallback(
    async (
      senderId: number,
      message: string,
      receiverId: number,
      messageId: number,
      attachmentId: number,
    ) => {
      const newMessage: IMessage = {
        _id: uuidv4(),
        text: message,
        createdAt: Date.now(),
        user: { _id: receiverData.id, name: receiverData.name },
      };
      if (attachmentId) {
        const attachmentResponse = await getImageById(attachmentId);
        if (attachmentResponse) {
          newMessage.image = attachmentResponse;
        }
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = asset.fileName || uri.split('/').pop() || 'image.jpg';
      const mimeType = asset.mimeType || 'image/jpeg';

      await handleFileUpload(uri, fileName, mimeType);
    }
  };

  const pickDocument = async () => {
    const result: DocumentPicker.DocumentPickerResult = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      const { name, uri, mimeType } = result.assets[0];
      const fileName = name || (uri ? uri.split('/').pop() : 'document');
      const fileType = mimeType || 'application/octet-stream';

      await handleFileUpload(uri, fileName!, fileType);
    }
  };

  const handleFileUpload = async (uri: string, fileName: string, mimeType: string) => {
    const uploadResponse: AttachmentUploadResponse = await uploadFile(uri, fileName, mimeType);
    if (uploadResponse?.attachmentId) {
      const newMessage: FileMessage = {
        _id: uuidv4(),
        text: '',
        createdAt: new Date(),
        user: {
          _id: Number(senderData.userId),
          name: senderData?.fullName,
          avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${senderData?.fullName}`,
        },
      };

      if (mimeType.startsWith('image/')) {
        newMessage.image = uri;
      } else {
        newMessage.fileUrl = uri;
        newMessage.fileName = fileName;
        newMessage.fileType = mimeType;
      }

      setMessages((prevMessages) => GiftedChat.append(prevMessages, [newMessage]));
      sendMessage('', uploadResponse.attachmentId);
    }
  };

  const downloadFile = async (base64String: string, fileName: string) => {
    const files = [
      {
        url: base64String, // Base64 encoded file
        name: fileName, // Name of the file (with extension)
        mimeType: 'application/pdf', // MIME type for PDF file
      },
    ];
    FileDownloader.downloadFilesAsync(files, (directoryChange) => {
      console.log('Directory change:', directoryChange);
    });
  };

  const renderMessage = (props: { currentMessage?: IMessage }) => {
    const message = props.currentMessage as FileMessage;
    const isOwnMessage = message?.user._id === Number(senderData.userId);

    // File message rendering
    if (message?.fileUrl && message?.fileName) {
      return (
        <View style={[styles.bubble, isOwnMessage ? styles.rightBubble : styles.leftBubble]}>
          <TouchableOpacity
            style={styles.fileContainer}
            onPress={() => downloadFile(message.fileUrl!, message.fileName!)}>
            <MaterialCommunityIcons
              name="file-document"
              size={24}
              color={isOwnMessage ? '#fff' : '#000'}
            />
            <Text
              style={[styles.fileName, { color: isOwnMessage ? '#fff' : '#000' }]}
              numberOfLines={1}
              ellipsizeMode="middle">
              {message.fileName}
            </Text>
            <MaterialCommunityIcons
              name="download"
              size={24}
              color={isOwnMessage ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        </View>
      );
    }

    // Text/Image message rendering
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: styles.rightBubble,
          left: styles.leftBubble,
        }}
        textStyle={{
          right: { ...styles.messageText, color: '#fff' }, // White text for sent messages
          left: styles.messageText,
        }}
        containerStyle={{
          left: { marginBottom: 8 },
          right: { marginBottom: 8 },
        }}
      />
    );
  };
  const renderInputToolbar = (props: React.ComponentProps<typeof InputToolbar>) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        renderComposer={(composerProps) => (
          <View style={styles.composerContainer}>
            <View style={styles.attachmentButtons}>
              <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                <MaterialCommunityIcons name="image" size={24} color={Colors.blueColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={pickDocument} style={styles.imageButton}>
                <MaterialCommunityIcons name="file-document" size={24} color={Colors.blueColor} />
              </TouchableOpacity>
            </View>
            <Composer
              {...composerProps}
              textInputStyle={styles.textInput}
              placeholder="Type a message..."
            />
          </View>
        )}
        renderSend={(sendProps) => (
          <Send {...sendProps} containerStyle={styles.sendButton}>
            <IconSymbol size={24} name="paperplane.fill" color={Colors.brightRed} />
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
          headerTitleStyle: { fontSize: 16, fontWeight: 'bold' },
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
                <IconSymbol size={28} name="arrow-back" color={Colors.brightRed} />
              </TouchableOpacity>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?background=E5322D&color=FFF&name=${receiverData.name}`,
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
          _id: Number(senderData?.userId),
          name: senderData?.fullName,
          avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${senderData?.fullName}`,
        }}
        renderFooter={renderFooter}
        renderInputToolbar={renderInputToolbar}
        renderMessage={renderMessage}
        showUserAvatar={true}
        alwaysShowSend={true}
        keyboardShouldPersistTaps="handled"
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
    borderTopWidth: 0,
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
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  messageImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  attachmentButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubble: {
    // marginLeft: 50,
    marginVertical: 8, // Vertical spacing between messages
    marginHorizontal: 12, // Horizontal margin from screen edges
    width: '50%', // Limit bubble width
    borderRadius: 16,
    padding: 10,
    elevation: 1, // Slight shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    alignSelf: 'flex-end',
  },
  rightBubble: {
    backgroundColor: '#007AFF', // Blue for sent messages
    marginLeft: 50,
  },
  leftBubble: {
    backgroundColor: '#f0f0f0', // Light gray for received messages
    marginRight: 50,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
});

export default ChatScreen;

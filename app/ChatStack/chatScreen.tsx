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
import ImageView from "react-native-image-viewing";

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
  const [imageSelected, setImageSelected] = useState<string | null>(null);
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
    const messageTime = new Date(message?.createdAt || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (message?.image) {
      return (
        <View
          style={[
            styles.bubbleContainer,
            isOwnMessage ? styles.rightContainer : styles.leftContainer,
          ]}
        >
          <View style={[styles.bubble, isOwnMessage ? styles.rightBubble : styles.leftBubble]}>
            <TouchableOpacity onPress={() => setImageSelected(message.image ?? null)}>
              <Image
                source={{ uri: message.image }}
                style={styles.imageStyle}
              />
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    // File message rendering
    if (message?.fileUrl && message?.fileName) {
      return (
        <View
          style={[
            styles.bubbleContainer,
            isOwnMessage ? styles.rightContainer : styles.leftContainer,
          ]}>
          <View style={[styles.bubble, isOwnMessage ? styles.rightBubble : styles.leftBubble]}>
            <Text
              style={[styles.fileName, { color: Colors.blueColor }]}
              numberOfLines={1}
              ellipsizeMode="middle">
              {message.fileName}
            </Text>
            <TouchableOpacity
              style={styles.fileContainer}
              onPress={() => downloadFile(message.fileUrl!, message.fileName!)}>
              <MaterialCommunityIcons
                name="file-document"
                size={24}
                color={isOwnMessage ? Colors.blueColor : Colors.blueColor}
              />

              <MaterialCommunityIcons
                name="download"
                size={24}
                color={isOwnMessage ? Colors.blueColor : Colors.blueColor}
              />
            </TouchableOpacity>
            <Text style={[styles.timestamp, { color: Colors.blueColor }]}>{messageTime}</Text>
          </View>
          {/* Add tail for file messages */}
          {/* <View style={isOwnMessage ? styles.rightTail : styles.leftTail} /> */}
        </View>
      );
    }

    // Text/Image message rendering
    return (
      <View
        style={[
          styles.bubbleContainer,
          isOwnMessage ? styles.rightContainer : styles.leftContainer,
        ]}>
        <View style={[styles.bubble, isOwnMessage ? styles.rightBubble : styles.leftBubble]}>
          <Bubble
            {...props}
            wrapperStyle={{
              right: { backgroundColor: 'transparent' }, // We'll handle background in styles.rightBubble
              left: { backgroundColor: 'transparent' }, // We'll handle background in styles.leftBubble
            }}
            textStyle={{
              right: styles.messageTextRight,
              left: styles.messageTextLeft,
            }}
            containerStyle={{
              left: {},
              right: {},
            }}
          />
          <Text style={[styles.timestamp, { color: Colors.blueColor }]}>{messageTime}</Text>
        </View>
        {/* Add tail for text/image messages */}
        {/* <View style={isOwnMessage ? styles.rightTail : styles.leftTail} /> */}
      </View>
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
      <View style={styles.headerContainer}>
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
        <Text style={styles.headerTitle}>{receiverData.name}</Text>
      </View>
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
      {imageSelected && <ImageView
        images={[{uri: imageSelected}]}
        imageIndex={0}
        visible={true}
        onRequestClose={() => setImageSelected(null)}
      />}
    </View>
  );
};
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  imageStyle: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
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
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  bubbleContainer: {
    marginVertical: 6,
    marginHorizontal: 12,
    maxWidth: '75%',
  },
  leftContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row', // For tail alignment
  },
  rightContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse', // For tail alignment
  },
  bubble: {
    padding: 6, // Reduced from 10 to 6 to decrease height
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  rightBubble: {
    backgroundColor: '#F5F7FB', // WhatsApp green for sent messages
    borderTopRightRadius: 2, // Sharp corner on the right for sent messages
  },
  leftBubble: {
    backgroundColor: 'lightgrey', // White for received messages
    borderTopLeftRadius: 2, // Sharp corner on the left for received messages
  },
  messageTextRight: {
    fontSize: 16,
    lineHeight: 20, // Reduced from 22 to 20 to make text more compact
    color: '#000',
  },
  messageTextLeft: {
    fontSize: 16,
    lineHeight: 20, // Reduced from 22 to 20 to make text more compact
    color: '#000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2, // Reduced from 4 to 2 to decrease spacing
    alignSelf: 'flex-end',
    color: Colors.blueColor,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  fileName: {
    // marginLeft: 10,
    // marginRight: 10,
    fontSize: 16,
    flex: 1,
    fontWeight: 400,
  },
  // Tail styles for WhatsApp-like effect
  leftTail: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderRightWidth: 10,
    borderRightColor: '#FFFFFF', // Match left bubble color
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
    marginLeft: -1, // Adjust to align with bubble
  },
  rightTail: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderLeftWidth: 10,
    borderLeftColor: '#DCF8C6', // Match right bubble color
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
    marginRight: -1, // Adjust to align with bubble
  },
});

export default ChatScreen;

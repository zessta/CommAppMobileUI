import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { useLocalSearchParams } from "expo-router";
import { useSocket } from "@/components/SocketContext"; // assuming you have socket context set up
import { useSignalR } from "@/services/signalRService";
import { SOCKET_URL } from "@/constants/Strings";

type ChatScreenProps = {
  userName: string;
  userInputName: string;
};

export interface UserInfo {
  UserName: string;
  UserId: number;
  ConnectionId: string;
}

export type ChatMessageServer  = {
  conversationId: number;
  createdOn: string;
  messageId: string;
  messageStatus: number;
  messageText: string
  messageType: number;
  senderId: number
}

const ChatScreen: React.FC = () => {
  const { userName, userInputName } = useLocalSearchParams<ChatScreenProps>();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  // const connection = useSocket(); // Access the socket connection from context
  const connection = useSignalR(SOCKET_URL);  

  useEffect(() => {
    if(connection) {
      setupConnection();
    }
  }, [connection]);

  const setupConnection = async () => {
    const testing =  await connection!.invoke('GetUserList');
    const parsedTesting = JSON.parse(testing);
    console.log('parsedTesting', parsedTesting)
    const senderId = parsedTesting.length && parsedTesting?.find((user : any) => user.UserName === userInputName)?.UserId;
    const receiverId = parsedTesting.length && parsedTesting?.find((user : any) => user.UserName === userName)?.UserId;

    const chatHisotry =  await connection!.invoke('GetChatHistory', senderId, receiverId);
console.log('chatHisotry', chatHisotry);
if(chatHisotry.length){
  chatHisotry.forEach((chat: ChatMessageServer, index: number) => {
    handleIncomingMessage(chat, index, senderId, receiverId);
  });
}
// setMessages(chatHisotry)
    console.log('chat screen', testing)

    setUsers(parsedTesting);
    const testingGetUserChat =  await connection!.invoke('GetUserConversations', senderId);
    console.log('chat testingGetUserChat', testingGetUserChat)
  };

  const handleIncomingMessage = (chatMes : ChatMessageServer, index: number, senderId: number, receiverId: number) => {
    console.log('senderid', senderId)
    console.log('receiverId', receiverId)

    const chatUser = chatMes.senderId === senderId ? senderId : receiverId
    const chatUserName = chatMes.senderId === senderId ? userInputName : userName
    setMessages((prevMessages) =>
      GiftedChat.append(prevMessages, [
        {
          _id: index,
          text: chatMes.messageText,
          createdAt: Number(chatMes.createdOn),
          user: { _id: chatUser, name: chatUserName },
        },
      ])
    );
  };
  console.log('users - iutside',users)

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    console.log('newmessage', newMessages)
    setMessages((prevMessages) => GiftedChat.append(prevMessages, newMessages));
    console.log('users - onSend',users)

    if (!connection || connection.state !== "Connected") {
      console.error("Cannot send message: SignalR connection is not established.");
      return;
    }

    const message = newMessages[0];
    sendMessage(message.text);
  }, [connection]);

  const sendMessage = async (messageText: string) => {
    try {
      console.log('userName', userName)
        const senderConnectionId = users.find((user) => user.UserName === userName)?.ConnectionId;
        console.log('senderConnectionId', senderConnectionId)
      await connection!.invoke("SendMessageToUser", messageText, senderConnectionId);
      console.log("Message sent successfully.");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{ 
        _id: 5, name: userInputName,             
        avatar: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${senderUserName}`,
      }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default ChatScreen;

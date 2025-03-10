import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSocket } from "@/components/SocketContext"; // Assuming context is correctly set up
import { UserInfo } from "../ChatStack/chatScreen";
import * as SignalR from '@microsoft/signalr';
import { useSignalR } from "@/services/signalRService";
import { SOCKET_URL } from "@/constants/Strings";

// Sample chat data
const chatData = [
  { id: "1", name: "Chrome", time: "10:30 AM", lastMessage: "Hey! How are you?" },
  { id: "2", name: "Edge", time: "Yesterday", lastMessage: "Let's catch up soon." },
  { id: "3", name: "Incog", time: "Monday", lastMessage: "Did you check the document?" },
  { id: "4", name: "Test", time: "Sunday", lastMessage: "See you at the event!" },
];

type ChatScreenProps = {
  userInputName: string;
};

export interface GroupInfo {
  GroupId: number;
  GroupName: string;
  CreatorConnectionId: string;
  Members: UserInfo[];
}

const ChatListScreen = () => {
  const { userInputName } = useLocalSearchParams<ChatScreenProps>(); // Extract the parameter
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const connection = useSignalR(SOCKET_URL);  
  const router = useRouter();

  // Filter chat data based on the search text
  const filteredChats = chatData.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchText.toLowerCase())
  );
console.log('connection', connection) 
  // Join chat when the connection is available
  useEffect(() => {
    if (connection) {
      console.log('is connection is on')
      joinChat(userInputName);
    }
  }, [connection]);

  // Function to join chat and fetch groups
  const joinChat = async (user: string) => {
    try {
      await connection!.invoke("NewUser", user);
     
      const chatUserLists =  await connection!.invoke('GetUserList');
      const parsedChatUserLists = JSON.parse(chatUserLists);
          console.log('parsedChatUserLists', parsedChatUserLists)
          const userId = parsedChatUserLists.length && parsedChatUserLists?.find((user : any) => user.UserName === userInputName)?.UserId;
          const testingGetUserChat =  await connection!.invoke('GetUserConversations', userId);
          console.log('testingGetUserChat', testingGetUserChat)
          const chatHisotry =  await connection!.invoke('GetChatHistory', 3, 5);
          console.log('chatHisotry', chatHisotry);
    } catch (error) {
      console.error("Error joining chat:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search by name or message"
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close" size={20} color="#888" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatBox}
            onPress={() =>
              router.push({
                pathname: "/ChatStack/chatScreen",
                params: { userName: item.name, userInputName },
              })
            }
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.message}>{item.lastMessage}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  clearIcon: {
    marginLeft: 5,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 8,
  },
  chatBox: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginVertical: 5,
  },
  time: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
  },
});

export default ChatListScreen;

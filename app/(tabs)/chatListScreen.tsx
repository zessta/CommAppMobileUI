import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatConversationType, UserInfo } from '@/constants/Types';
import { getLastChatHistory } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { formattedTimeString } from '@/Utils/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type ChatDataProps = {
  id: number;
  name: string;
  time: string;
  lastMessage: string;
  connectionId?: string;
};
// Sample chat data
export const chatData: ChatDataProps[] = [
  {
    id: 1,
    name: 'Chrome',
    time: '10:30 AM',
    lastMessage: 'Hey! How are you?',
    connectionId: 'I6yM7Wr8IFll3kcBKVXQWg',
  },
  {
    id: 2,
    name: 'Edge',
    time: 'Yesterday',
    lastMessage: "Let's catch up soon.",
    connectionId: 'R-efzNHU894RGXYLoft9EA',
  },
  {
    id: 3,
    name: 'Incog',
    time: 'Monday',
    lastMessage: 'Did you check the document?',
    connectionId: 'HdrHx-u-Ou4cHrb7R49h5g',
  },
  {
    id: 6,
    name: 'Test',
    time: 'Sunday',
    lastMessage: 'See you at the event!',
    connectionId: 'R-efzNHU894RGXYLoft9EA',
  },
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
  const [searchText, setSearchText] = useState('');
  const [userChatHistory, setUserChatHistory] = useState<ChatConversationType[]>([]);
  const connection = useSignalR(SOCKET_URL);
  const router = useRouter();
  const { user } = useUser(); // Access the user from context

  // Join chat when the connection is available
  useEffect(() => {
    if (connection) {
      joinChat();
    }
  }, [connection]);

  // Filter chat data based on the search text
  const filteredChats = userChatHistory?.filter(
    (chat) =>
      chat.participants?.[0]?.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      chat?.lastMessage?.toLowerCase?.().includes(searchText.toLowerCase()),
  );

  // Function to join chat and fetch groups
  const joinChat = async () => {
    try {
      await connection!.invoke('NewUser', user?.name);
      const usersLastChatHistory: ChatConversationType[] = await getLastChatHistory(user?.id!);
      const filterOutGroups = usersLastChatHistory.filter((chat) => chat.groupId === null);
      setUserChatHistory(filterOutGroups);
    } catch (error) {
      console.error('Error joining chat:', error);
    }
  };
  console.log('filteredChats', filteredChats);

  const receiverDataObject = (item: ChatConversationType) => {
    return JSON.stringify({
      id: item.participants[0].userId,
      name: item.participants[0].userName,
      time: item.lastMessageTime,
      lastMessage: item.lastMessage,
    });
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
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close" size={20} color="#888" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.conversationId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatBox}
            onPress={() =>
              router.push({
                pathname: '/ChatStack/chatScreen',
                params: {
                  receiverData: receiverDataObject(item),
                  senderData: JSON.stringify(user),
                  conversationId: item.conversationId.toString(),
                },
              })
            }>
            <Text style={styles.name}>{item.participants[0].userName}</Text>
            <Text style={styles.message}>
              {item.lastMessageSenderId === user?.id ? 'You' : item.lastMessageSenderName}:{' '}
              {item.lastMessage}
            </Text>
            <Text style={styles.time}>{formattedTimeString(item.lastMessageTime)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
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
    color: '#000',
    paddingVertical: 8,
  },
  chatBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginVertical: 5,
  },
  time: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});

export default ChatListScreen;

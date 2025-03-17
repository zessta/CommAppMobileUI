import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Loader from '@/components/Loader'; // Assuming Loader is your loader component
import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatConversationType } from '@/constants/Types';
import { getLastChatHistory } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { formattedTimeString } from '@/Utils/utils';
import { useFocusEffect, useRouter } from 'expo-router';

const ChatListScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [userChatHistory, setUserChatHistory] = useState<ChatConversationType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const connection = useSignalR(SOCKET_URL);
  const router = useRouter();
  const { user } = useUser(); // Access the user from context

  // Join chat when the connection is available
  useEffect(() => {
    joinChat();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit the app?', [
          {
            text: 'No',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => BackHandler.exitApp(),
          },
        ]);
        return true; // Prevents the app from closing
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove(); // Remove listener when screen is not focused
    }, []),
  );

  useEffect(() => {
    if (connection) {
      newUserConnection();
    }
  }, [connection]);

  const newUserConnection = async () => {
    await connection!.invoke('NewUser', user?.name);
  };

  // Filter chat data based on the search text
  const filteredChats = userChatHistory?.filter(
    (chat) =>
      chat.participants?.[0]?.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      chat?.lastMessage?.toLowerCase?.().includes(searchText.toLowerCase()),
  );

  // Function to join chat and fetch groups
  const joinChat = async () => {
    try {
      const usersLastChatHistory: ChatConversationType[] = await getLastChatHistory(user?.id!);
      const filterOutGroups = usersLastChatHistory.filter((chat) => chat.groupId === null);
      setUserChatHistory(filterOutGroups);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error joining chat:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const receiverDataObject = (item: ChatConversationType) => {
    return JSON.stringify({
      id: item.participants[0].userId,
      name: item.participants[0].userName,
      time: item.lastMessageTime,
      lastMessage: item.lastMessage,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    joinChat();
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

      {/* Show Loader if data is still being fetched */}
      {loading ? <Loader loadingText="Loading chats..." /> : null}
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
              {!item.lastMessage && item.conversationId ? 'Attachment' : item.lastMessage}
            </Text>
            <Text style={styles.time}>{formattedTimeString(item.lastMessageTime)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.noContactsText}>No chat history found</Text>}
        refreshing={refreshing}
        onRefresh={onRefresh}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
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
    fontStyle: 'italic',
  },
  time: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  noContactsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
  },
});

export default ChatListScreen;

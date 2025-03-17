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
import Loader from '@/components/Loader';
import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatConversationType } from '@/constants/Types';
import { getLastChatHistory } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { formattedTimeString } from '@/Utils/utils';
import { useFocusEffect, useRouter } from 'expo-router';

// Interface for chat item props
interface ChatItemProps {
  item: ChatConversationType;
  onPress: () => void;
  user: any; // Replace 'any' with the actual user type if available
}

// Chat Item Component
const ChatItem: React.FC<ChatItemProps> = ({ item, onPress, user }) => {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle" size={40} color="#d4af37" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.participants[0].userName}</Text>
        <Text style={styles.messageText}>
          {item.lastMessageSenderId === user?.id ? 'You' : item.lastMessageSenderName}:{' '}
          {!item.lastMessage && item.conversationId ? 'Attachment' : item.lastMessage}
        </Text>
      </View>
      <Text style={styles.timeText}>{formattedTimeString(item.lastMessageTime)}</Text>
    </TouchableOpacity>
  );
};

// Main Component
const ChatListScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [userChatHistory, setUserChatHistory] = useState<ChatConversationType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const connection = useSignalR(SOCKET_URL);
  const router = useRouter();
  const { user } = useUser();

  // Effect to join chat on mount
  useEffect(() => {
    joinChat();
  }, []);

  // Handle back button press
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit the app?', [
          { text: 'No', onPress: () => null, style: 'cancel' },
          { text: 'Yes', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, []),
  );

  // Handle new user connection
  useEffect(() => {
    if (connection) {
      newUserConnection();
    }
  }, [connection]);

  // API and SignalR Methods
  const newUserConnection = async () => {
    await connection!.invoke('NewUser', user?.name);
  };

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

  const filteredChats = userChatHistory.filter(
    (chat) =>
      chat.participants?.[0]?.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      chat?.lastMessage?.toLowerCase()?.includes(searchText.toLowerCase()),
  );

  const onRefresh = () => {
    setRefreshing(true);
    joinChat();
  };

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Menu options will appear here', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Option 1', onPress: () => console.log('Option 1 selected') },
      { text: 'Option 2', onPress: () => console.log('Option 2 selected') },
    ]);
  };

  const toggleSearchBar = () => {
    setIsSearchVisible(!isSearchVisible);
    setSearchText('');
  };

  const handleChatPress = (item: ChatConversationType) => {
    router.push({
      pathname: '/ChatStack/chatScreen',
      params: {
        receiverData: JSON.stringify({
          id: item.participants[0].userId,
          name: item.participants[0].userName,
          time: item.lastMessageTime,
          lastMessage: item.lastMessage,
        }),
        senderData: JSON.stringify(user),
        conversationId: item.conversationId.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {isSearchVisible ? (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A08E67" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search by name or message"
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true}
            />
            <TouchableOpacity onPress={toggleSearchBar}>
              <Ionicons name="close" size={20} color="#A08E67" style={styles.clearIcon} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.headerTitle}>Chats</Text>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={toggleSearchBar}>
                <Ionicons name="search" size={24} color="#A08E67" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMenuPress}>
                <Ionicons name="ellipsis-vertical" size={24} color="#A08E67" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* White Container for FlatList */}
      <View style={styles.listContainer}>
        {loading ? <Loader loadingText="Loading chats..." /> : null}
        <View style={{ marginTop: 20 }}>
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.conversationId.toString()}
            renderItem={({ item }) => (
              <ChatItem item={item} onPress={() => handleChatPress(item)} user={user} />
            )}
            ListEmptyComponent={
              !loading ? <Text style={styles.noContactsText}>No chat history found</Text> : null
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fe',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    borderRadius: 8,
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
  iconContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  avatarContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  messageText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#A08E67',
    textAlign: 'right',
  },
  noContactsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    paddingVertical: 20,
  },
});

export default ChatListScreen;

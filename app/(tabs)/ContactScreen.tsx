import { useUser } from '@/components/UserContext';
import { ChatConversationType, UserListType } from '@/constants/Types';
import { getLastChatHistory, getUserList } from '@/services/api/auth';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

const ContactScreen = () => {
  const [contactsList, setContactsList] = useState<UserListType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLastMessageList, setUserLastMessageList] = useState<ChatConversationType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { user } = useUser();

  useEffect(() => {
    getContactsList();
    userLastChatMessage();
  }, []);

  const getContactsList = async () => {
    try {
      const getAllUsers: UserListType[] = await getUserList();
      const filteredUsers = getAllUsers.filter((users) => users.userId !== user?.id);
      setContactsList(filteredUsers);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const userLastChatMessage = async () => {
    try {
      const usersLastChatHistory: ChatConversationType[] = await getLastChatHistory(user?.id!);
      setUserLastMessageList(usersLastChatHistory);
    } catch (error) {
      console.error('Error fetching last chat history:', error);
    }
  };

  // Function to filter the contacts based on search query
  const filteredContacts = contactsList?.length
    ? contactsList.filter((contact) => contact.userName.includes(searchQuery.toLowerCase()))
    : [];

  // Function to handle navigation on clicking a contact card
  const handleContactPress = (contactId: UserListType) => {
    const receiverDataObject = JSON.stringify({
      id: contactId.userId,
      name: contactId.userName,
    });
    const conversationChatData = userLastMessageList
      .filter((chat) => chat.groupId === null)
      .find((userChat) => userChat.participants?.find((parc) => parc.userId === contactId.userId));
    router.push({
      pathname: '/ChatStack/chatScreen',
      params: {
        receiverData: receiverDataObject,
        senderData: JSON.stringify(user),
        conversationId: conversationChatData?.conversationId,
      },
    });
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await getContactsList(); // Re-fetch contacts and last messages
    await userLastChatMessage();
    setRefreshing(false);
  };

  // Render Item for FlatList
  const renderContact = ({ item }: { item: UserListType }) => (
    <TouchableOpacity onPress={() => handleContactPress(item)} style={styles.card}>
      {/* Profile Image */}
      <Image
        source={{
          uri: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${item.userName}`,
        }}
        style={styles.profileImage}
      />

      {/* Name and Last Message */}
      <View style={styles.textContainer}>
        {/* Participant's Username as Header */}
        <Text style={styles.username}>{item.userName}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search Contacts"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {/* Loader while data is being fetched */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loaderText}>Loading contacts...</Text>
        </View>
      ) : null}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item, index) => item.userId + index.toString()} // Unique key for each item
        contentContainerStyle={styles.scrollView}
        ListEmptyComponent={<Text style={styles.noContactsText}>No contacts found</Text>}
        refreshing={refreshing} // Enable pull-to-refresh
        onRefresh={handleRefresh} // Handle pull-to-refresh
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
  },
  scrollView: {
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row', // Align image and text side by side
    backgroundColor: '#f8f8f8',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center', // Vertically center the contents
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25, // Circular profile image
    marginRight: 16, // Space between the image and text
  },
  textContainer: {
    flex: 1, // Allow the text container to take up the remaining space
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#777',
  },
  noContactsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
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
  },
});

export default ContactScreen;

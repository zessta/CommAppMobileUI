import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/components/UserContext';
import { ChatConversationType, UserListType } from '@/constants/Types';
import { getLastChatHistory, getUserList } from '@/services/api/auth';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Interface for contact item props
interface ContactItemProps {
  item: UserListType;
  onPress: () => void;
  user: any; // Replace 'any' with the actual user type if available
}

// Contact Item Component
const ContactItem: React.FC<ContactItemProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${item.userName}`,
          }}
          style={styles.profileImage}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.userName}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Main Component
const ContactScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactsList, setContactsList] = useState<UserListType[]>([]);
  const [userLastMessageList, setUserLastMessageList] = useState<ChatConversationType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { user } = useUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [users, chatHistory] = await Promise.all([
        getUserList(),
        getLastChatHistory(user?.id!),
      ]);
      const filteredUsers = users.filter((u) => u.userId !== user?.id);
      const filteredChatHistory = chatHistory.filter((chat) => chat.groupId === null);
      setContactsList(filteredUsers);
      setUserLastMessageList(filteredChatHistory);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contactsList
    .filter((contact) => contact.userName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.userName.localeCompare(b.userName));

  // Group contacts by the first letter of the username
  const groupedContacts = filteredContacts.reduce(
    (acc, item) => {
      const firstLetter = item.userName.charAt(0).toUpperCase();
      if (!acc[firstLetter]) acc[firstLetter] = [];
      acc[firstLetter].push(item);
      return acc;
    },
    {} as { [key: string]: UserListType[] },
  );

  // Convert grouped object to array for SectionList
  const sections = Object.keys(groupedContacts)
    .sort()
    .map((letter) => ({
      title: letter,
      data: groupedContacts[letter],
    }));

  const handleContactPress = (item: UserListType) => {
    const receiverDataObject = JSON.stringify({ id: item.userId, name: item.userName });
    router.push({
      pathname: '/ChatStack/chatScreen',
      params: {
        receiverData: receiverDataObject,
        senderData: JSON.stringify(user),
        conversationId: userLastMessageList
          .filter((chat) => chat.groupId === null)
          .find((userChat) => userChat.participants?.find((parc) => parc.userId === item.userId))
          ?.conversationId.toString(),
      },
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
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
    setSearchQuery('');
  };

  const handleBackPress = () => {
    router.back(); // Navigate to the previous screen
  };

  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {isSearchVisible ? (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A08E67" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search by name"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity onPress={toggleSearchBar}>
              <Ionicons name="close" size={20} color="#A08E67" style={styles.clearIcon} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="#A08E67" style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contacts</Text>
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

      {/* White Container for SectionList */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Loading contacts...</Text>
          </View>
        ) : null}
        <SectionList
          sections={sections}
          renderItem={({ item }) => (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <ContactItem item={item} onPress={() => handleContactPress(item)} user={user} />
            </Animated.View>
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          keyExtractor={(item) => item.userId.toString()}
          ListEmptyComponent={
            !loading ? <Text style={styles.noContactsText}>No contacts found</Text> : null
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
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
  backIcon: {
    marginRight: 10, // Add spacing between back icon and title
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    flex: 1, // Allow title to take remaining space
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FE',
    borderRadius: 8,
  },
  searchIcon: {
    marginLeft: 10,
    marginRight: 5,
  },
  clearIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
    backgroundColor: 'transparent',
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
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234B89',
    marginTop: 10,
  },
  noContactsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    paddingVertical: 20,
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

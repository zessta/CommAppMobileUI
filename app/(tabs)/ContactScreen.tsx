import { useUser } from '@/components/UserContext';
import { UserListType } from '@/constants/Types';
import { getUserList } from '@/services/api/auth';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ContactScreen = () => {
  const [contactsList, setContactsList] = useState<UserListType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useUser(); // Access the user from context

  useEffect(() => {
    getContactsList();
  }, []);

  const getContactsList = async () => {
    const getAllUsers: UserListType[] = await getUserList();
    console.log('getAllUsers', getAllUsers);
    setContactsList(getAllUsers);
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

    router.push({
      pathname: '/ChatStack/chatScreen',
      params: {
        receiverData: receiverDataObject,
        senderData: JSON.stringify(user),
      },
    });
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

        {/* Last Message */}
        {/* <Text style={styles.lastMessage}>{item.lastMessage}</Text> */}
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

      {/* Contacts List using FlatList */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item, index) => item.userId + index.toString()} // Unique key for each item
        contentContainerStyle={styles.scrollView}
        ListEmptyComponent={<Text style={styles.noContactsText}>No contacts found</Text>}
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
});

export default ContactScreen;

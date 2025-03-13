import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatLastConversationList } from '@/constants/Types';
import { useSignalR } from '@/services/signalRService';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ContactScreen = () => {
  const connection = useSignalR(SOCKET_URL);
  const [contactsList, setContactsList] = useState<ChatLastConversationList[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useUser(); // Access the user from context

  useEffect(() => {
    if (connection) {
      getContactsList();
    }
  }, [connection]);

  const getContactsList = async () => {
    const chatLastConversations = await connection!.invoke('GetUserConversations');
    setContactsList(chatLastConversations);
  };

  // Function to filter the contacts based on search query
  const filteredContacts = contactsList?.length
    ? contactsList.filter((contact) =>
        contact.participants[0]?.userName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  // Function to handle navigation on clicking a contact card
  const handleContactPress = (contactId: ChatLastConversationList) => {
    const receiverDataObject = JSON.stringify({
      id: contactId.participants[0].userId,
      name: contactId.participants[0].userName,
      time: contactId.lastMessageTime,
      lastMessage: contactId.lastMessage,
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
  const renderContact = ({ item }: { item: ChatLastConversationList }) => (
    <TouchableOpacity onPress={() => handleContactPress(item)} style={styles.card}>
      {/* Profile Image */}
      <Image
        source={{
          uri: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${item.participants[0].userName}`,
        }}
        style={styles.profileImage}
      />

      {/* Name and Last Message */}
      <View style={styles.textContainer}>
        {/* Participant's Username as Header */}
        <Text style={styles.username}>{item.participants[0].userName}</Text>

        {/* Last Message */}
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
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
        keyExtractor={(item, index) => item.participants[0].userId + index.toString()} // Unique key for each item
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

import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Button,
  ScrollView,
  Modal,
} from 'react-native';
import { useUser } from '@/components/UserContext';
import { ChatLastConversationList, UserInfo } from '@/constants/Types';
import { useSignalR } from '@/services/signalRService';
import { SOCKET_URL } from '@/constants/Strings';
import Checkbox from 'expo-checkbox';

const CreateGroup = ({
  setIsDialogVisible,
}: {
  setIsDialogVisible: Dispatch<SetStateAction<boolean>>;
}) => {
  const { user } = useUser(); // Access the user from context
  const connection = useSignalR(SOCKET_URL);
  const [groupName, setGroupName] = useState<string>('');
  const [contactsList, setContactsList] = useState<ChatLastConversationList[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]); // To track selected contacts
  const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([]);
  useEffect(() => {
    if (connection) {
      getContactsList();
    }
  }, [connection]);

  const getContactsList = async () => {
    const chatUserLists = await connection!.invoke('GetUserList');
    setOnlineUsers(JSON.parse(chatUserLists));
    const chatLastConversations = await connection!.invoke('GetUserConversations', user?.id);
    setContactsList(chatLastConversations);
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prevSelectedContacts) => {
      if (prevSelectedContacts.includes(contactId)) {
        return prevSelectedContacts.filter((id) => id !== contactId); // Deselect contact
      } else {
        return [...prevSelectedContacts, contactId]; // Select contact
      }
    });
  };

  const createNewGroup = async () => {
    if (groupName.trim() === '') {
      alert('Please enter a group name');
      return;
    }

    if (selectedContacts.length === 0) {
      alert('Please select at least one member for the group');
      return;
    }
    // Find the selected users' connection IDs from the online users
    const findSelectedConnectionIds = selectedContacts
      .map((id) => {
        const user = onlineUsers?.find((user) => user.UserId === Number(id));
        return user ? user.ConnectionId : null; // Returns the connection ID or null if not found
      })
      .filter((connectionId) => connectionId !== null); // Remove null values if no connection ID is found
    const findSenderConnectionId = onlineUsers?.find((users) => users.UserId === user?.id);
    findSelectedConnectionIds.push(findSenderConnectionId?.ConnectionId!);
    if (findSelectedConnectionIds.length === 0) {
      alert('No selected users are online');
      return;
    }

    // Now invoke the 'CreateGroup' method with the group name and selected connection IDs
    await connection!.invoke('CreateGroup', groupName, findSelectedConnectionIds);

    alert('Group created successfully');
    setIsDialogVisible(false); // Close the modal after creation
  };

  return (
    <View style={styles.scrollContainer}>
      <View style={styles.dialogContainer}>
        <Text style={styles.dialogTitle}>Create New Group</Text>

        {/* Group Name Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter Group Name"
          value={groupName}
          onChangeText={setGroupName}
        />

        {/* Contacts List - Allowing users to select members */}
        <Text style={styles.label}>Select Members</Text>
        <FlatList
          data={contactsList}
          renderItem={({ item }) => (
            <View style={styles.contactCard}>
              <Checkbox
                value={selectedContacts.includes(item.participants?.[0]?.userId.toString())}
                onValueChange={() =>
                  toggleContactSelection(item.participants?.[0]?.userId.toString())
                }
                style={styles.checkbox}
              />
              <Text style={styles.contactName}>{item.participants?.[0]?.userName}</Text>
            </View>
          )}
          keyExtractor={(item) => item.participants?.[0]?.userId.toString()}
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button title="Save" onPress={createNewGroup} />
          <Button title="Cancel" onPress={() => setIsDialogVisible(false)} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20, // Ensure scrollable space at the bottom
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 20,
    width: '100%',
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    width: '100%',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    width: '100%',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    // backgroundColor: '#f8f8f8',
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  contactName: {
    fontSize: 16,
    marginLeft: 10,
    width: '80%', // Allow the name to take up most of the space
  },
  checkbox: {
    marginRight: 10,
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default CreateGroup;

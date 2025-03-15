import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { UserListType } from '@/constants/Types';
import { getUserList } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import Checkbox from 'expo-checkbox';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CreateGroup = ({
  setIsDialogVisible,
}: {
  setIsDialogVisible: Dispatch<SetStateAction<boolean>>;
}) => {
  const { user } = useUser(); // Access the user from context
  const connection = useSignalR(SOCKET_URL);
  const [groupName, setGroupName] = useState<string>('');
  const [contactsList, setContactsList] = useState<UserListType[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]); // To track selected contacts

  useEffect(() => {
    getContactsList();
  }, []);

  const getContactsList = async () => {
    const getAllUsers: UserListType[] = await getUserList();
    const filterOutUser = getAllUsers.filter((contacts) => contacts.userId !== user?.id);
    setContactsList(filterOutUser);
  };

  const toggleContactSelection = (contactId: number) => {
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

    selectedContacts.push(user?.id!);

    // Now invoke the 'CreateGroup' method with the group name and selected connection IDs
    await connection!.invoke('CreateGroup', groupName, selectedContacts);

    alert('Group created successfully');
    setIsDialogVisible(false); // Close the modal after creation
  };

  return (
    <Modal
      visible={true} // Ensure the modal is always visible when calling CreateGroup
      animationType="slide"
      transparent
      onRequestClose={() => setIsDialogVisible(false)}>
      <SafeAreaView style={styles.modalContainer}>
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
                  value={selectedContacts.includes(item.userId)}
                  onValueChange={() => toggleContactSelection(item.userId)}
                  style={styles.checkbox}
                />
                <Text style={styles.contactName}>{item.userName}</Text>
              </View>
            )}
            keyExtractor={(item) => item.userId.toString()}
          />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={createNewGroup}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDialogVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  },
  dialogContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
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
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
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
    width: '80%',
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
  addButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CreateGroup;

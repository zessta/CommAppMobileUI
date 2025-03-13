import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatLastConversationList, GroupList, UserInfo } from '@/constants/Types';
import { useSignalR } from '@/services/signalRService';
import Checkbox from 'expo-checkbox';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const AddMembersToGroup = ({
  setIsDialogVisible,
  selectedGroup,
}: {
  setIsDialogVisible: Dispatch<SetStateAction<boolean>>;
  selectedGroup: GroupList;
}) => {
  const { user } = useUser(); // Access the user from context
  const connection = useSignalR(SOCKET_URL);
  const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([]);
  const [contactsList, setContactsList] = useState<ChatLastConversationList[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null); // Track the selected contact ID

  useEffect(() => {
    if (connection) {
      getContactsList();
      connection.on('GroupMemberAdded', (groupId: number, newMember: string) => {
        console.log('GroupMemberAdded:', groupId, newMember);
      });
      connection.on('AddedToGroup', (groupId: number, groupName: string) => {
        console.log('AddedToGroup:', groupId, groupName);
      });
    }
  }, [connection]);

  const getContactsList = async () => {
    const chatUserLists = await connection!.invoke('GetUserList');
    setOnlineUsers(JSON.parse(chatUserLists));
    const chatLastConversations = await connection!.invoke('GetUserConversations');
    setContactsList(chatLastConversations);
    const groupMembers = await connection!.invoke('GetGroupMembers', selectedGroup.GroupId);
    console.log('groupMembers', groupMembers);
  };

  const toggleContactSelection = (contactId: string) => {
    if (selectedContact === contactId) {
      // If the same contact is clicked again, unselect it
      setSelectedContact(null);
    } else {
      // Set the selected contact
      setSelectedContact(contactId);
    }
  };

  const addMemberToGroup = async () => {
    if (!selectedContact) {
      alert('Please select a member for the group');
      return;
    }
    console.log('selectedContact', selectedContact);

    // Find the selected user's connection ID from the online users
    const selectedConnectionId = onlineUsers?.find(
      (user) => user.UserId === Number(selectedContact),
    )?.ConnectionId;

    if (!selectedConnectionId) {
      alert('Selected user is not online');
      return;
    }
    console.log('selectedConnectionId', selectedConnectionId);

    // Now invoke the 'AddMemberToGroup' method with the group name and selected connection IDs
    await connection!.invoke('AddMemberToGroup', selectedGroup.GroupId, Number(selectedContact));

    alert('Member added successfully');
    setIsDialogVisible(false); // Close the modal after adding the member
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent
      onRequestClose={() => setIsDialogVisible(false)}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.dialogContainer}>
          <Text style={styles.dialogTitle}>Add Member to Group</Text>

          {/* Contacts List - Allowing users to select a member */}
          <Text style={styles.label}>Select a Member</Text>
          <FlatList
            data={contactsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.contactCard,
                  selectedContact === item.participants?.[0]?.userId.toString() &&
                    styles.selectedContact,
                ]}
                onPress={() => toggleContactSelection(item.participants?.[0]?.userId.toString())}>
                <Checkbox
                  value={selectedContact === item.participants?.[0]?.userId.toString()}
                  onValueChange={() =>
                    toggleContactSelection(item.participants?.[0]?.userId.toString())
                  }
                  style={styles.checkbox}
                />
                <Text style={styles.contactName}>{item.participants?.[0]?.userName}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.participants?.[0]?.userId.toString()}
            contentContainerStyle={styles.contactListContainer}
          />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={addMemberToGroup}>
              <Text style={styles.buttonText}>Add Member</Text>
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
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'stretch',
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contactListContainer: {
    marginBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f7f7f7',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  selectedContact: {
    backgroundColor: '#e0f7fa', // Highlight selected contact
  },
  contactName: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1, // Allow the name to take up the remaining space
  },
  checkbox: {
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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

export default AddMembersToGroup;

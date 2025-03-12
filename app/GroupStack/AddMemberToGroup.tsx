import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { View, Text, StyleSheet, FlatList, Button } from 'react-native';
import { useUser } from '@/components/UserContext';
import { ChatLastConversationList, GroupList, UserInfo } from '@/constants/Types';
import { useSignalR } from '@/services/signalRService';
import { SOCKET_URL } from '@/constants/Strings';
import Checkbox from 'expo-checkbox';

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
        // alert(`You have been added to the group: ${group.GroupName}`);
      });
      connection.on('AddedToGroup', (groupId: number, groupName: string) => {
        console.log('AddedToGroup:', groupId, groupName);
        // alert(`A new member has been added to the group: ${group.GroupName}`);
      });
    }
  }, [connection]);

  const getContactsList = async () => {
    const chatUserLists = await connection!.invoke('GetUserList');
    setOnlineUsers(JSON.parse(chatUserLists));
    const chatLastConversations = await connection!.invoke('GetUserConversations', user?.id);
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
    await connection!.invoke('AddMemberToGroup', selectedGroup.GroupId, selectedConnectionId);

    alert('Member added successfully');
    // setIsDialogVisible(false); // Close the modal after adding the member
  };

  return (
    <View style={styles.scrollContainer}>
      <View style={styles.dialogContainer}>
        <Text style={styles.dialogTitle}>Add Member to Group</Text>

        {/* Contacts List - Allowing users to select a member */}
        <Text style={styles.label}>Select a Member</Text>
        <FlatList
          data={contactsList}
          renderItem={({ item }) => (
            <View style={styles.contactCard}>
              <Checkbox
                value={selectedContact === item.participants?.[0]?.userId.toString()} // Check if this contact is selected
                onValueChange={() =>
                  toggleContactSelection(item.participants?.[0]?.userId.toString())
                } // Toggle selection
                style={styles.checkbox}
              />
              <Text style={styles.contactName}>{item.participants?.[0]?.userName}</Text>
            </View>
          )}
          keyExtractor={(item) => item.participants?.[0]?.userId.toString()}
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button title="Add Member" onPress={addMemberToGroup} />
          <Button title="Cancel" onPress={() => setIsDialogVisible(false)} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default AddMembersToGroup;

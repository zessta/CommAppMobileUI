import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { Group, Participants, UserListType } from '@/constants/Types';
import { getUserList } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

const AddMembersToGroup = ({
  setIsDialogVisible,
  selectedGroup,
  groupUserList,
}: {
  setIsDialogVisible: Dispatch<SetStateAction<boolean>>;
  selectedGroup: Group;
  groupUserList: Participants[];
}) => {
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);
  const [contactsList, setContactsList] = useState<UserListType[]>([]);
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  useEffect(() => {
    if (connection) {
      getContactsList();
      connection.on('GroupMemberAdded', (groupId: number, newMember: string) => {
        console.log('GroupMemberAdded:', groupId, newMember);
      });
      connection.on('AddedToGroup', (groupId: number, groupName: string) => {
        console.log('AddedToGroup:', groupId, groupName);
      });
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [connection]);

  const getContactsList = async () => {
    const getAllUsers: UserListType[] = await getUserList();
    if (getAllUsers.length) {
      const filteredUsers = getAllUsers.filter(
        (contact) => !groupUserList.some((groupUser) => groupUser.userId === contact.userId),
      );
      setContactsList(filteredUsers);
    }
  };

  const toggleContactSelection = (contactId: number) => {
    setSelectedContact(selectedContact === contactId ? null : contactId);
  };

  const addMemberToGroup = async () => {
    if (!selectedContact) return alert('Please select a member to add');
    await connection!.invoke('AddMemberToGroup', selectedGroup.groupId, selectedContact);
    alert('Member added successfully');
    setIsDialogVisible(false);
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
    ]).start(() => setIsDialogVisible(false));
  };

  return (
    <Modal visible={true} animationType="none" transparent onRequestClose={closeModal}>
      <SafeAreaView style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.dialogContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}>
          <LinearGradient
            colors={['#ffffff', '#f7f9fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}>
            <Text style={styles.dialogTitle}>Add Member to Group</Text>

            <Text style={styles.label}>Select a Member</Text>
            <FlatList
              data={contactsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.contactCard,
                    selectedContact === item.userId && styles.selectedContact,
                  ]}
                  onPress={() => toggleContactSelection(item.userId)}>
                  <Checkbox
                    value={selectedContact === item.userId}
                    onValueChange={() => toggleContactSelection(item.userId)}
                    style={styles.checkbox}
                    color={selectedContact === item.userId ? '#4a90e2' : '#ccc'}
                  />
                  <Text style={styles.contactName}>{item.userName}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={() => uuidv4()}
              // contentContainerStyle={styles.contactListContainer}
              style={styles.contactList} // Added style to limit height and enable scroll
            />

            {/* Buttons Container (Fixed at Bottom) */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={addMemberToGroup}>
                <LinearGradient
                  colors={['#4a90e2', '#357abd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButton}>
                  <Text style={styles.buttonText}>Add Member</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContainer: {
    width: '90%',
    maxHeight: '80%', // Limits the overall dialog height
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  gradientBackground: {
    padding: 20,
    flex: 1, // Ensures the gradient background fills the container
  },
  dialogTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 15,
  },
  contactList: {
    maxHeight: 300, // Fixed height for the FlatList to enable scrolling
    marginBottom: 20, // Space before buttons
  },
  contactListContainer: {
    paddingBottom: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e6e8',
  },
  selectedContact: {
    backgroundColor: '#e8f4ff',
    borderColor: '#4a90e2',
  },
  contactName: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  addButton: {
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default AddMembersToGroup;

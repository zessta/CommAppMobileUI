import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { Group, Participants, UserListType } from '@/constants/Types';
import { getUserList } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import React, { Dispatch, SetStateAction, useEffect, useState, useCallback } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

interface AddMembersToGroupProps {
  setIsDialogVisible: Dispatch<SetStateAction<boolean>>;
  selectedGroup: Group;
  groupUserList: Participants[];
}

const AddMembersToGroup: React.FC<AddMembersToGroupProps> = ({
  setIsDialogVisible,
  selectedGroup,
  groupUserList,
}) => {
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);
  const [contactsList, setContactsList] = useState<UserListType[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContactsList = useCallback(async () => {
    if (!connection || !selectedGroup?.groupId) return;

    try {
      setIsLoading(true);
      const allUsers: UserListType[] = await getUserList();
      const filteredUsers = allUsers.filter(
        (contact) =>
          contact.userId !== user?.id && // Exclude current user
          !groupUserList.some((groupUser) => groupUser.userId === contact.userId),
      );
      setContactsList(filteredUsers);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error fetching contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connection, selectedGroup?.groupId, groupUserList, user?.id]);

  useEffect(() => {
    if (!connection || !selectedGroup?.groupId) return;

    const setupConnection = async () => {
      try {
        if (connection.state === 'Disconnected') {
          await connection.start();
        }
        await getContactsList();

        // Set up event listeners
        connection.on('GroupMemberAdded', (groupId: number, newMember: string) => {
          console.log('GroupMemberAdded:', groupId, newMember);
          if (groupId === selectedGroup.groupId) {
            getContactsList(); // Refresh only if it's the current group
          }
        });

        connection.on('AddedToGroup', (groupId: number, groupName: string) => {
          console.log('AddedToGroup:', groupId, groupName);
        });

        // Animate modal appearance
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
        ]).start();
      } catch (err) {
        setError('Failed to initialize connection');
        console.error('Connection error:', err);
      }
    };

    setupConnection();

    return () => {
      connection.off('GroupMemberAdded');
      connection.off('AddedToGroup');
    };
  }, [connection, selectedGroup?.groupId, getContactsList, fadeAnim, scaleAnim]);

  const toggleContactSelection = (contactId: number) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  const addMembersToGroup = async () => {
    if (!selectedContactIds.length) {
      alert('Please select at least one member to add');
      return;
    }

    if (!connection || connection.state !== 'Connected') {
      alert('Connection not established');
      return;
    }

    setIsLoading(true);
    try {
      for (const contactId of selectedContactIds) {
        await connection.invoke('AddMemberToGroup', selectedGroup.groupId, contactId);
      }
      alert('Members added successfully');
      setSelectedContactIds([]);
      setIsDialogVisible(false);
      getContactsList(); // Refresh contacts after successful addition
    } catch (err) {
      setError('Failed to add members');
      console.error('Error adding members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
    ]).start(() => setIsDialogVisible(false));
  };

  const renderContact = ({ item }: { item: UserListType }) => (
    <TouchableOpacity
      style={[
        styles.contactCard,
        selectedContactIds.includes(item.userId) && styles.selectedContact,
      ]}
      onPress={() => toggleContactSelection(item.userId)}
      activeOpacity={0.7}>
      <Checkbox
        value={selectedContactIds.includes(item.userId)}
        onValueChange={() => toggleContactSelection(item.userId)}
        style={styles.checkbox}
        color={selectedContactIds.includes(item.userId) ? '#4a90e2' : '#ccc'}
      />
      <Text style={styles.contactName}>{item.userName}</Text>
    </TouchableOpacity>
  );

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
            <Text style={styles.dialogTitle}>Add Members to Group</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {isLoading && contactsList.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4a90e2" />
              </View>
            ) : (
              <>
                <Text style={styles.label}>Select Members</Text>
                <FlatList
                  data={contactsList}
                  renderItem={renderContact}
                  keyExtractor={(item) => item.userId.toString()}
                  style={styles.contactList}
                  ListEmptyComponent={
                    !isLoading ? <Text style={styles.emptyText}>No contacts available</Text> : null
                  }
                />
              </>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={addMembersToGroup} disabled={isLoading}>
                <LinearGradient
                  colors={['#4a90e2', '#357abd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.addButton, isLoading && styles.disabledButton]}>
                  <Text style={styles.buttonText}>{isLoading ? 'Adding...' : 'Add Members'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeModal}
                disabled={isLoading}
                style={styles.cancelButton}>
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
    maxHeight: '80%',
    minHeight: '40%',
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
    flex: 1,
  },
  dialogTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 15,
  },
  contactList: {
    maxHeight: 300,
    marginBottom: 20,
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
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    padding: 20,
  },
});

export default AddMembersToGroup;

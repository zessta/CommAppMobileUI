import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { UserListType } from '@/constants/Types';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CreateGroup = ({
  setIsDialogVisible,
}: {
  setIsDialogVisible: Dispatch<SetStateAction<boolean>>;
}) => {
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);
  const [groupName, setGroupName] = useState<string>('');
  const [contactsList, setContactsList] = useState<UserListType[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0)); // Animation for modal fade-in
  const [scaleAnim] = useState(new Animated.Value(0.95)); // Animation for scale effect

  useEffect(() => {
    getContactsList();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getContactsList = async () => {
    const getAllUsers: UserListType[] = await getUserList();
    const filterOutUser = getAllUsers.filter((contacts) => contacts.userId !== user?.id);
    setContactsList(filterOutUser);
  };

  const toggleContactSelection = (contactId: number) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  const createNewGroup = async () => {
    if (!groupName.trim()) return alert('Please enter a group name');
    if (selectedContacts.length === 0) return alert('Please select at least one member');

    selectedContacts.push(user?.id!);
    await connection!.invoke('CreateGroup', groupName, selectedContacts);
    alert('Group created successfully');
    setIsDialogVisible(false);
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
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
            <Text style={styles.dialogTitle}>Create New Group</Text>

            {/* Group Name Input */}
            <TextInput
              style={styles.input}
              placeholder="Enter Group Name"
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
            />

            {/* Contacts List */}
            <Text style={styles.label}>Select Members</Text>
            <FlatList
              data={contactsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={() => toggleContactSelection(item.userId)}>
                  <Checkbox
                    value={selectedContacts.includes(item.userId)}
                    onValueChange={() => toggleContactSelection(item.userId)}
                    style={styles.checkbox}
                    color={selectedContacts.includes(item.userId) ? '#4a90e2' : '#ccc'}
                  />
                  <Text style={styles.contactName}>{item.userName}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => Math.random().toString()}
              style={styles.flatList}
            />

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={createNewGroup}>
                <LinearGradient
                  colors={['#4a90e2', '#357abd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButton}>
                  <Text style={styles.buttonText}>Create Group</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  },
  dialogContainer: {
    width: '90%',
    maxHeight: '85%',
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
  },
  dialogTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 15,
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
  flatList: {
    maxHeight: 320,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
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

export default CreateGroup;

import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { UserDTO } from '@/constants/Types';
import { getUserList } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { router } from 'expo-router';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const CreateGroupScreen = ({
  navigation,
}: {
  navigation: any; // Assuming navigation prop for screen navigation
}) => {
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);
  const [groupName, setGroupName] = useState<string>('');
  const [groupDescription, setGroupDescription] = useState<string>(''); // Added for description
  const [contactsList, setContactsList] = useState<UserDTO[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getContactsList();
  }, []);

  const getContactsList = async () => {
    setLoading(true);
    const getAllUsers: UserDTO[] = await getUserList();
    const filterOutUser = getAllUsers.filter((contacts) => contacts.userId !== user?.userId);
    setContactsList(filterOutUser);
    setLoading(false);
  };

  const toggleContactSelection = (contactId: number) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  // Filter users based on search query
  const filteredUsers = contactsList?.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const createNewGroup = async () => {
    setLoading(true);
    if (!groupName.trim()) return alert('Please enter a group name');
    if (selectedContacts.length === 0) return alert('Please select at least one member');
    await connection!.invoke('CreateGroup', groupName, selectedContacts);
    alert('Group created successfully');
    setLoading(false);
    router.back(); // Navigate back after saving
  };

  const cancel = () => {
    router.back(); // Navigate back on cancel
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>👥</Text>
        </View>
      </View> */}
      <View
        style={{
          paddingHorizontal: 20,
          // paddingTop: 20,
          paddingVertical: 20,
        }}>
        {/* Group Name */}
        <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 15 }}>
          <View style={styles.iconContainer}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?background=A08E67&color=FFF&name=G`,
              }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            placeholderTextColor="#B3B3B3"
            value={groupName}
            onChangeText={setGroupName}
          />
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loaderText}>Loading contacts...</Text>
            </View>
          ) : null}
          {/* Group Description */}
          <Text style={styles.label}>Group Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Enter group description"
            placeholderTextColor="#B3B3B3"
            value={groupDescription}
            onChangeText={setGroupDescription}
            multiline
          />
        </View>
        {/* Members List */}
        <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 15, marginTop: 10 }}>
          <Text style={styles.label}>Members</Text>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              placeholderTextColor="#B3B3B3"
              value={searchQuery}
              onChangeText={setSearchQuery}
              // autoFocus={true}
            />
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.closeSearch}>
              <Ionicons name="close" size={20} color="#A08E67" />
            </TouchableOpacity>
          </Animated.View>
          <FlatList
            data={filteredUsers}
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
                <View style={styles.avatar}>
                  <Image
                    source={{
                      uri: `https://ui-avatars.com/api/?background=A08E67&color=FFF&name=${item.fullName}`,
                    }}
                    style={styles.profileImage}
                  />
                </View>
                <Text style={styles.contactName}>{item.fullName}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => Math.random().toString()}
            style={styles.flatList}
            ListEmptyComponent={
              !loading ? <Text style={styles.noContactsText}>No members found</Text> : null
            }
          />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={cancel} style={styles.cancelButton}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={createNewGroup} style={styles.saveButton}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc', // Light gradient-like background
    // paddingHorizontal: 20,
    // paddingTop: 20,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4d4d4', // Grayish background for icon
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: '#2c3e50',
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F6F8FE',
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 20,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A08E67',
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4d4d4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  contactName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  flatList: {
    flexGrow: 0,
    maxHeight: 400,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10, // Reduced the padding for smaller buttons
    borderRadius: 8, // Slightly smaller radius
    backgroundColor: '#fff',
    alignItems: 'center',
    marginRight: 8, // Reduced margin
    borderColor: '#767676',
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10, // Reduced the padding for smaller buttons
    borderRadius: 8, // Slightly smaller radius
    backgroundColor: '#d3d3d3',
    alignItems: 'center',
    marginLeft: 8, // Reduced margin
    borderColor: '#767676',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14, // Reduced the font size for smaller text
    color: '#2c3e50',
    fontWeight: '600',
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
  noContactsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    paddingVertical: 20,
  },
  searchContainer: {
    // marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#F6F8FE',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000',
  },
  closeSearch: {
    padding: 5,
  },
});

export default CreateGroupScreen;

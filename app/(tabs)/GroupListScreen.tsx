import React, { useState, useEffect, SetStateAction, Dispatch } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Button,
} from 'react-native';
import { useUser } from '@/components/UserContext'; // Assuming you have user context
import { ChatLastConversationList, Group, UserInfo } from '@/constants/Types'; // Assuming you have a Group type
import { useSignalR } from '@/services/signalRService';
import { SOCKET_URL } from '@/constants/Strings';
import CreateGroup from '@/components/CreateGroup';

const GroupListScreen = () => {
  const { user } = useUser(); // Access user from context
  const connection = useSignalR(SOCKET_URL);

  const [groupsList, setGroupsList] = useState<UserInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);

  useEffect(() => {
    if (connection) {
      getContactsList();
    }
  }, [connection]);

  const getContactsList = async () => {
    const groupList = await connection!.invoke('GetGroups');
    console.log('groupList', groupList);
    setGroupsList(JSON.parse(groupList));
  };

  const filteredGroupsList = groupsList?.filter((group) =>
    group?.UserName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle "Create Group" action
  const handleCreateGroup = () => {
    console.log('Create Group clicked');
    setIsDialogVisible(true);
    // Navigate to the create group screen or show a form/dialog to create a group
  };

  // Render item for FlatList
  const renderGroup = ({ item }: { item: string[] }) => {
    console.log('item', item);
    return (
      <TouchableOpacity style={styles.card}>
        {/* <Text style={styles.groupName}>{item}</Text> */}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Groups"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {/* Create Group Button */}
        <TouchableOpacity onPress={handleCreateGroup} style={styles.createButton}>
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList to show filtered groups */}
      {filteredGroupsList?.length && (
        <FlatList
          data={filteredGroupsList}
          renderItem={renderGroup}
          keyExtractor={(item) => item?.id?.toString?.()}
          contentContainerStyle={styles.scrollView}
          ListEmptyComponent={<Text style={styles.noGroupsText}>No groups found</Text>}
        />
      )}
      {/* Modal/Dialog for showing group details or creating a group */}
      <Modal
        visible={isDialogVisible}
        onRequestClose={() => setIsDialogVisible(false)}
        animationType="slide"
        style={styles.modal}>
        <CreateGroup setIsDialogVisible={setIsDialogVisible} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    flex: 1,
  },
  createButton: {
    marginLeft: 16,
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flexGrow: 1,
  },
  card: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noGroupsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default GroupListScreen;

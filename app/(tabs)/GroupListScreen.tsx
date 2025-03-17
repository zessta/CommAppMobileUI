import CreateGroup from '@/app/GroupStack/CreateGroup';
import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatConversationType, Group } from '@/constants/Types';
import { getGroupsListByUserId, getLastChatHistory } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { formattedTimeString } from '@/Utils/utils';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

const GroupListScreen = () => {
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);
  const [groupLastMessageList, setGroupLastMessageList] = useState<ChatConversationType[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [isDialogVisible]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([getGroupList(), userLastChatMessage()]);
    setIsLoading(false);
  };

  const userLastChatMessage = async () => {
    const usersLastChatHistory: ChatConversationType[] = await getLastChatHistory(user?.id!);
    const filteredGroups = usersLastChatHistory.filter((userList) => userList.groupId !== null);
    setGroupLastMessageList(filteredGroups);
  };

  const getGroupList = async () => {
    const groupsListData: Group[] = await getGroupsListByUserId(user?.id!);
    console.log('groupsListData', groupsListData);
    setGroupsList(groupsListData);
  };

  const filteredGroupsList = groupsList?.filter((group) =>
    group?.groupName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateGroup = () => {
    setIsDialogVisible(true);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const groupLastMessage = groupLastMessageList.find(
      (groupList) => groupList.groupId === item.groupId,
    );
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/GroupStack/GroupChatScreen',
            params: { selectedGroup: JSON.stringify(item) },
          })
        }>
        <Text style={styles.groupName}>{item.groupName}</Text>
        {groupLastMessage?.lastMessage ? (
          <Text style={styles.message}>
            {groupLastMessage?.lastMessageSenderId === user?.id
              ? 'You'
              : groupLastMessage?.lastMessageSenderName}
            : {groupLastMessage?.lastMessage}
          </Text>
        ) : (
          <Text style={styles.placeholderText}>Send a message to start the conversation</Text>
        )}
        {groupLastMessage?.lastMessageTime ? (
          <Text style={styles.time}>{formattedTimeString(groupLastMessage?.lastMessageTime!)}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

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
        <TouchableOpacity onPress={handleCreateGroup} style={styles.createButton}>
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList with RefreshControl */}
      <FlatList
        data={filteredGroupsList}
        renderItem={renderGroup}
        keyExtractor={(item) => item?.groupName?.toString() || Math.random().toString()}
        contentContainerStyle={styles.scrollView}
        ListEmptyComponent={<Text style={styles.noGroupsText}>No groups found</Text>}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#0066CC']}
            tintColor={'#0066CC'}
          />
        }
      />

      {isDialogVisible ? <CreateGroup setIsDialogVisible={setIsDialogVisible} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    flex: 1,
    paddingLeft: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
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
    backgroundColor: '#ffffff',
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
  message: {
    fontSize: 14,
    color: '#555',
    marginVertical: 5,
  },
  time: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
});

export default GroupListScreen;

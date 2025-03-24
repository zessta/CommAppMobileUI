import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatConversationType, Group, UserDTO } from '@/constants/Types';
import { getGroupsListByUserId, getLastChatHistory } from '@/services/api/auth';
import { useSignalR } from '@/services/signalRService';
import { formattedTimeString } from '@/Utils/utils';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Interface for group item props
interface GroupItemProps {
  item: Group;
  onPress: () => void;
  groupLastMessageList: ChatConversationType[];
  user: UserDTO;
}

// Group Item Component
const GroupItem: React.FC<GroupItemProps> = ({ item, onPress, groupLastMessageList, user }) => {
  const groupLastMessage = groupLastMessageList.find(
    (groupList) => groupList.groupId === item.groupId,
  );

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>G</Text>
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.groupName}>{item.groupName}</Text>
        {groupLastMessage?.lastMessage ? (
          <Text style={styles.messageText}>
            {groupLastMessage?.lastMessageSenderId === user?.userId
              ? 'You'
              : groupLastMessage?.lastMessageSenderName}
            : {groupLastMessage?.lastMessage}
          </Text>
        ) : (
          <Text style={styles.placeholderText}>Send a message to start the conversation</Text>
        )}
      </View>
      {groupLastMessage?.lastMessageTime ? (
        <Text style={styles.timeText}>{formattedTimeString(groupLastMessage.lastMessageTime)}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

// Main Component
const GroupListScreen = () => {
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);
  const [groupLastMessageList, setGroupLastMessageList] = useState<ChatConversationType[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData(); // Call fetchData when the screen is focused
    }, []),
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([getGroupList(), userLastChatMessage()]);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userLastChatMessage = async () => {
    const usersLastChatHistory: ChatConversationType[] = await getLastChatHistory(user?.userId!);
    const filteredGroups = usersLastChatHistory.filter((userList) => userList.groupId !== null);
    setGroupLastMessageList(filteredGroups);
  };

  const getGroupList = async () => {
    const groupsListData: Group[] = await getGroupsListByUserId(user?.userId!);
    setGroupsList(groupsListData);
  };

  const filteredGroupsList = groupsList?.filter((group) =>
    group?.groupName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateGroup = () => {
    router.push('/GroupStack/CreateGroupScreen');
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  const toggleSearchBar = () => {
    setIsSearchVisible(!isSearchVisible);
    setSearchQuery('');
  };

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Menu options will appear here', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Option 1', onPress: () => console.log('Option 1 selected') },
      { text: 'Option 2', onPress: () => console.log('Option 2 selected') },
    ]);
  };

  const onGroupCreated = async (groupId: number, groupName: string) => {
    // Fetch updated groups after a new group is created
    console.log('groupId, groupName', groupId, groupName);
    await fetchData();
  };

  // Ensure we subscribe to the GroupCreated event properly
  useEffect(() => {
    if (!connection) return;

    connection.on('GroupCreated', onGroupCreated);

    return () => {
      if (connection) {
        connection.off('GroupCreated', onGroupCreated); // Unsubscribe on cleanup
      }
    };
  }, [connection]);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {isSearchVisible ? (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A08E67" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search Groups"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity onPress={toggleSearchBar}>
              <Ionicons name="close" size={20} color="#A08E67" style={styles.clearIcon} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="#A08E67" style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Group Chats</Text>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={handleCreateGroup}>
                <MaterialIcons name="group-add" size={24} color="#A08E67" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSearchBar}>
                <Ionicons name="search" size={24} color="#A08E67" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMenuPress}>
                <Ionicons name="ellipsis-vertical" size={24} color="#A08E67" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* White Container for FlatList */}
      <View style={styles.listContainer}>
        {isLoading && !isRefreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Loading groups...</Text>
          </View>
        ) : null}
        <FlatList
          data={filteredGroupsList}
          renderItem={({ item }) => (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <GroupItem
                item={item}
                onPress={() =>
                  router.push({
                    pathname: '/GroupStack/GroupChatScreen',
                    params: { selectedGroup: JSON.stringify(item) },
                  })
                }
                groupLastMessageList={groupLastMessageList}
                user={user!}
              />
            </Animated.View>
          )}
          keyExtractor={(item) => item.groupId?.toString() || Math.random().toString()}
          ListEmptyComponent={
            !isLoading ? <Text style={styles.noGroupsText}>No groups found</Text> : null
          }
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      </View>

      {/* {isDialogVisible ? <CreateGroup setIsDialogVisible={setIsDialogVisible} /> : null} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fe',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FE',
    borderRadius: 8,
  },
  searchIcon: {
    marginLeft: 10,
    marginRight: 5,
  },
  clearIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4af37', // Gold color from the image
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  messageText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#A08E67',
    textAlign: 'right',
  },
  placeholderText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  noGroupsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    paddingVertical: 20,
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
  dialogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional: Add a semi-transparent overlay
  },
});

export default GroupListScreen;

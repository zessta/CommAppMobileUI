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
import { Colors } from '@/constants/Colors';

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

const GroupListScreen = () => {
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupLastMessageList, setGroupLastMessageList] = useState<ChatConversationType[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData(); // Fetch data when screen is focused
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
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/chatListScreen'); // Fallback screen
    }
  };

  const onGroupCreated = async (groupId: number, groupName: string) => {
    await fetchData(); // Refresh groups list
  };

  const toggleSearchBar = () => {
    setIsSearchVisible(!isSearchVisible);
    setSearchQuery('');
  };

  const onReceiveGroupMessage = (
    senderId: number,
    message: string,
    groupName: string,
    groupId: number,
  ) => {
    // Handle new message for group
    console.log(`New message in group ${groupName}: ${message}`);
    fetchData(); // Refresh the chat or group data
  };

  const onGroupDeleted = (groupId: number, groupName: string) => {
    console.log(`Group ${groupName} has been deleted`);
    fetchData(); // Refresh the group list after deletion
  };

  const onAddedToGroup = (groupId: number, groupName: string) => {
    console.log(`You have been added to group ${groupName}`);
    fetchData(); // Update the group list with the new group
  };

  const onGroupMemberAdded = (groupId: number, newMemberUserName: string) => {
    console.log(`New member ${newMemberUserName} added to the group`);
    fetchData(); // Refresh group details to show the new member
  };

  const onUpdateGroupList = (groupListJson: string) => {
    const updatedGroupList: Group[] = JSON.parse(groupListJson);
    setGroupsList(updatedGroupList); // Update the group's list with the new data
  };

  const onRemovedFromGroup = (groupId: number, groupName: string) => {
    console.log(`You are removed from this ${groupName}.`);
    fetchData();
  };

  const onGroupMemberRemoved = (groupId: number, groupMemberName: string) => {
    console.log(`${groupMemberName} removed from the group.`);
    fetchData();
  };

  useEffect(() => {
    if (!connection) return;

    // Subscribe to all the necessary events
    connection.on('GroupCreated', onGroupCreated);
    connection.on('ReceiveGroupMessage', onReceiveGroupMessage);
    connection.on('GroupDeleted', onGroupDeleted);
    connection.on('AddedToGroup', onAddedToGroup);
    connection.on('GroupMemberAdded', onGroupMemberAdded);
    connection.on('UpdateGroupList', onUpdateGroupList);
    connection.on('RemovedFromGroup', onRemovedFromGroup);
    connection.on('GroupMemberRemoved', onGroupMemberRemoved);

    // Cleanup the event listeners
    return () => {
      if (connection) {
        connection.off('GroupCreated', onGroupCreated);
        connection.off('ReceiveGroupMessage', onReceiveGroupMessage);
        connection.off('GroupDeleted', onGroupDeleted);
        connection.off('AddedToGroup', onAddedToGroup);
        connection.off('GroupMemberAdded', onGroupMemberAdded);
        connection.off('UpdateGroupList', onUpdateGroupList);
        connection.off('RemovedFromGroup', onRemovedFromGroup);
        connection.off('GroupMemberRemoved', onGroupMemberRemoved);
      }
    };
  }, [connection]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isSearchVisible ? (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.brightRed} style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search Groups"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity onPress={toggleSearchBar}>
              <Ionicons name="close" size={20} color={Colors.brightRed} style={styles.clearIcon} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={handleBackPress}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={Colors.brightRed}
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Group Chats</Text>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={handleCreateGroup}>
                <MaterialIcons name="group-add" size={24} color={Colors.brightRed} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSearchBar}>
                <Ionicons name="search" size={24} color={Colors.brightRed} />
              </TouchableOpacity>
              {/* <TouchableOpacity onPress={handleMenuPress}>
                <Ionicons name="ellipsis-vertical" size={24} color={Colors.brightRed} />
              </TouchableOpacity> */}
            </View>
          </>
        )}
      </View>

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
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.noGroupsText}>No groups found</Text> : null
        }
      />
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
    fontSize: 16,
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
    backgroundColor: Colors.blueColor, // Gold color from the image
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
    color: Colors.brightRed,
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

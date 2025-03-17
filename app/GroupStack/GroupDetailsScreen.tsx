import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Group, Participants } from '@/constants/Types';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Define props interface
type GroupDetailsSearchParams = {
  group: string;
  groupUsers: string;
};

const GroupDetailsScreen: React.FC = () => {
  const { group: groupString, groupUsers: groupUsersString } =
    useLocalSearchParams<GroupDetailsSearchParams>();
  const router = useRouter();
  const groupInfo: Group = JSON.parse(groupString || '{}');
  const groupUserList: Participants[] = JSON.parse(groupUsersString || '[]');

  // Handle leave group (simulated action)
  const handleLeaveGroup = () => {
    console.log('Leaving group:', groupInfo.groupId);
    router.back();
  };

  const handleBackPress = () => {
    router.back();
  };

  // Render individual member item with animation
  const renderItem = ({ item }: { item: Participants }) => {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <TouchableOpacity style={styles.memberItem}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${item.userName}`,
              }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.memberName}>{item.userName}</Text>
            <Text style={styles.memberRole}>{item.role || 'Member'}</Text>
          </View>
          <TouchableOpacity style={styles.removeButton}>
            <Ionicons name="close-circle" size={20} color="#FF0000" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#A08E67" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupInfo.groupName || 'Group Details'}</Text>
        {/* <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveButton}>
          <Ionicons name="log-out" size={24} color="#A08E67" />
        </TouchableOpacity> */}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {groupUserList.length ? (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Text style={styles.membersCount}>
              Members: <Text style={styles.membersCountBold}>{groupUserList.length}</Text>
            </Text>
          </Animated.View>
        ) : null}
        <FlatList
          data={groupUserList}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={styles.membersList}
          ListEmptyComponent={<Text style={styles.emptyText}>No members available</Text>}
        />
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fe',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  },
  leaveButton: {
    marginLeft: 'auto', // Push the leave button to the right
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  membersCount: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
    fontWeight: '500',
  },
  membersCountBold: {
    fontWeight: 'bold',
  },
  membersList: {
    paddingBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  memberRole: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  removeButton: {
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
});

export default GroupDetailsScreen;

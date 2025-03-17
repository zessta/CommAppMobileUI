import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Group, Participants } from '@/constants/Types';

// Define props interface
interface GroupDetailsSearchParams {
  group: string;
  groupUsers: string;
}

const GroupDetailsScreen: React.FC = () => {
  const { group: groupString, groupUsers: groupUsersString } =
    useLocalSearchParams<GroupDetailsSearchParams>();
  const router = useRouter();
  const groupInfo: Group = JSON.parse(groupString || '{}');
  const groupUserList: Participants[] = JSON.parse(groupUsersString || '[]');

  // Animated values for transitions
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);
  const itemFadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(itemFadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [itemFadeAnim]);

  // Handle leave group (simulated action)
  const handleLeaveGroup = () => {
    console.log('Leaving group:', groupInfo.groupId);
    router.back();
  };

  // Render individual member item with animation
  const renderItem = ({ item, index }: { item: Participants; index: number }) => {
    return (
      <Animated.View
        style={[
          styles.memberItem,
          {
            opacity: itemFadeAnim,
            transform: [
              {
                translateY: itemFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        <Image
          source={{
            uri: `https://ui-avatars.com/api/?background=1E88E5&color=FFF&name=${item.userName}`,
          }}
          style={styles.avatar}
        />
        <Text style={styles.memberName}>{item.userName}</Text>
        <TouchableOpacity style={styles.removeButton}>
          <Ionicons name="close-circle" size={20} color="#ff4444" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Animated.Text
          style={[
            styles.headerTitle,
            {
              opacity: fadeAnim,
            },
          ]}>
          {groupInfo.groupName}
        </Animated.Text>
        <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveButton}>
          <Ionicons name="log-out" size={24} color="#000" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <Text style={styles.membersCount}>
          Members: <Text style={styles.membersCountBold}>{groupUserList.length}</Text>
        </Text>
        <FlatList
          data={groupUserList}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={styles.membersList}
          ListEmptyComponent={<Text style={styles.emptyText}>No members available</Text>}
        />
      </Animated.View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa', // Light gradient-like background
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 5,
  },
  leaveButton: {
    padding: 5,
  },
  content: {
    flex: 1,
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
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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

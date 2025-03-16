import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Group, Participants } from '@/constants/Types';

type GroupDetailsSearchProps = {
  group: string;
  groupUsers: string;
};

const GroupDetailsScreen = () => {
  const searchParams = useLocalSearchParams<GroupDetailsSearchProps>(); // Get the group data passed from the previous screen
  const router = useRouter();
  const groupInfo: Group = JSON.parse(searchParams.group);
  const groupUserList: Participants[] = JSON.parse(searchParams.groupUsers);
  // Render group members in a FlatList
  const renderItem = ({ item }: { item: Participants }) => (
    <View style={styles.memberItem}>
      <Text>{item.userName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.groupName}>{groupInfo.groupName}</Text>
      <Text style={styles.membersCount}>Number of Members: {groupUserList.length}</Text>
      <FlatList
        data={groupUserList}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId.toString()}
        style={styles.membersList}
      />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()} // Go back to the previous screen (group screen)
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  membersCount: {
    fontSize: 16,
    marginBottom: 20,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  backButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default GroupDetailsScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Group, Participants } from '@/constants/Types';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSignalR } from '@/services/signalRService';
import { v4 as uuidv4 } from 'uuid';
import { SOCKET_URL } from '@/constants/Strings';

type GroupDetailsSearchParams = {
  group: string;
  groupUsers: string;
};

const GroupDetailsScreen: React.FC = () => {
  const router = useRouter();
  const connection = useSignalR(SOCKET_URL);

  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { group: groupString, groupUsers: groupUsersString } =
    useLocalSearchParams<GroupDetailsSearchParams>();
  const groupInfo: Group = JSON.parse(groupString || '{}');
  const groupUserList: Participants[] = JSON.parse(groupUsersString || '[]');

  const handleDeleteMember = (userId: string) => {
    console.log('Deleting member:', userId);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleDeleteGroup = () => {
    setModalVisible(true);
  };

  const handleSearchPress = () => {
    setSearchVisible(!isSearchVisible);
    setSearchQuery(''); // Reset search query when toggling
  };

  const handleDeleteConfirm = () => {
    if (connection && groupInfo.groupId) {
      connection
        .invoke('DeleteGroup', groupInfo.groupId)
        .then(() => {
          setModalVisible(false);
          router.push('/(tabs)/GroupListScreen');
        })
        .catch((error) => {
          console.error('Error deleting group:', error);
          Alert.alert('Error', 'Failed to delete group. Please try again.');
        });
    }
  };

  const handleDeleteCancel = () => {
    setModalVisible(false);
  };

  // Filter users based on search query
  const filteredUsers = groupUserList.filter((user) =>
    user.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderItem = ({ item }: { item: Participants }) => {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <View style={styles.memberItem}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </View>
          <Text style={styles.memberName}>{item.userName}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#A08E67" />
        </TouchableOpacity>
        <View style={styles.header}>
          <View style={styles.groupIcon}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?background=A08E67&color=FFF&name=${groupInfo.groupName}`,
              }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.groupName}>{groupInfo.groupName}</Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity onPress={handleSearchPress}>
              <Ionicons name="search" size={30} color="#A08E67" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="pricetag" size={30} color="#A08E67" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="person-add" size={30} color="#A08E67" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteGroup}>
              <Ionicons name="trash" size={30} color="#A08E67" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      {isSearchVisible && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          <TouchableOpacity onPress={() => setSearchVisible(false)} style={styles.closeSearch}>
            <Ionicons name="close" size={20} color="#A08E67" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.content}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.closeSearch}>
            <Ionicons name="close" size={20} color="#A08E67" />
          </TouchableOpacity>
        </Animated.View>
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={styles.membersList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching members found' : 'No members available'}
            </Text>
          }
        />
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDeleteCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Group</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this group? This action cannot be undone.
            </Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleDeleteCancel}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteButton} onPress={handleDeleteConfirm}>
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fe',
  },
  headerContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    paddingTop: 10,
  },
  backButton: {
    padding: 10,
    paddingLeft: 15,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#A08E67',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  actionIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  searchContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
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
  content: {
    margin: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  membersList: {
    paddingBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A08E67',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderRadius: 5,
  },
  modalDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#A08E67',
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GroupDetailsScreen;

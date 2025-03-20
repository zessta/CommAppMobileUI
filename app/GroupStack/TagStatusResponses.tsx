import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Loader from '@/components/Loader';
import { getStatusResponses } from '@/services/api/auth'; // Assuming this is where your API call is

// Interface for status response item
interface StatusResponse {
  userId: number;
  userName: string;
  status: string;
}

// Status Item Component
const StatusItem: React.FC<{ item: StatusResponse }> = ({ item }) => {
  return (
    <View style={styles.statusItem}>
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle" size={40} color="#d4af37" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.statusText}>Status: {item.status}</Text>
      </View>
    </View>
  );
};

// Main Component
const TagStatusResponses = () => {
  const [statusResponses, setStatusResponses] = useState<StatusResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const params = useLocalSearchParams();
  const tagId = Number(params.tagId); // Get tagId from navigation params

  // Fetch status responses
  useEffect(() => {
    const fetchStatusResponses = async () => {
      try {
        setLoading(true);
        const responses = await getStatusResponses(tagId);
        setStatusResponses(responses || []);
      } catch (error) {
        console.error('Error fetching status responses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusResponses();
  }, [tagId]);

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#A08E67" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tag Responses</Text>
        <View style={styles.iconPlaceholder} /> {/* To balance the header */}
      </View>

      {/* White Container for FlatList */}
      <View style={styles.listContainer}>
        {loading ? (
          <Loader loadingText="Loading responses..." />
        ) : (
          <FlatList
            data={statusResponses}
            keyExtractor={(item) => item.userId.toString()}
            renderItem={({ item }) => <StatusItem item={item} />}
            ListEmptyComponent={<Text style={styles.noResponsesText}>No responses found</Text>}
          />
        )}
      </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  iconPlaceholder: {
    width: 24, // Matches the size of the back arrow
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  avatarContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  statusText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  noResponsesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    paddingVertical: 20,
  },
});

export default TagStatusResponses;

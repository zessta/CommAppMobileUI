import React, { Dispatch, SetStateAction, useEffect, useState, useCallback } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
import { updateStatusOfTags, getTagById } from '@/services/api/auth';
import { Group, Status } from '@/constants/Types';
import { MaterialIcons } from '@expo/vector-icons';

interface TagStatusUpdateProps {
  setIsUpdateTagDialogVisible: Dispatch<SetStateAction<boolean>>;
  selectedGroup: Group;
  status: number;
}

interface EventTag {
  eventTagId: number;
  name: string;
  description: string;
  statuses: Status[];
}

const TagStatusUpdate: React.FC<TagStatusUpdateProps> = ({
  setIsUpdateTagDialogVisible,
  selectedGroup,
  status,
}) => {
  const [tagData, setTagData] = useState<EventTag | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchTagData();
  }, []);

  const fetchTagData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getTagById(Number(status));
      setTagData(response);
    } catch (err) {
      setError('Failed to fetch tag data');
      console.error('Error fetching tag:', err);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const handleStatusSelect = (status: Status) => {
    setSelectedStatus(status);
    setIsDropdownOpen(false);
    setSearchText('');
  };

  const handleSave = async () => {
    if (!selectedStatus) return;

    try {
      setIsLoading(true);
      const updateResult = await updateStatusOfTags(
        selectedGroup.groupId,
        tagData?.eventTagId!,
        selectedStatus.eventTagStatusId,
      );

      if (updateResult) {
        alert('Status updated successfully');
        setIsUpdateTagDialogVisible(false);
      }
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStatuses =
    tagData?.statuses.filter((statusItem) =>
      statusItem.statusName.toLowerCase().includes(searchText.toLowerCase()),
    ) || [];

  const renderStatusItem = ({ item }: { item: Status }) => (
    <TouchableOpacity style={styles.dropdownItem} onPress={() => handleStatusSelect(item)}>
      <Text style={styles.dropdownItemText}>{item.statusName}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsUpdateTagDialogVisible(false)}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.dialogWrapper}>
          <LinearGradient
            colors={['#ffffff', '#f7f9fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dialogContainer}>
            <View style={styles.header}>
              <Text style={styles.dialogTitle}>Update Tag Status</Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {isLoading && !tagData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4a90e2" />
              </View>
            ) : tagData ? (
              <>
                <Text style={styles.label}>Select Status</Text>

                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <Text
                      style={[
                        styles.dropdownSelectorText,
                        !selectedStatus && styles.placeholderText,
                      ]}>
                      {selectedStatus?.statusName || 'Select Status'}
                    </Text>
                    <MaterialIcons
                      name={isDropdownOpen ? 'arrow-drop-up' : 'arrow-drop-down'}
                      size={24}
                      color="#7f8c8d"
                    />
                  </TouchableOpacity>

                  {isDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search statuses..."
                        value={searchText}
                        onChangeText={setSearchText}
                        autoFocus={true}
                      />
                      <FlatList
                        data={filteredStatuses}
                        renderItem={renderStatusItem}
                        keyExtractor={(item) => item.eventTagStatusId.toString()}
                        style={styles.dropdownList}
                        ListEmptyComponent={<Text style={styles.emptyText}>No statuses found</Text>}
                        scrollEnabled={true} // Ensure the FlatList is scrollable
                      />
                    </View>
                  )}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading}
                    style={styles.saveButton}>
                    <LinearGradient
                      colors={['#4a90e2', '#357abd']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}>
                      <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Save'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsUpdateTagDialogVisible(false)}
                    disabled={isLoading}
                    style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </LinearGradient>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogWrapper: {
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 15,
  },
  dialogContainer: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  dropdownContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e6e8',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownSelectorText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  placeholderText: {
    color: '#888',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e6e8',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
    maxHeight: 200, // Adjust this value to control the height of the dropdown
  },
  searchInput: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6e8',
    fontSize: 16,
    color: '#2c3e50',
  },
  dropdownList: {
    maxHeight: 150,
    paddingBottom: 10,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  emptyText: {
    padding: 12,
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  saveButton: {
    flex: 1,
  },
  gradientButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#A08E67',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default TagStatusUpdate;

import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { getTagList } from '@/services/api/auth';

export type Status = {
  eventTagStatusId: number;
  statusName: string;
};

export type EventTag = {
  eventTagId: number;
  name: string;
  description: string;
  statuses: Status[];
};

export type TagMessageProp = {
  tag: EventTag;
  message: string;
};

type SendTagMessageProps = {
  setIsTagDialogVisible: Dispatch<SetStateAction<boolean>>;
  onSend: (data: TagMessageProp) => void;
};

const SendTagMessage = ({ setIsTagDialogVisible, onSend }: SendTagMessageProps) => {
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [tagList, setTagList] = useState<EventTag[]>([]);
  const [message, setMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  useEffect(() => {
    getTagListData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const getTagListData = async () => {
    try {
      const tagListResponse = await getTagList();
      if (tagListResponse?.length) {
        setTagList(tagListResponse);
        setSelectedTag(tagListResponse[0]?.eventTagId.toString());
      }
    } catch (error) {
      console.error('Error fetching tag list:', error);
    }
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setIsTagDialogVisible(false);
      setMessage('');
    });
  };

  const handleSend = () => {
    console.log('Sending:', { tag: selectedTag, message });
    const tagMessage: TagMessageProp = { tag: selectedTagData, message: message };
    onSend(tagMessage);
    closeModal();
  };

  const selectedTagData = tagList.find((tag) => tag.eventTagId.toString() === selectedTag);

  const renderStatusItem = ({ item }: { item: Status }) => (
    <View style={styles.statusItem}>
      <Text style={styles.statusText}>{item.statusName}</Text>
    </View>
  );

  return (
    <Modal transparent={true} animationType="none" visible={true} onRequestClose={closeModal}>
      {/* <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}> */}
      <SafeAreaView style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.dialogContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}>
          <LinearGradient
            colors={['#ffffff', '#f7f9fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}>
            <Text style={styles.dialogTitle}>Send Tag Message</Text>

            {/* Tag Selection */}
            <Text style={styles.label}>Select Tag</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedTag}
                onValueChange={(itemValue: string) => setSelectedTag(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                dropdownIconColor="#4a90e2">
                {tagList.map((tag) => (
                  <Picker.Item
                    key={tag.eventTagId}
                    label={tag.name}
                    value={tag.eventTagId.toString()}
                  />
                ))}
              </Picker>
            </View>

            {/* Statuses List */}
            <Text style={styles.label}>Statuses</Text>
            {selectedTagData && selectedTagData.statuses && selectedTagData.statuses.length > 0 ? (
              <ScrollView style={styles.statusList}>
                {selectedTagData.statuses.map((status) => (
                  <View key={status.eventTagStatusId} style={styles.statusItem}>
                    <Text style={styles.statusText}>{status.statusName}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No statuses available</Text>
            )}

            {/* Message Input */}
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message here..."
              placeholderTextColor="#7f8c8d"
            />

            {/* Action Buttons */}
            {/* <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                <Text style={styles.buttonText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View> */}
            <View style={styles.buttonContainer}>
              {/* Send Button */}
              <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                <LinearGradient
                  colors={['#4a90e2', '#357abd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}>
                  <Text style={styles.buttonText}>Send</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity onPress={closeModal} style={styles.sendButton}>
                <LinearGradient
                  colors={['#fff', '#fff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cancelGradientButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
      {/* </KeyboardAvoidingView> */}
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
  saveButton: {
    flex: 1,
  },
  gradientButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    // borderWidth: 1,
  },
  cancelGradientButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderColor: '#A08E67',
    borderWidth: 0.5,
  },
  dialogContainer: {
    width: '90%',
    maxHeight: '95%',
    height: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  gradientBackground: {
    padding: 20,
    flex: 1,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e6e8',
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    height: 54,
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
    color: '#2c3e50',
  },
  statusList: {
    maxHeight: 150,
    marginBottom: 20,
    marginTop: 10,
  },
  statusItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e6e8',
  },
  statusText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    padding: 20,
  },
  messageInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e6e8',
    padding: 15,
    fontSize: 16,
    color: '#2c3e50',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // cancelButtonText: {
  //   color: '#000',
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SendTagMessage;

import client from '@/services/api/client';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } from 'react-native';
  import {} from 'react-native-reanimated';
  import SearchableDropdown, {} from 'react-native-searchable-dropdown';
import { ITag } from './GroupChatScreen';

  export interface IDropdownOptions {
    id: number;
    name: string;
  };

const SendTag = ({ setIsTagDialogVisible, onSendTagMessage }: { setIsTagDialogVisible: Dispatch<SetStateAction<boolean>>, onSendTagMessage: (tag?: ITag, message?: string) => void }) => {
    const [tags, setTags] = useState<ITag[]>([]);
    const [tagOptions, setTagOptions] = useState<IDropdownOptions[]>([]);
    const [filteredTagOptions, setFilteredTagOptions] = useState<IDropdownOptions[]>([]);
    const [selectedTag, setSelectedTag] = useState<IDropdownOptions>();
    const [tagMessage, setTagMessage] = useState<string | undefined>();
    const [searchText, setSearchText] = useState<string | undefined>();

    useEffect(() => {
        getAllTags();
    }, []);

    const getAllTags = async () => {
        const getAllTags = await client.get('/api/tags');
        setTags(getAllTags.data);
        const options = (getAllTags.data as []).map((tag: any) => {
            return {
                id: tag.eventTagId,
                name: tag.name,
            };
        });
        setTagOptions(options);
        setFilteredTagOptions(options);
    };

    const onTextChangeTag = (text: string) =>  {
        setSelectedTag(undefined);
        setSearchText(text);
        if(!text) {
            setFilteredTagOptions(tagOptions);
        }
        const filteredOptions = tagOptions.filter((option: IDropdownOptions) => option.name.startsWith(text));
        setFilteredTagOptions(filteredOptions);
    }

    const onTagSelected = (item: any) => {
        setSelectedTag(item);
        setSearchText(item.name)
    };

    const onSend = () => {
        const tag = tags.find((tag: any) => tag.eventTagId === selectedTag?.id);
        onSendTagMessage(tag, tagMessage);
    }

    return (
      <Modal
        visible={true} // Ensure the modal is always visible when calling CreateGroup
        animationType="slide"
        transparent
        onRequestClose={() => setIsTagDialogVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Send Tag</Text>
            <View style={styles.dropdownWrapper}>
              <SearchableDropdown
                containerStyle={styles.dropdownContainer}
                items={filteredTagOptions}
                textInputStyle={styles.inputStyle}
                itemStyle={styles.itemStyle}
                itemTextStyle={styles.itemTextStyle}
                onTextChange={onTextChangeTag}
                onItemSelect={onTagSelected}
                placeholder="Search By Tag"
                textInputProps={{
                  value: searchText,
                }}
              >
              </SearchableDropdown>
            </View>

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Type your message here..."
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              value={tagMessage}
              onChangeText={(text) => setTagMessage(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={onSend}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsTagDialogVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>

        </SafeAreaView>
      </Modal>
    )
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dialogContainer: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        elevation: 5,
    },
    dialogTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'left',
    },
    dropdownWrapper: {
        width: '100%',
        marginBottom: 60,
    },
    dropdownContainer: {
        width: "100%",
        position: 'absolute',
        zIndex: 999,
      },
      inputStyle: {
        borderColor: "#ccc",
        borderWidth: 1,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 15,
        borderRadius: 5,
      },
      itemStyle: {
        padding: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
      },
      itemTextStyle: {
        color: "#000",
      },
      label: {
        color: "#555",
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 10,
      },
      textArea: {
        width: '100%',
        color: "#000",
        borderColor: "#ccc",
        borderWidth: 1,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 15,
        borderRadius: 5,
      },
      buttonContainer: {
        marginTop: 20,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
      addButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
      },
      cancelButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
      },
})

export default SendTag;
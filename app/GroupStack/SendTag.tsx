import client from '@/services/api/client';
import axios from 'axios';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } from 'react-native';
//   import { AutocompleteDropdown, AutocompleteDropdownItem, IAutocompleteDropdownRef } from 'react-native-autocomplete-dropdown';
  import {} from 'react-native-reanimated';
  import SearchableDropdown, {} from 'react-native-searchable-dropdown';

const SendTag = ({ setIsTagDialogVisible }: { setIsTagDialogVisible: Dispatch<SetStateAction<boolean>> }) => {
    const [tags, setTags] = useState([]);
    const [tagOptions, setTagOptions] = useState<any[]>([]);
    // const dropdownController = useRef<IAutocompleteDropdownRef | null>(null)

    console.log('inside send tag');

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

        console.log('checking ----tags ', getAllTags.data);
    };

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
                    {/* <AutocompleteDropdown
                        dataSet={tagOptions}
                        controller={controller => dropdownController.current = controller}
                    >
                    </AutocompleteDropdown> */}
                    <SearchableDropdown 
                    containerStyle={styles.dropdownContainer}
                    items={tagOptions}
                    textInputStyle={styles.inputStyle}
                    itemStyle={styles.itemStyle}
                    itemTextStyle={styles.itemTextStyle}
                    // listProps={{ keyboardShouldPersistTaps: "handled" }} // Ensures taps work smoothly
                    placeholder="Search..."
                    // modal={true} // Enables overlay behavior
                    >
                    </SearchableDropdown>
                    <Text style={styles.dialogTitle}>End</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
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
    dropdownContainer: {
        width: "100%",
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
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
      },
      itemTextStyle: {
        color: "#000",
      },
})

export default SendTag;
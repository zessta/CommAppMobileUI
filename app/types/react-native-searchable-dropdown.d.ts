declare module "react-native-searchable-dropdown" {
  import { Component } from "react";
  import { 
    FlatListProps, 
    TextStyle, 
    ViewStyle, 
    TextInputProps 
  } from "react-native";

  interface Item {
    id: number | string;
    name: string;
  }

  interface SearchableDropdownProps {
    items: Item[];
    onTextChange?: (text: string) => void;
    onItemSelect?: (item: Item) => void;
    onRemoveItem?: (item: Item, index: number) => void; // Multi-select support
    textInputStyle?: TextStyle;
    itemStyle?: ViewStyle;
    itemTextStyle?: TextStyle;
    containerStyle?: ViewStyle;
    iconStyle?: ViewStyle; // Icon customization
    listProps?: FlatListProps<Item>;
    textInputProps?: TextInputProps; // Extra props for TextInput
    defaultSelectedItems?: Item[]; // Pre-selected items for multi-select
    placeholder?: string;
    multi?: boolean; // Enables multi-select mode
    modal?: boolean; // Enables modal overlay dropdown
    disabled?: boolean; // Disables input & dropdown
    onFocus?: () => void; // Handles input focus
    onBlur?: () => void; // Handles input blur
  }

  export default class SearchableDropdown extends Component<SearchableDropdownProps> {}
}

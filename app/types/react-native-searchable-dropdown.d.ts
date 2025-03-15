declare module "react-native-searchable-dropdown" {
    import { Component } from "react";
    import { FlatListProps, TextStyle, ViewStyle } from "react-native";
  
    interface Item {
      id: number | string;
      name: string;
    }
  
    interface SearchableDropdownProps {
      onTextChange?: (text: string) => void;
      onItemSelect?: (item: Item) => void;
      items: Item[];
      textInputStyle?: TextStyle;
      itemStyle?: ViewStyle;
      itemTextStyle?: TextStyle;
      containerStyle?: ViewStyle;
      listProps?: FlatListProps<Item>;
      placeholder?: string;
    }
  
    export default class SearchableDropdown extends Component<SearchableDropdownProps> {}
  }
  
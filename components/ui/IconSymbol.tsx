import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'arrow-back': 'arrow-back',
  groups: 'groups',
  adduser: 'group-add',
  poll: 'poll',
  person: 'person',
  contacts: 'contacts',
  image: 'image', // Added mapping for 'image'
} as const; // Use 'as const' to make the object readonly and improve type inference

// Derive the type of valid icon names from MAPPING
export type IconSymbolName = keyof typeof MAPPING;

// Define the props interface for IconSymbol
interface IconSymbolProps {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({ name, size = 24, color, style, weight }: IconSymbolProps) {
  const iconName = MAPPING[name];

  // If the icon name is not found in the mapping, return null (safe in React Native)
  if (!iconName) {
    if (__DEV__) {
      console.warn(
        `IconSymbol: No mapping found for icon name "${name}". Please add it to the MAPPING object in IconSymbol.tsx.`,
      );
    }
    return null; // Prevents the error by rendering nothing
  }

  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}

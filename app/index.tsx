import { View } from 'react-native';
import 'react-native-get-random-values'; // Required for UUID support
import 'react-native-websocket'; // WebSocket polyfill for React Native
import LoginScreen from './LoginScreen';
import { Redirect, useRootNavigationState } from 'expo-router';

const HomeScreen = () => {
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  return <Redirect href="/LoginScreen" />;
};
export default HomeScreen;

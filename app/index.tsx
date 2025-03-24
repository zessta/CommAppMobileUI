import { View } from 'react-native';
import 'react-native-get-random-values'; // Required for UUID support
import 'react-native-websocket'; // WebSocket polyfill for React Native
import LoginScreen from './LoginScreen';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useNotification } from '@/hooks/useNotification';

const HomeScreen = () => {
  const rootNavigationState = useRootNavigationState();
  const { expoPushToken, registerForPushNotificationsAsync } = useNotification();
  if (!expoPushToken) {
    registerForPushNotificationsAsync();
  }


  if (!rootNavigationState?.key) return null;

  return <Redirect href="/LoginScreen" />;
};
export default HomeScreen;

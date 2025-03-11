import { SocketProvider } from '@/components/SocketContext';
import signalRService from '@/services/signalRService';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-get-random-values'; // Required for UUID support
import 'react-native-websocket'; // WebSocket polyfill for React Native
import * as SignalR from '@microsoft/signalr';
import { SOCKET_URL } from '@/constants/Strings';
import { UserProvider } from '@/components/UserContext';

// SplashScreen.preventAutoHideAsync();
// SplashScreen.hideAsync();
export default function RootLayout() {
  useEffect(() => {
    // Initialize SignalR connection when app starts
    const initializeSignalR = async () => {
      try {
        await signalRService.connect(SOCKET_URL, {
          // Optional connection options
          transport: SignalR.HttpTransportType.WebSockets,
        });
      } catch (error) {
        console.error('Root SignalR Error:', error);
      }
    };

    initializeSignalR();

    return () => {
      // Optional: Cleanup on unmount
      signalRService.disconnect();
    };
  }, []);
  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ChatStack/chatScreen" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </UserProvider>
  );
}

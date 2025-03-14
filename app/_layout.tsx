import { UserProvider } from '@/components/UserContext';
import { Stack } from 'expo-router';
import 'react-native-get-random-values'; // Required for UUID support
import 'react-native-websocket'; // WebSocket polyfill for React Native

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ChatStack/chatScreen" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </UserProvider>
  );
}

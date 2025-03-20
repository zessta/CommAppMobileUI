import { UserProvider } from '@/components/UserContext';
import { Stack } from 'expo-router';
import 'react-native-get-random-values'; // Required for UUID support
import 'react-native-websocket'; // WebSocket polyfill for React Native
import { TranslatorProvider } from 'react-native-translator'; // here

export default function RootLayout() {
  return (
    <TranslatorProvider>
      <UserProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
          <Stack.Screen name="GroupStack/GroupDetailsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="GroupStack/CreateGroupScreen" options={{ headerShown: false }} />
          <Stack.Screen name="GroupStack/TagStatusResponses" options={{ headerShown: false }} />
          <Stack.Screen name="ChatStack/chatScreen" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </UserProvider>
    </TranslatorProvider>
  );
}

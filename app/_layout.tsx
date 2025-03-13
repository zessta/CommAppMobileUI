import { UserProvider } from '@/components/UserContext';
import { SOCKET_URL } from '@/constants/Strings';
import { useSignalR } from '@/services/signalRService';
import * as SignalR from '@microsoft/signalr';
import { Stack } from 'expo-router';
import 'react-native-get-random-values'; // Required for UUID support
import 'react-native-websocket'; // WebSocket polyfill for React Native

// SplashScreen.preventAutoHideAsync();
// SplashScreen.hideAsync();
export default function RootLayout() {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiQ2hyb21lIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoiY2hyb21lQGV4YW1wbGUuY29tIiwiZXhwIjoxNzQxODcxNzUzLCJpc3MiOiJDb21tU2VydmVyIiwiYXVkIjoiQ29tbVNlcnZlckNsaWVudHMifQ.mzpExNanVd6i9vmRQT2ngAIYlX-V_QmaDmbfSU1Xz9M';
  const connection = useSignalR(SOCKET_URL, {
    // Optional connection options
    transport: SignalR.HttpTransportType.WebSockets,
    accessTokenFactory: () => token,
  });

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

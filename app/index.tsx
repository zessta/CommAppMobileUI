import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import LoginScreen from './LoginScreen';
import { SocketProvider } from '@/components/SocketContext';
import 'react-native-get-random-values'; // Required for UUID support
import 'react-native-websocket'; // WebSocket polyfill for React Native
export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <LoginScreen />
    </View>
  );
}

import { useUser } from '@/components/UserContext';
import { CHAT_TEST_DATA } from '@/constants/Strings';
import { login } from '@/services/api/auth'; // Import login function from API
import { extractUsername } from '@/Utils/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const LoginScreen = () => {
  const router = useRouter();
  const [input, setInput] = useState<string>(''); // For email/phone input
  const [password, setPassword] = useState<string>(''); // For password input
  const [loading, setLoading] = useState<boolean>(false);
  const { setUser } = useUser(); // Get the setter function from context

  // Check if the token already exists on component mount
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Token exists, automatically navigate to chat list screen
        router.push({ pathname: '/(tabs)/chatListScreen' });
      }
    };

    checkToken();
  }, [router]); // Empty dependency array means it runs once on mount

  const handleLogin = async () => {
    setLoading(true);

    try {
      // Call the login function from the API service
      const userData = await login(input, password);
      const userNameFromMail = extractUsername(input);
      // If login is successful
      if (userData) {
        const getTestInfo = CHAT_TEST_DATA.find(
          (chat) => chat.name.toLowerCase() === userNameFromMail,
        );
        await AsyncStorage.setItem('userData', JSON.stringify(getTestInfo));

        console.log('getTestInfo', getTestInfo);
        setUser(getTestInfo!); // Save user data in context
        await AsyncStorage.setItem('authToken', userData.token); // Save token to AsyncStorage

        // Redirect to chat list screen
        router.push({ pathname: '/(tabs)/chatListScreen', params: { userInputName: input } });
      }
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItems = async () => {
    await AsyncStorage.removeItem('authToken');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.form}>
          <Text style={styles.title}>Enter Email or Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Email or Mobile"
            placeholderTextColor="#000"
            value={input}
            onChangeText={setInput}
          />
          <Text style={styles.title}>Enter Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#000"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={handleLogin} style={styles.button}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: '100%',
    width: '100%',
  },
  card: {
    borderRadius: 10,
    width: '80%',
  },
  form: {
    padding: 20,
  },
  title: {
    color: '#000',
    fontSize: 18,
    marginBottom: 10,
    padding: 10,
    fontWeight: '900',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    color: '#000',
    width: '100%',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default LoginScreen;

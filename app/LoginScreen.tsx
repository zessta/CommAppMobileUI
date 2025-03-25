import LoginImage from '@/assets/svgs/LoginImage';
import ScreenLoader from '@/components/ScreenLoader';
import { useUser } from '@/components/UserContext';
import { CHAT_TEST_DATA } from '@/constants/Strings';
import { useIsNavigationReady } from '@/hooks/useIsNavigationReady';
import { useNotification } from '@/hooks/useNotification';
import { login, updateExpoToken } from '@/services/api/auth';
import { extractUsername } from '@/Utils/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const LoginScreen = () => {
  const router = useRouter();
  const [input, setInput] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const { setUser } = useUser();
  const [fadeAnim] = useState(new Animated.Value(0));
  const isNavigationReady = useIsNavigationReady();
  const { registerForPushNotificationsAsync } = useNotification(); //store in BE to trigger notifications to this user.

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userInfo = await AsyncStorage.getItem('userData');
        if (token && userInfo) {
          setUser(JSON.parse(userInfo));
          router.push({ pathname: '/(tabs)/chatListScreen' });
        } else {
          setLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Error checking token:', error);
        setLoading(false);
      }
    };
    // if (isNavigationReady) {
    // router.push({ pathname: '/(tabs)/chatListScreen' });
    // }
    checkToken();
  }, [router, fadeAnim]);

  const handleLogin = async () => {
    setButtonLoading(true);
    try {
      const userData = await login(input, password);
      if (userData) {
        const expoToken = await registerForPushNotificationsAsync();
        if (expoToken) {
          await updateExpoToken(userData.user.userId, expoToken);
        }
        await AsyncStorage.setItem('userData', JSON.stringify(userData.user));
        setUser(userData.user!);
        await AsyncStorage.setItem('authToken', userData.token);
        router.push({ pathname: '/(tabs)/chatListScreen', params: { userInputName: input } });
      }
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setButtonLoading(false);
    }
  };

  if (loading) {
    return <ScreenLoader />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <LoginImage />
        </View>
        <Text style={styles.header}>Sign in</Text>
        <Text style={styles.subtitle}>Sign in to continue to Chat.</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Email id</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email id"
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={buttonLoading}>
            {buttonLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
    color: '#6B46C1',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F9FAFB',
    color: '#333',
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;

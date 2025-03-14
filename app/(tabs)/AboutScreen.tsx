import { useUser } from '@/components/UserContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AboutScreen = () => {
  const router = useRouter();
  const { user, setUser } = useUser(); // Fetch the user context
  const [userInfo, setUserInfo] = useState<any>(null); // State to store user data

  // Fetch user data from AsyncStorage or context (depending on your app flow)
  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        setUserInfo(JSON.parse(storedUserData)); // Set data to state
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    // Clear the authToken from AsyncStorage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData'); // Optional, to clear user data

    // Reset the user context to null
    setUser(null);

    // Redirect to login page
    router.push('/LoginScreen'); // Assuming your login screen is named 'login'
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>About Screen</Text>
        {userInfo ? (
          <View style={styles.userInfo}>
            <Text style={styles.text}>Name: {userInfo.name}</Text>
            <Text style={styles.text}>Email: {userInfo.email}</Text>
            {/* Add any additional user info you want to display */}
          </View>
        ) : (
          <Text style={styles.text}>Loading user info...</Text>
        )}
        <Button title="Logout" onPress={handleLogout} color="#FF0000" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card: {
    borderRadius: 10,
    width: '80%',
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userInfo: {
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default AboutScreen;

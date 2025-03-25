import { useUser } from '@/components/UserContext';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

const AboutScreen = () => {
  const { user, setUser } = useUser();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        setUserInfo(JSON.parse(storedUserData));
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    setUser(null);
    router.push('/LoginScreen');
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={Colors.brightRed} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.iconContainer} />
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <View style={styles.profileContainer}>
            <Image
              source={{
                uri:
                  userInfo?.avatar ||
                  `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${user?.fullName || 'Admin'}`,
              }}
              style={styles.profileImage}
            />
            <View style={styles.profileText}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{user?.fullName || 'Admin'}</Text>
                <View style={styles.statusDot} />
              </View>
              {/* <Text style={styles.description}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et
                velit interdum.
              </Text> */}
            </View>
          </View>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            {userInfo ? (
              <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Name</Text>
                  <Text style={styles.value}>{userInfo.name || 'Admin'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{userInfo.email || 'demo@demo.com'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Location</Text>
                  <Text style={styles.value}>{userInfo.location || '--'}</Text>
                </View>
              </View>
            ) : (
              <ActivityIndicator size="small" color="#234B89" />
            )}
          </View>
        </Animated.View>
      </View>

      {/* Logout Button at Bottom */}
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fe',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align items to the left
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  iconContainer: {
    flex: 1, // Take remaining space to push title closer to the back icon
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  profileText: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  infoContainer: {
    width: '100%',
  },
  infoRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#B3B3B3',
    fontWeight: '500',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: Colors.blueColor,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AboutScreen;

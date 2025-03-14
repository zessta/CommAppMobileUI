import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants/Strings';

// Create an Axios instance
const client = axios.create({
  baseURL: BASE_URL, // Replace with your actual API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token to headers
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken'); // Get the stored token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // Attach token to the request headers
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default client;

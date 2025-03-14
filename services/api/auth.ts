// services/api/auth.ts
import client from './client';
import { ENDPOINTS } from './endpoints';
import { handleSuccess, handleError } from './responseHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email: string, password: string) => {
  try {
    // Make POST request to login endpoint
    const response = await client.post(ENDPOINTS.login, { email, password });
    const token = response.data.token;

    await AsyncStorage.setItem('authToken', token);

    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

// You can add more authentication-related API functions (e.g., registration)

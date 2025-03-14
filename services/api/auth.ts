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

export const getChatHistory = async (receiverId: number) => {
  try {
    // Make POST request to login endpoint
    const response = await client.get(`${ENDPOINTS.chatHistory}/${receiverId}`);

    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getUserList = async () => {
  try {
    // Make POST request to login endpoint
    const response = await client.get(ENDPOINTS.usersList);
    console.log('getUserList', response.data);

    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

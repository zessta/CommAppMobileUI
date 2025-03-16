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

export const getLastChatHistory = async (senderId: number) => {
  try {
    const response = await client.get(`${ENDPOINTS.chatLastHistory}/${senderId}`);

    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getUserList = async () => {
  try {
    const response = await client.get(ENDPOINTS.usersList);
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getUsersChatHistory = async (conversationsId: number) => {
  try {
    const response = await client.get(
      `${ENDPOINTS.usersChatHistory.replace('{conversationsId}', conversationsId.toString())}`,
    );
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getGroupsListByUserId = async (userId: number) => {
  try {
    const response = await client.get(
      `${ENDPOINTS.groupsList.replace('{userId}', userId.toString())}`,
    );
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getGroupChatHistory = async (groupId: number) => {
  try {
    const response = await client.get(
      `${ENDPOINTS.groupChatHistory.replace('{groupId}', groupId.toString())}`,
    );
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getGroupUsers = async (groupId: number) => {
  try {
    const response = await client.get(`${ENDPOINTS.groupUsers}/${groupId}`);
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const uploadImage = async (uri: string): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any); // FormData typing workaround

    const response = await client.post(`${ENDPOINTS.uploadImage}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // Removed formData.getHeaders as it does not exist on FormData type
      },
    });

    return handleSuccess(response); // Handle successful response and return attachmentId
  } catch (error) {
    return handleError(error); // Handle error response and return null
  }
};

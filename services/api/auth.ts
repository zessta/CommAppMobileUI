// services/api/auth.ts
import { AttachmentUploadResponse } from '@/app/ChatStack/chatScreen';
import client from './client';
import { ENDPOINTS } from './endpoints';
import { handleSuccess, handleError } from './responseHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encode } from 'base64-arraybuffer';

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

export const updateExpoToken = async (userId: number, token: string) => {
  try {
    const response = await client.post(ENDPOINTS.pushRegister, { userId, token });
    
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
}

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

export const uploadImage = async (uri: string) => {
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

export const uploadFile = async (
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<AttachmentUploadResponse> => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as any);
  // Assume your API endpoint handles different file types
  const response = await client.post(ENDPOINTS.uploadImage, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  console.log('response uploadFile', response);
  return response.data;
};

export const getImageById = async (attachmentId: number) => {
  try {
    const response = await client.get(
      `${ENDPOINTS.getImage.replace('{id}', attachmentId.toString())}`,
      { responseType: 'arraybuffer' }, // Ensure binary response
    );

    const base64String = encode(response.data);

    const mimeType = response.headers['content-type'] || 'image/jpeg';

    // Format as a Base64 URI
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getTagList = async () => {
  try {
    const response = await client.get(`${ENDPOINTS.getTagList}`);
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getTagById = async (tagId: number) => {
  try {
    const response = await client.get(`${ENDPOINTS.getTagById}/${tagId}`);
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const updateStatusOfTags = async (groupId: number, tagId: number, statusId: number) => {
  const replaceTagId = ENDPOINTS.updateStatusByTagId.replace('{tags}', tagId.toString());
  const groupIdAndTagId = replaceTagId.replace('{groupId}', groupId.toString());
  try {
    const response = await client.put(groupIdAndTagId, {
      statusId: statusId,
    });
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getStatusResponses = async (tagId: number) => {
  try {
    const response = await client.get(
      `${ENDPOINTS.getStatusResponses.replace('{tags}', tagId.toString())}`,
    );
    return handleSuccess(response); // Handle successful response
  } catch (error) {
    handleError(error); // Handle error response
  }
};

export const getFileById = async (attachmentId: number) => {
  try {
    const response = await client.get(
      `${ENDPOINTS.getImage.replace('{id}', attachmentId.toString())}`,
      { responseType: 'arraybuffer' },
    );

    const base64String = encode(response.data);
    const mimeType = response.headers['content-type'] || 'application/octet-stream';
    const fileName = response.headers['x-file-name'] || `file_${attachmentId}`; // Assume API returns filename

    return {
      uri: `data:${mimeType};base64,${base64String}`,
      fileName,
      fileType: mimeType,
    };
  } catch (error) {
    handleError(error);
  }
};

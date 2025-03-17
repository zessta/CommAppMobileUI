export const ENDPOINTS = {
  login: '/api/auth/login', // Login endpoint
  register: '/api/auth/changepassword', // Registration endpoint (if applicable)
  chatLastHistory: '/api/conversations',
  usersList: '/api/users/list',
  usersChatHistory: '/api/conversations/{conversationsId}/history',
  groupsList: '/api/conversations/{userId}/groups',
  groupChatHistory: '/api/conversations/group/{groupId}/history',
  groupUsers: 'api/groups',
  uploadImage: 'api/attachments/upload',
  getImage: 'api/attachments/{id}/download',
};

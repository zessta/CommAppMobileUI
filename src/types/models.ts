export interface UserInfo {
    UserName: string;
    ConnectionId: string;
  }
  
  export interface ChatSession {
    chatSessionId: string;
    fromUser: string;
    toUser?: string;
    message: string;
    timestamp: string; // Will be a string in JSON, convert to Date when needed
    groupName?: string; // Optional since it may be empty
  }
  
  export interface GroupInfo {
    GroupId: string;
    GroupName: string;
    CreatorConnectionId: string;
    Members: UserInfo[];
  }
  
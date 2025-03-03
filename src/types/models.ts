export interface UserInfo {
    UserName: string;
    UserId: number;
    ConnectionId: string;
  }
  
  export interface ChatSession {
    chatSessionId: string;
    fromUser: string;
    toUser?: string;
    message: string;
    timestamp: string; 
    groupName?: string; // Optional since it may be empty
  }
  
  export interface GroupInfo {
    GroupId: number;
    GroupName: string;
    CreatorConnectionId: string;
    Members: UserInfo[];
}

export interface Message {
    messageId: string;
    conversationId?: number;
    senderId: number;
    senderName: string;
    messageText: string;
    messageType: MessageType;
    messageStatus: MessageStatus;
    attachments?: any; // Use appropriate type for attachments
    createdBy: number | undefined;
    createdOn: Date;
    updatedBy?: number;
    updatedOn?: Date | undefined;
    deletedBy?: number;
    deletedOn?: Date | undefined;
}

export enum MessageType {
    Text,
    Image,
    Video,
}

export enum MessageStatus {
    Sent,
    Delivered,
    Read,
    Sending
}
  
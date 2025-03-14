export type ChatLastConversationList = {
  conversationId: number;
  lastMessage: string;
  lastMessageStatus: number;
  lastMessageTime: string;
  participants: Participants[];
};

export type Participants = {
  userId: number;
  userName: string;
};

export type ChatDataProps = {
  id: number;
  name: string;
  time: string;
  lastMessage: string;
  connectionId: string;
};

export type Group = {
  id: number;
  name: string;
};

export interface UserInfo {
  UserName: string;
  UserId: number;
  ConnectionId: string;
}

export type GroupList = {
  CreatedBy: number;
  CreatedOn: string;
  DeletedBy: number;
  DeletedOn: string;
  EntityState: number;
  GroupId: number;
  GroupName: string;
  UpdatedBy: number;
  UpdatedOn: string;
};

export type ChatMessageServer = {
  conversationId: number;
  createdOn: string;
  messageId: string;
  messageStatus: number;
  messageText: string;
  messageType: number;
  senderId: number;
};

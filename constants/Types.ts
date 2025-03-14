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
  groupId: number;
  groupName: string;
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
  attachmentId: null;
};

export type UserListType = {
  badgeId: string;
  email: string;
  role: number;
  userId: number;
  userName: string;
};

export type ChatConversationType = {
  conversationId: number;
  conversationType: number;
  groupId: number;
  lastMessage: string;
  lastMessageSenderId: number;
  lastMessageStatus: number;
  lastMessageSenderName: string;
  lastMessageTime: string;
  participants: ParticipantsType[];
  userId: number;
};

export type ParticipantsType = {
  userId: number;
  userName: string;
};

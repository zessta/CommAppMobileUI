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
  eventTagId: string;
  eventTagName: string;
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

export type ChatScreenProps = {
  receiverData: string;
  senderData: string;
  conversationId?: string;
};

export type UserDTO = {
  dateOfBirth: string; // Date of birth as string
  email: string; // Email address
  fullName: string; // Full name of the user
  location: string; // Location is an empty string, can be a city, country, etc.
  mobileNo: string; // Mobile number, though "abcd" is a placeholder here.
  policeStation: string; // Police station information (empty string here)
  rank: string; // Rank can be a string (empty in this case)
  role: number; // Numeric value indicating the user's role
  userId: number; // Unique identifier for the user
  zone: string; // Zone is currently an empty string
};

export type Status = {
  eventTagStatusId: number;
  statusName: string;
};

export type EventTag = {
  eventTagId: number;
  name: string;
  description: string;
  statuses: Status[];
};

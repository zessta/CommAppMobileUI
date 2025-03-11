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

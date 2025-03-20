import {
  ChatConversationType,
  ChatDataProps,
  EventTag,
  Group,
  Participants,
  UserListType,
} from '@/constants/Types';
import moment from 'moment';
import 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

export const formattedTimeString = (time: string) => {
  // Convert the ISO string time to a JavaScript Date object

  const localTime = moment.utc(time).local(); // This converts the UTC time to local time

  // Get the current date
  const currentDate = moment().local();

  // Helper function to check if the date is today
  const isToday = (date: moment.Moment) => {
    return date.isSame(currentDate, 'day');
  };

  // Helper function to check if the date is yesterday
  const isYesterday = (date: moment.Moment) => {
    return date.isSame(currentDate.clone().subtract(1, 'day'), 'day');
  };

  // Format the date based on the conditions
  let formattedTime = '';
  if (isToday(localTime)) {
    // Show time if it's today
    formattedTime = localTime.format('h:mm A'); // Example: 5:57 AM
  } else if (isYesterday(localTime)) {
    // Show "Yesterday" if it's yesterday
    formattedTime = 'Yesterday';
  } else {
    // Show the date in DD/MM/YYYY format for other days
    formattedTime = localTime.format('DD/MM/YYYY');
  }
  return formattedTime;
};

export function extractUsername(email: string): string {
  // Split the email at the "@" character and return the first part
  const username = email.split('@')[0];
  return username;
}

export const messageFormat = ({
  text,
  userName,
  senderId,
  tagListResponse,
  createdOn,
  eventTagId,
}: {
  text: string;
  userName: string;
  senderId: number;
  tagListResponse: EventTag | null;
  createdOn?: string;
  eventTagId?: number;
}) => {
  return {
    _id: uuidv4(),
    text: text,
    createdAt: createdOn ? new Date(createdOn) : new Date(),
    user: {
      _id: senderId,
      name: userName || 'Unknown',
      avatar: `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${userName || 'User'}`,
    },
    eventTagId: eventTagId || null,
    ...(tagListResponse && {
      customData: {
        statuses: tagListResponse.statuses.map((status) => ({
          eventTagStatusId: status.eventTagStatusId,
          statusName: status.statusName,
          tagId: tagListResponse.eventTagId,
        })),
      },
    }),
  };
};

export const groupMessageFormat = ({
  message,
  senderId,
  groupUsers,
}: {
  message: string;
  senderId: number;
  groupUsers: Participants[];
}) => {
  const userName = groupUsers.find((u) => u.userId === senderId)?.userName;
  return {
    _id: uuidv4(),
    text: message,
    createdAt: new Date(),
    user: {
      _id: senderId,
      name: userName || 'Unknown',
      avatar: `https://ui-avatars.com/api/?background=234B89&color=FFF&name=${userName || 'User'}`,
    },
  };
};

export const sampleChatConversations: ChatConversationType[] = [
  {
    conversationId: 1,
    conversationType: 0, // 0 = one-on-one, 1 = group
    groupId: 0, // 0 indicates this is not a group conversation
    lastMessage: 'Hey, how are you?',
    lastMessageSenderId: 1,
    lastMessageStatus: 1, // 1 indicates sent, 0 = not sent
    lastMessageSenderName: 'John Doe',
    lastMessageTime: '2025-03-16T12:30:00Z',
    participants: [
      { userId: 1, userName: 'John Doe' },
      { userId: 2, userName: 'Jane Smith' },
    ],
    userId: 2, // The current user is Jane Smith
  },
  {
    conversationId: 2,
    conversationType: 1, // Group chat
    groupId: 1,
    lastMessage: 'Welcome to the group!',
    lastMessageSenderId: 3,
    lastMessageStatus: 1,
    lastMessageSenderName: 'Alice Johnson',
    lastMessageTime: '2025-03-15T09:45:00Z',
    participants: [
      { userId: 1, userName: 'John Doe' },
      { userId: 2, userName: 'Jane Smith' },
      { userId: 3, userName: 'Alice Johnson' },
    ],
    userId: 2, // The current user is Jane Smith
  },
  {
    conversationId: 3,
    conversationType: 0, // 0 = one-on-one
    groupId: 0,
    lastMessage: 'Are we meeting tomorrow?',
    lastMessageSenderId: 2,
    lastMessageStatus: 1,
    lastMessageSenderName: 'Jane Smith',
    lastMessageTime: '2025-03-16T10:10:00Z',
    participants: [
      { userId: 1, userName: 'John Doe' },
      { userId: 2, userName: 'Jane Smith' },
    ],
    userId: 2, // The current user is Jane Smith
  },
  {
    conversationId: 4,
    conversationType: 1, // Group chat
    groupId: 2,
    lastMessage: 'Happy to be here!',
    lastMessageSenderId: 4,
    lastMessageStatus: 0, // Message not sent
    lastMessageSenderName: 'Bob Williams',
    lastMessageTime: '2025-03-14T15:00:00Z',
    participants: [
      { userId: 1, userName: 'John Doe' },
      { userId: 2, userName: 'Jane Smith' },
      { userId: 3, userName: 'Alice Johnson' },
      { userId: 4, userName: 'Bob Williams' },
    ],
    userId: 2, // The current user is Jane Smith
  },
];

export const sampleUsers: UserListType[] = [
  {
    badgeId: 'A123',
    email: 'john.doe@example.com',
    role: 1, // assuming 1 is for normal user
    userId: 101,
    userName: 'john_doe',
  },
  {
    badgeId: 'B456',
    email: 'jane.smith@example.com',
    role: 2, // assuming 2 is for admin
    userId: 102,
    userName: 'jane_smith',
  },
  {
    badgeId: 'C789',
    email: 'alice.jones@example.com',
    role: 1, // assuming 1 is for normal user
    userId: 103,
    userName: 'alice_jones',
  },
  {
    badgeId: 'D012',
    email: 'bob.martin@example.com',
    role: 1, // assuming 1 is for normal user
    userId: 104,
    userName: 'bob_martin',
  },
  {
    badgeId: 'E345',
    email: 'carol.white@example.com',
    role: 2, // assuming 2 is for admin
    userId: 105,
    userName: 'carol_white',
  },
  {
    badgeId: 'A123',
    email: 'john.doe@example.com',
    role: 1, // assuming 1 is for normal user
    userId: 101,
    userName: 'john_doe',
  },
  {
    badgeId: 'B456',
    email: 'jane.smith@example.com',
    role: 2, // assuming 2 is for admin
    userId: 102,
    userName: 'jane_smith',
  },
  {
    badgeId: 'C789',
    email: 'alice.jones@example.com',
    role: 1, // assuming 1 is for normal user
    userId: 103,
    userName: 'alice_jones',
  },
  {
    badgeId: 'D012',
    email: 'bob.martin@example.com',
    role: 1, // assuming 1 is for normal user
    userId: 104,
    userName: 'bob_martin',
  },
  {
    badgeId: 'E345',
    email: 'carol.white@example.com',
    role: 2, // assuming 2 is for admin
    userId: 105,
    userName: 'carol_white',
  },
  {
    badgeId: 'D012',
    email: 'bob.martin@example.com',
    role: 1, // assuming 1 is for normal user
    userId: 104,
    userName: 'bob_martin',
  },
];

export const sampleGroups: Group[] = [
  {
    groupId: 1,
    groupName: 'Friends',
  },
  {
    groupId: 2,
    groupName: 'Family',
  },
  {
    groupId: 3,
    groupName: 'Work',
  },
  {
    groupId: 4,
    groupName: 'Schoolmates',
  },
  {
    groupId: 5,
    groupName: 'Gym Buddies',
  },
];

export const chatData: ChatDataProps[] = [
  {
    id: 1,
    name: 'Alice',
    time: '2025-03-17 09:00 AM',
    lastMessage: "Hey, how's it going?",
    connectionId: 'conn-001',
  },
  {
    id: 2,
    name: 'Bob',
    time: '2025-03-17 09:15 AM',
    lastMessage: "Let's catch up soon!",
    connectionId: 'conn-002',
  },
  {
    id: 3,
    name: 'Charlie',
    time: '2025-03-17 09:30 AM',
    lastMessage: 'Can we reschedule our meeting?',
    connectionId: 'conn-003',
  },
  {
    id: 4,
    name: 'Diana',
    time: '2025-03-17 09:45 AM',
    lastMessage: "I'll send you the details.",
    connectionId: 'conn-004',
  },
  {
    id: 5,
    name: 'Eve',
    time: '2025-03-17 10:00 AM',
    lastMessage: 'Looking forward to our next project!',
    connectionId: 'conn-005',
  },
];

import { ChatDataProps } from './Types';

// export const SOCKET_URL = 'http://10.0.2.2:5162/signalrtc';
export const SOCKET_URL = 'http://127.0.0.1:5162/signalrtc';

export const USER_CONTEXT: ChatDataProps = {
  id: 1,
  name: 'Chrome',
  time: '10:30 AM',
  lastMessage: 'Hey! How are you?',
  connectionId: 'I6yM7Wr8IFll3kcBKVXQWg',
};

export const CHAT_TEST_DATA: ChatDataProps[] = [
  {
    id: 1,
    name: 'Chrome',
    time: '10:30 AM',
    lastMessage: 'Hey! How are you?',
    connectionId: 'I6yM7Wr8IFll3kcBKVXQWg',
  },
  {
    id: 2,
    name: 'Edge',
    time: 'Yesterday',
    lastMessage: "Let's catch up soon.",
    connectionId: 'R-efzNHU894RGXYLoft9EA',
  },
  {
    id: 3,
    name: 'Incog',
    time: 'Monday',
    lastMessage: 'Did you check the document?',
    connectionId: 'HdrHx-u-Ou4cHrb7R49h5g',
  },
  {
    id: 6,
    name: 'Test',
    time: 'Sunday',
    lastMessage: 'See you at the event!',
    connectionId: 'R-efzNHU894RGXYLoft9EA',
  },
];

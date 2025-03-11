import { ChatDataProps } from '@/constants/Types';
import React, { createContext, useContext, useState } from 'react';

// Define the shape of the object you want to store in context
interface User {
  id: string;
  name: string;
  time: string;
  lastMessage: string;
  connectionId: string;
}

interface UserProviderProps {
  children: React.ReactNode;
}

// Create the context with default value as null or empty object
const UserContext = createContext<{
  user: ChatDataProps | null;
  setUser: React.Dispatch<React.SetStateAction<ChatDataProps | null>>;
}>({
  user: null,
  setUser: () => {},
});

// Create the provider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ChatDataProps | null>(null);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

// Custom hook to access the context
export const useUser = () => useContext(UserContext);

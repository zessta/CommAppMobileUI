// SocketContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SignalR from '@microsoft/signalr';

const SocketContext = createContext<any>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [connection, setConnection] = useState<SignalR.HubConnection | null>(null);

  useEffect(() => {
    // joinChat()

    return () => {
      if (connection) {
        console.log('coming here');
        connection.stop();
      }
    };
  }, []);

  const joinChat = async () => {
    const newConnection = new SignalR.HubConnectionBuilder()
      // //http://10.0.2.2:5162/signalrtc --  emulator
      // //http://127.0.0.1:5162/signalrtc -- web
      .withUrl('http://10.0.2.2:5162/signalrtc', {
        // skipNegotiation: true,
        // transport: SignalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    //newConnection.onclose(() => setUsername(null));
    await newConnection.start();
    setConnection(newConnection);
    const testing = await newConnection.invoke('GetUserList');
    console.log('testing', testing);
    // await connection.invoke('GetGroups'); // Fetch groups on login
    // setUsername(user);
  };

  return <SocketContext.Provider value={connection}>{children}</SocketContext.Provider>;
};

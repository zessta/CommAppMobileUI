// SignalRService.ts
import * as signalR from '@microsoft/signalr';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Configure notifications globally
const setupNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting: boolean = false;
  private isGlobalListenersInitialized: boolean = false; // Track global listeners

  // Singleton instance
  private static instance: SignalRService;

  private constructor() {
    // Initialize notifications on service creation
    setupNotifications();
  }

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async connect(hubUrl: string, options?: signalR.IHttpConnectionOptions) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.isConnecting) {
      return this.connection;
    }

    try {
      this.isConnecting = true;
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, options)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      await this.connection.start();
      console.log('SignalR Connected');

      // Handle reconnection
      this.connection.onreconnecting((error) => {
        console.log('SignalR Reconnecting:', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('SignalR Reconnected:', connectionId);
      });

      this.connection.onclose((error) => {
        console.log('SignalR Disconnected:', error);
      });

      // Initialize global event listeners after connection
      this.setupGlobalListeners();

      return this.connection;
    } catch (error) {
      console.error('SignalR Connection Error:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  // Setup global event listeners
  private setupGlobalListeners() {
    if (!this.connection || this.isGlobalListenersInitialized) return;

    const handleAddedToGroup = async (groupId: number, groupName: string) => {
      console.log('AddedToGroup (Global):', groupId, groupName);
      // Show notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "You've been added to a group!",
          body: `You have been added to the group: ${groupName}`,
          data: { groupId, groupName },
        },
        trigger: null, // Trigger immediately
      });
    };

    this.connection.on('AddedToGroup', handleAddedToGroup);
    this.isGlobalListenersInitialized = true;

    // Clean up global listeners on connection close
    this.connection.onclose(() => {
      this.isGlobalListenersInitialized = false;
    });
  }

  public getConnection() {
    return this.connection;
  }

  public async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.isGlobalListenersInitialized = false; // Reset global listeners
    }
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Custom hook to use SignalR in components
export const useSignalR = (hubUrl: string, options?: signalR.IHttpConnectionOptions) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const signalRService = SignalRService.getInstance();

  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      try {
        // Check if we have a valid token before connecting
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const customOptions = {
            transport: signalR.HttpTransportType.WebSockets,
            accessTokenFactory: () => token,
            ...options, // Merge with any additional options
          };
          // Only proceed with the connection if token exists
          const conn = await signalRService.connect(hubUrl, customOptions);
          if (mounted) {
            setConnection(conn);
          }
        } else {
          console.log('No token found, skipping SignalR connection');
        }
      } catch (error) {
        console.error('SignalR Hook Error:', error);
      }
    };

    if (!signalRService.isConnected()) {
      initializeConnection();
    } else {
      setConnection(signalRService.getConnection());
    }

    return () => {
      mounted = false;
      // Do not disconnect here to keep the connection alive across screens
    };
  }, [hubUrl, options]);

  return connection;
};

export default SignalRService.getInstance();

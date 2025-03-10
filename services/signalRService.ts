// src/services/signalRService.ts
import * as signalR from '@microsoft/signalr';
import { useState, useEffect } from 'react';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting: boolean = false;

  // Singleton instance
  private static instance: SignalRService;

  private constructor() {}

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

      return this.connection;
    } catch (error) {
      console.error('SignalR Connection Error:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  public getConnection() {
    return this.connection;
  }

  public async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
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
        const conn = await signalRService.connect(hubUrl, options);
        if (mounted) {
          setConnection(conn);
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
      // Only disconnect if you want to close connection when component unmounts
      // signalRService.disconnect();
    };
  }, [hubUrl]);

  return connection;
};

export default SignalRService.getInstance();

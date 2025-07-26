import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import WebSocketService from '../services/websocket';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      const wsSocket = WebSocketService.connect(token);
      setSocket(wsSocket);

      wsSocket.on('connect', () => {
        setIsConnected(true);
      });

      wsSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      return () => {
        WebSocketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  const emit = (event, data) => {
    WebSocketService.emit(event, data);
  };

  const on = (event, callback) => {
    WebSocketService.on(event, callback);
  };

  const off = (event, callback) => {
    WebSocketService.off(event, callback);
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        emit,
        on,
        off,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 
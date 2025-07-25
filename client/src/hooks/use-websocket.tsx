import { useEffect, useRef, useState } from "react";
import { getAuthToken } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import type { Message } from "@shared/schema";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      const token = getAuthToken();
      if (token) {
        ws.send(JSON.stringify({ type: 'authenticate', token }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'newMessage') {
          setMessages(prev => [...prev, data.data]);
        } else if (data.type === 'messageSent') {
          // Message sent confirmation
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  const sendMessage = (message: Omit<Message, 'id' | 'read' | 'createdAt'>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'sendMessage',
        data: message,
      }));
    }
  };

  return {
    isConnected,
    messages,
    sendMessage,
  };
}

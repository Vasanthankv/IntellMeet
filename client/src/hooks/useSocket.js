import { useState, useEffect } from 'react';

// PLACEHOLDER: This hook prepares the architecture for future Socket.IO integration.
export function useSocket(meetingId) {
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    // In the future:
    // const newSocket = io(process.env.REACT_APP_SOCKET_URL);
    // newSocket.emit('join-meeting', meetingId);
    console.log(`[Socket.IO Mock] Connected to socket for meeting ${meetingId}`);
    setIsConnected(true);

    return () => {
      console.log(`[Socket.IO Mock] Disconnected`);
      setIsConnected(false);
    };
  }, [meetingId]);

  const sendMessage = (text, user) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      user,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMessage]);
    // In the future: socket.emit('send-message', newMessage);
  };

  return {
    isConnected,
    chatMessages,
    typingUsers,
    sendMessage
  };
}

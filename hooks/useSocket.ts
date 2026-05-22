import { useGetCurrentUser } from "@/api/user/user.api";
import { RootState } from "@/src/store";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";

// Types for Socket.IO events
export interface NotificationData {
  _id: string;
  title: string;
  message: string;
  type: "order" | "general" | "system";
  relatedId?: string;
  relatedModel?: string;
  metadata: Record<string, any>;
  isRead: boolean;
  sentAt: string;
  createdAt: string;
}

export interface MessageData {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image" | "file";
  imageUrl?: string;
  replyTo?: string;
  createdAt: string;
  sender: string;
}

export interface TypingData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessagesReadData {
  conversationId: string;
  messageIds?: string[];
  userId: string;
}

interface UseSocketOptions {
  autoConnect?: boolean;
  serverUrl?: string;
}

export const getSocketServerUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "").replace(/\/api\/v1\/?$/, "");
  }

  return "http://localhost:3000";
};

export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (
    conversationId: string,
    content: string,
    messageType?: "text" | "image" | "file",
  ) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  onNotification: (
    callback: (notification: NotificationData) => void,
  ) => () => void;
  onMessage: (callback: (message: MessageData) => void) => () => void;
  onTyping: (callback: (data: TypingData) => void) => () => void;
  onMessagesRead: (callback: (data: MessagesReadData) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const useSocketConnection = (
  userId: string | null,
  options: UseSocketOptions = {},
): SocketContextValue => {
  const { autoConnect = true, serverUrl = getSocketServerUrl() } = options;

  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef(userId);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  userIdRef.current = userId;

  useEffect(() => {
    if (!autoConnect || !userId) return;

    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      setConnectionError(null);
      socket.emit("joinUserRoom", userId);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);

      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    return () => {
      socket.emit("leaveUserRoom", userId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, autoConnect, serverUrl]);

  const connect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("joinConversation", conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leaveConversation", conversationId);
    }
  };

  const sendMessage = (
    conversationId: string,
    content: string,
    messageType: "text" | "image" | "file" = "text",
  ) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("sendMessage", {
        conversationId,
        content,
        messageType,
      });
    }
  };

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      const event = isTyping ? "typing" : "stopTyping";
      socketRef.current.emit(event, {
        conversationId,
        userId: userIdRef.current,
      });
    }
  };

  const onNotification = (
    callback: (notification: NotificationData) => void,
  ) => {
    const socket = socketRef.current;
    if (!socket) return () => undefined;

    socket.on("newNotification", callback);
    return () => {
      socket.off("newNotification", callback);
    };
  };

  const onMessage = (callback: (message: MessageData) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => undefined;

    socket.on("newMessage", callback);
    return () => {
      socket.off("newMessage", callback);
    };
  };

  const onTyping = (callback: (data: TypingData) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => undefined;

    socket.on("userTyping", callback);
    return () => {
      socket.off("userTyping", callback);
    };
  };

  const onMessagesRead = (callback: (data: MessagesReadData) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => undefined;

    socket.on("messagesRead", callback);
    return () => {
      socket.off("messagesRead", callback);
    };
  };

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    onNotification,
    onMessage,
    onTyping,
    onMessagesRead,
  };
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const { data: user } = useGetCurrentUser();
  const userId = user?._id ?? null;

  const socket = useSocketConnection(userId, {
    autoConnect: Boolean(accessToken && userId),
  });

  return React.createElement(
    SocketContext.Provider,
    { value: socket },
    children,
  );
}

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

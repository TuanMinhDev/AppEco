import { useGetCurrentUser } from "@/api/user/user.api";
import { useEffect } from "react";
import { useNotifications } from "./useNotifications";
import { useRealtimeOrders } from "./useRealtimeOrders";
import { useSocket } from "./useSocket";

export const useAuthSocket = () => {
  const { data: user } = useGetCurrentUser();
  const userId = user?._id || null;

  const socket = useSocket();

  const notifications = useNotifications(userId, {
    showToast: true,
    maxNotifications: 50,
  });

  const realtimeOrders = useRealtimeOrders(userId);

  // Handle connection state changes
  useEffect(() => {
    if (socket.isConnected && userId) {
      console.log("Socket.IO connected for user:", userId);
    } else if (socket.connectionError) {
      console.error("Socket.IO connection error:", socket.connectionError);
    }
  }, [socket.isConnected, socket.connectionError, userId]);

  return {
    socket,
    notifications,
    realtimeOrders,
    isConnected: socket.isConnected,
    connectionError: socket.connectionError,
  };
};

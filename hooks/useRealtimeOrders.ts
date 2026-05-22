import { invalidateOrderQueriesFromRealtimeEvent } from '@/api/order/order.api';
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NotificationData, useSocket } from "./useSocket";

export interface OrderUpdateData {
  orderId: string;
  orderCode: string;
  status: string;
  userId?: string;
  sellerId?: string;
}

export const useRealtimeOrders = (userId: string | null) => {
  const { onNotification, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdateData[]>([]);

  useEffect(() => {
    if (!isConnected || !onNotification) return;

    const unsubscribe = onNotification((notification: NotificationData) => {
      // Handle order notifications
      if (notification.type === "order") {
        const { orderId, orderCode, status } = notification.metadata;

        const orderUpdate: OrderUpdateData = {
          orderId,
          orderCode,
          status,
          userId: notification.metadata.userId,
          sellerId: notification.metadata.sellerId,
        };

        // Add to order updates
        setOrderUpdates((prev) => [orderUpdate, ...prev.slice(0, 9)]); // Keep last 10 updates

        // Invalidate relevant queries to refresh data
        if (userId) {
          void invalidateOrderQueriesFromRealtimeEvent(queryClient, orderId);
        }

        // Handle specific order status changes
        handleOrderStatusChange(notification);
      }
    });

    return unsubscribe;
  }, [isConnected, onNotification, userId, queryClient]);

  const handleOrderStatusChange = (notification: NotificationData) => {
    const { title, metadata } = notification;

    switch (title) {
      case "Bán có single hàng new":
        // New order for seller
        console.log("New order received:", metadata.orderCode);
        break;
      case "Bán hàng thành công":
        // Order placed successfully for buyer
        console.log("Order placed successfully:", metadata.orderCode);
        break;
      case "Bán hàng giao thành công":
        // Order delivered
        console.log("Order delivered:", metadata.orderCode);
        break;
      case "Bán hàng hàm":
        // Order cancelled
        console.log("Order cancelled:", metadata.orderCode);
        break;
      default:
        console.log("Order notification:", title, metadata);
    }
  };

  const clearOrderUpdates = () => {
    setOrderUpdates([]);
  };

  const getOrderUpdate = (orderId: string) => {
    return orderUpdates.find((update) => update.orderId === orderId);
  };

  const getLatestOrderStatus = (orderId: string) => {
    const update = getOrderUpdate(orderId);
    return update?.status;
  };

  return {
    orderUpdates,
    clearOrderUpdates,
    getOrderUpdate,
    getLatestOrderStatus,
  };
};

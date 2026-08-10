import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useGuildStore } from "../store/guildStore";
import { useSocketStore } from "../store/socketStore";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const { accessToken, logout } = useAuthStore();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const {
    addMessage,
    updateMessage,
    removeMessage,
    updatePresence,
    setTyping,
  } = useGuildStore();
  const setSocketConnected = useSocketStore((s) => s.setConnected);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io("http://localhost:3000", {
      auth: { token: accessToken },
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected:", socket.id);
      setSocketConnected(true);

      if (currentUserId) {
        updatePresence(currentUserId, "online");
      }

      heartbeatRef.current = setInterval(() => {
        socket.emit("heartbeat");
      }, 30_000);

      const { activeGuildId, activeChannelId } = useGuildStore.getState();
      if (activeGuildId) {
        socket.emit("guild:join", { guildId: activeGuildId });
      }
      if (activeChannelId && activeGuildId) {
        socket.emit("channel:join", {
          channelId: activeChannelId,
          guildId: activeGuildId,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      setSocketConnected(false);
      if (currentUserId) updatePresence(currentUserId, "offline");
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    });

    socket.on(
      "message:new",
      (message: {
        id: string;
        content: string;
        channelId: string;
        authorId: string;
        createdAt: string;
      }) => {
        addMessage(message);
      },
    );

    socket.on(
      "message:update",
      (data: { id: string; content: string; editedAt: string }) => {
        updateMessage(data.id, {
          content: data.content,
          editedAt: data.editedAt,
        });
      },
    );

    socket.on("message:delete", (data: { id: string }) => {
      removeMessage(data.id);
    });

    socket.on(
      "presence:update",
      ({
        userId,
        status,
      }: {
        userId: string;
        status: "online" | "offline";
      }) => {
        updatePresence(userId, status);
      },
    );

    // Typing indicators
    socket.on("typing:start", ({ userId }: { userId: string }) => {
      setTyping(userId, true);
      const existing = typingTimers.current.get(userId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setTyping(userId, false);
        typingTimers.current.delete(userId);
      }, 3000);
      typingTimers.current.set(userId, timer);
    });

    socket.on("typing:stop", ({ userId }: { userId: string }) => {
      const existing = typingTimers.current.get(userId);
      if (existing) clearTimeout(existing);
      typingTimers.current.delete(userId);
      setTyping(userId, false);
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket connect error:", err.message);
      if (
        err.message === "unauthorized" ||
        err.message.includes("jwt") ||
        err.message.includes("token")
      ) {
        logout();
      }
    });

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      typingTimers.current.forEach((t) => clearTimeout(t));
      typingTimers.current.clear();
      setSocketConnected(false);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, currentUserId]);

  return socketRef;
}

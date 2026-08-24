import { useEffect, useRef, useState, useCallback } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { useGuildStore } from "../../store/guildStore";
import { useAuthStore } from "../../store/authStore";
import { MessageItem } from "./MessageItem";
import type { IMessage } from "../../store/guildStore";

interface IMessageList {
  socketRef: RefObject<Socket | null>;
  activeChannelId: string;
  activeGuildId: string;
}

const MESSAGES_PER_PAGE = 50;

export function MessageList({ socketRef, activeChannelId, activeGuildId }: IMessageList) {
  const {
    messages,
    members,
    typingUsers,
    setMessages,
    prependMessages,
    setHasMore,
    setLoadingMore,
    hasMoreMessages,
    isLoadingMore,
  } = useGuildStore();
  const { user } = useAuthStore();

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [firstItemIndex, setFirstItemIndex] = useState(100000);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let historyHandler: ((payload: { data: IMessage[] }) => void) | null = null;
    let retryTimer: ReturnType<typeof setInterval> | null = null;

    const cached = useGuildStore.getState().messagesByChannel[activeChannelId];
    if (cached && cached.length > 0) {
      setMessages(activeChannelId, cached);
      setHasMore(activeChannelId, true);
      return;
    }

    const requestHistory = () => {
      const socket = socketRef.current;
      if (!socket?.connected || cancelled) return false;

      if (historyHandler) socket.off("message:history", historyHandler);

      historyHandler = (payload: { data: IMessage[] }) => {
        if (cancelled) return;
        const msgs = payload.data ?? [];
        setMessages(activeChannelId, msgs);
        setHasMore(activeChannelId, msgs.length === MESSAGES_PER_PAGE);
      };

      socket.once("message:history", historyHandler);
      socket.emit("message:history", {
        channelId: activeChannelId,
        guildId: activeGuildId,
      });
      return true;
    };

    if (!requestHistory()) {
      retryTimer = setInterval(() => {
        if (requestHistory()) {
          clearInterval(retryTimer!);
          retryTimer = null;
        }
      }, 150);
    }

    const socket = socketRef.current;
    const onConnect = () => { if (!cancelled) requestHistory(); };
    socket?.on("connect", onConnect);

    return () => {
      cancelled = true;
      if (retryTimer) clearInterval(retryTimer);
      const s = socketRef.current;
      if (s && historyHandler) s.off("message:history", historyHandler);
      s?.off("connect", onConnect);
    };
  }, [activeChannelId, activeGuildId, setMessages, setHasMore, socketRef]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore[activeChannelId]) return;
    if (!hasMoreMessages[activeChannelId]) return;
    if (isLoadingRef.current) return;

    const current =
      useGuildStore.getState().messagesByChannel[activeChannelId] ?? [];
    if (!current.length) return;

    const socket = socketRef.current;
    if (!socket?.connected) return;

    isLoadingRef.current = true;
    setLoadingMore(activeChannelId, true);

    return new Promise<void>((resolve) => {
      const handler = (payload: { data: IMessage[] }) => {
        const older = payload.data ?? [];
        if (older.length > 0) {
          setFirstItemIndex((prev) => prev - older.length);
          prependMessages(activeChannelId, older);
        }
        setHasMore(activeChannelId, older.length === MESSAGES_PER_PAGE);
        setLoadingMore(activeChannelId, false);
        isLoadingRef.current = false;
        resolve();
      };

      socket.once("message:history", handler);
      socket.emit("message:history", {
        channelId: activeChannelId,
        guildId: activeGuildId,
        before: current[0].createdAt, 
      });
    });
  }, [activeChannelId, activeGuildId, hasMoreMessages, isLoadingMore, prependMessages, setHasMore, setLoadingMore, socketRef]);

  const channelMessages = messages.filter(
    (m) => m.channelId === activeChannelId
  );

  const typingNames = typingUsers
    .filter((id) => id !== user?.id)
    .map((id) => members.find((m) => m.userId === id)?.user.username)
    .filter((name): name is string => Boolean(name));

  return (
    <>
      <div className="flex-1 overflow-hidden">
        <Virtuoso
          ref={virtuosoRef}
          firstItemIndex={firstItemIndex}
          initialTopMostItemIndex={Math.max(0, channelMessages.length - 1)}
          data={channelMessages}
          startReached={loadMore}
          followOutput="smooth"
          components={{
            Header: () =>
              isLoadingMore[activeChannelId] ? (
                <div className="py-3 text-center text-zinc-600 text-xs">
                  Loading older messages...
                </div>
              ) : null,
            EmptyPlaceholder: () => (
              <div className="flex items-center justify-center h-full">
                <p className="text-zinc-600 text-sm">
                  No messages yet. Say something
                </p>
              </div>
            ),
          }}
          itemContent={(_, message) => (
            <MessageItem
              key={message.id}
              message={message}
              members={members}
              currentUserId={user?.id ?? ""}
              socketRef={socketRef}
            />
          )}
        />
      </div>

      <div className="px-4 h-5 flex items-center shrink-0">
        {typingNames.length > 0 && (
          <p className="text-zinc-500 text-xs italic">
            {typingNames.join(", ")}{" "}
            {typingNames.length === 1 ? "is typing" : "are typing"}...
          </p>
        )}
      </div>
    </>
  );
}
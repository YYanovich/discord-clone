import { useEffect, useRef, useState, useCallback } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { useGuildStore } from "../../store/guildStore";
import { useAuthStore } from "../../store/authStore";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import type { IMessage } from "../../store/guildStore";
import SearchModal from "../modals/SearchModal";

interface IChatArea {
  socketRef: RefObject<Socket | null>;
}

const MESSAGES_PER_PAGE = 50;

export default function ChatArea({ socketRef }: IChatArea) {
  const {
    activeChannelId,
    activeGuildId,
    messages,
    typingUsers,
    addMessage,
    setMessages,
    prependMessages,
    members,
    guilds,
    setHasMore,
    setLoadingMore,
    hasMoreMessages,
    isLoadingMore,
  } = useGuildStore();
  const { user } = useAuthStore();

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const [firstItemIndex, setFirstItemIndex] = useState(100000);
  const [showSearch, setShowSearch] = useState(false);

  const isLoadingHistoryRef = useRef(false);

  useEffect(() => {
    if (!activeChannelId) return;
    let cancelled = false;
    let historyHandler: ((payload: { data: IMessage[] }) => void) | null = null;
    let retryTimer: ReturnType<typeof setInterval> | null = null;

    const cached = useGuildStore.getState().messagesByChannel[activeChannelId];
    if (cached && cached.length > 0) {
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
    const onConnect = () => {
      if (!cancelled) requestHistory();
    };
    socket?.on("connect", onConnect);

    return () => {
      cancelled = true;
      if (retryTimer) clearInterval(retryTimer);
      if (socket && historyHandler)
        socket.off("message:history", historyHandler);
      socket?.off("connect", onConnect);
    };
  }, [activeChannelId]);

  const loadMore = useCallback(async () => {
    if (!activeChannelId || !activeGuildId) return;
    if (isLoadingMore[activeChannelId]) return;
    if (!hasMoreMessages[activeChannelId]) return;
    if (isLoadingHistoryRef.current) return;

    const currentMessages =
      useGuildStore.getState().messagesByChannel[activeChannelId] ?? [];
    if (currentMessages.length === 0) return;

    isLoadingHistoryRef.current = true;
    setLoadingMore(activeChannelId, true);

    const socket = socketRef.current;
    if (!socket?.connected) {
      setLoadingMore(activeChannelId, false);
      isLoadingHistoryRef.current = false;
      return;
    }

    const oldest = currentMessages[0];

    return new Promise<void>((resolve) => {
      const handler = (payload: { data: IMessage[] }) => {
        const older = payload.data ?? [];
        if (older.length > 0) {
          setFirstItemIndex((prev) => prev - older.length);
          prependMessages(activeChannelId, older);
        }
        setHasMore(activeChannelId, older.length === MESSAGES_PER_PAGE);
        setLoadingMore(activeChannelId, false);
        isLoadingHistoryRef.current = false;
        resolve();
      };

      socket.once("message:history", handler);
      socket.emit("message:history", {
        channelId: activeChannelId,
        guildId: activeGuildId,
        before: oldest.createdAt,
      });
    });
  }, [activeChannelId, activeGuildId, hasMoreMessages, isLoadingMore]);

  const activeGuild = guilds.find((g) => g.id === activeGuildId);
  const activeChannel = activeGuild?.channels.find(
    (ch) => ch.id === activeChannelId,
  );

  const typingNames = typingUsers
    .filter((id) => id !== user?.id)
    .map((id) => members.find((m) => m.userId === id)?.user.username)
    .filter((name): name is string => Boolean(name));

  const channelMessages = messages.filter(
    (m) => m.channelId === activeChannelId,
  );

  if (!activeChannelId) {
    return (
      <div className="flex-1 bg-zinc-900/40 flex items-center justify-center">
        <p className="text-zinc-500">Choose channel</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-900/40 backdrop-blur-sm flex flex-col min-w-0">
      <div
        className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">#</span>
          <h3 className="text-zinc-100 font-semibold text-sm">
            {activeChannel?.name ?? "channel"}
          </h3>
        </div>
        <button
          onClick={() => setShowSearch(true)}
          title="Search messages"
          className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {showSearch && activeGuildId && (
        <SearchModal
          guildId={activeGuildId}
          onClose={() => setShowSearch(false)}
        />
      )}

      <div className="flex-1 overflow-hidden">
        <Virtuoso
          ref={virtuosoRef}
          className="[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600"
          firstItemIndex={firstItemIndex}
          initialTopMostItemIndex={channelMessages.length - 1}
          data={channelMessages}
          startReached={loadMore}
          followOutput="smooth"
          components={{
            Header: () =>
              isLoadingMore[activeChannelId ?? ""] ? (
                <div className="py-4 text-center text-zinc-600 text-sm">
                  Loading...
                </div>
              ) : null,
          }}
          itemContent={(_, message) => (
            <MessageItem
              key={message.id}
              message={message}
              members={members}
              currentUserId={user?.id ?? ""}
              socketRef={socketRef}
              activeGuildId={activeGuildId ?? ""}
            />
          )}
        />
      </div>

      <div className="px-4 h-5 flex items-center shrink-0">
        {typingNames.length > 0 && (
          <p className="text-zinc-500 text-xs italic">
            {typingNames.join(", ")}{" "}
            {typingNames.length === 1 ? "typing" : "typings"}...
          </p>
        )}
      </div>

      <MessageInput
        socketRef={socketRef}
        activeChannelId={activeChannelId}
        activeGuildId={activeGuildId ?? ""}
        currentUser={user}
        addMessage={addMessage}
      />
    </div>
  );
}

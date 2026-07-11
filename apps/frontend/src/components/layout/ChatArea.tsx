import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { useGuildStore } from "../../store/guildStore";
import { useAuthStore } from "../../store/authStore";
import type { IMessage } from "../../store/guildStore";

interface Props {
  socketRef: RefObject<Socket | null>;
}

export default function ChatArea({ socketRef }: Props) {
  const {
    activeGuildId,
    activeChannelId,
    messages,
    members,
    typingUsers,
    addMessage,
    setMessages,
    guilds,
  } = useGuildStore();
  const { user } = useAuthStore();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activeChannelId) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setInterval> | null = null;
    let historyHandler:
      ((payload: { data?: IMessage[] } | IMessage[]) => void) | null = null;

    const requestHistory = () => {
      const socket = socketRef.current;
      if (!socket?.connected || cancelled) return false;

      if (historyHandler) socket.off("message:history", historyHandler);

      historyHandler = (payload: { data?: IMessage[] } | IMessage[]) => {
        if (cancelled) return;
        const raw = Array.isArray(payload)
          ? payload
          : ((payload as { data?: IMessage[] }).data ?? []);
        setMessages(activeChannelId, raw);
      };

      socket.once("message:history", historyHandler);
      socket.emit("message:history", { channelId: activeChannelId });
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
      if (cancelled) return;
      if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
      }
      requestHistory();
    };
    socket?.on("connect", onConnect);

    return () => {
      cancelled = true;
      if (retryTimer) clearInterval(retryTimer);
      const s = socketRef.current;
      if (s) {
        if (historyHandler) s.off("message:history", historyHandler);
        s.off("connect", onConnect);
      }
    };
  }, [activeChannelId, socketRef]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChannelId || !activeGuildId || !user) return;

    const socket = socketRef.current;
    if (!socket?.connected) return;

    const optimistic = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      channelId: activeChannelId,
      authorId: user.id,
      createdAt: new Date().toISOString(),
    };
    addMessage(optimistic);
    setInput("");

    socket.emit("message:send", {
      channelId: activeChannelId,
      guildId: activeGuildId,
      content: trimmed,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing:stop", {
      channelId: activeChannelId,
      guildId: activeGuildId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    const socket = socketRef.current;
    if (!socket?.connected || !activeGuildId || !activeChannelId) return;

    socket.emit("typing:start", {
      channelId: activeChannelId,
      guildId: activeGuildId,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", {
        channelId: activeChannelId,
        guildId: activeGuildId,
      });
    }, 2000);
  };

  const activeGuild = guilds.find((g) => g.id === activeGuildId);
  const activeChannel = activeGuild?.channels.find(
    (ch) => ch.id === activeChannelId,
  );

  const typingNames = typingUsers
    .filter((id) => id !== user?.id)
    .map((id) => {
      const member = members.find(
        (candidate) => candidate.userId === id || candidate.user?.id === id,
      );

      return member?.user.username;
    })
    .filter((name): name is string => Boolean(name));

  if (!activeChannelId) {
    return (
      <div className="flex-1 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-600 text-sm">
            Select channel to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-900/40 backdrop-blur-sm flex flex-col min-w-0">
      <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center gap-2 shrink-0">
        <span className="text-zinc-500 text-sm">#</span>
        <h3 className="text-zinc-100 font-semibold text-sm">
          {activeChannel?.name ?? "channel"}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-600 text-sm">Chat is empty</p>
          </div>
        )}

        {messages.map((message) => {
          const isTemp = message.id.startsWith("temp-");
          const member = members.find(
            (candidate) =>
              candidate.userId === message.authorId ||
              candidate.user?.id === message.authorId,
          );
          const username = member?.user.username?.trim() || "User";
          const avatarLetter = username.charAt(0).toUpperCase() || "?";

          return (
            <div
              key={message.id}
              className={`
                flex items-start gap-3 py-1.5 px-2 rounded-lg
                hover:bg-zinc-800/30 group transition-colors
                ${isTemp ? "opacity-50" : ""}
              `}
            >
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                {avatarLetter}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-zinc-200 text-sm font-medium">
                    {username}
                  </span>
                  <span className="text-zinc-600 text-[11px]">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isTemp && (
                    <span className="text-zinc-600 text-[11px] italic">
                      sending...
                    </span>
                  )}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed wrap-break-words">
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 h-5 flex items-center shrink-0">
        {typingNames.length > 0 && (
          <p className="text-zinc-500 text-xs italic">
            {typingNames.join(", ")} typing...
          </p>
        )}
      </div>

      <div className="px-4 pb-4 shrink-0">
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl flex items-center gap-3 px-4 py-3 focus-within:border-zinc-600/80 transition-colors">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Wite message"
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none min-w-0"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !socketRef.current?.connected}
            className="text-zinc-600 hover:text-indigo-400 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors duration-150 shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

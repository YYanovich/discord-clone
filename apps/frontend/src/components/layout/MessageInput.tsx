import { useRef, useState } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import type { IMessage } from "../../store/guildStore";

interface IUser { id: string; username: string; email: string; }

interface IMessageInput {
  socketRef: RefObject<Socket | null>;
  activeChannelId: string;
  activeGuildId: string;
  currentUser: IUser | null;
  addMessage: (message: IMessage) => void;
}

export function MessageInput({
  socketRef, activeChannelId, activeGuildId, currentUser, addMessage
}: IMessageInput) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !currentUser) return;
    const socket = socketRef.current;
    if (!socket?.connected) return;

    addMessage({
      id: `temp-${Date.now()}`,
      content: trimmed,
      channelId: activeChannelId,
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
    });

    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    socket.emit("message:send", {
      channelId: activeChannelId,
      guildId: activeGuildId,
      content: trimmed,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing:stop", { channelId: activeChannelId, guildId: activeGuildId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit("typing:start", { channelId: activeChannelId, guildId: activeGuildId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { channelId: activeChannelId, guildId: activeGuildId });
    }, 2000);
  };

  return (
    <div className="px-4 pb-4 shrink-0">
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl flex items-end gap-3 px-4 py-3 focus-within:border-zinc-600/80 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type message..."
          rows={1}
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none min-w-0 resize-none max-h-32 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
          style={{ height: "auto" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !socketRef.current?.connected}
          className="text-zinc-600 hover:text-indigo-400 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors shrink-0 mb-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
      <p className="text-zinc-700 text-[11px] mt-1 px-1">
        Enter — send · Shift+Enter — new line
      </p>
    </div>
  );
}
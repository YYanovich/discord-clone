import { useState } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { useGuildStore } from "../../store/guildStore";
import { useAuthStore } from "../../store/authStore";
import { ChannelHeader } from "./ChannelHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import SearchModal from "../modals/SearchModal";

interface Props {
  socketRef: RefObject<Socket | null>;
}

export default function ChatArea({ socketRef }: Props) {
  const { activeChannelId, activeGuildId, guilds, addMessage } =
    useGuildStore();
  const { user } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);

  const activeGuild = guilds.find((g) => g.id === activeGuildId);
  const activeChannel = activeGuild?.channels.find(
    (ch) => ch.id === activeChannelId,
  );

  if (!activeChannelId || !activeGuildId) {
    return (
      <div className="flex-1 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 text-lg font-medium mb-2">
            Select a channel
          </p>
          <p className="text-zinc-600 text-sm">
            Choose a text channel to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-900/40 backdrop-blur-sm flex flex-col min-w-0">
      <ChannelHeader
        channelName={activeChannel?.name ?? "channel"}
        onSearchOpen={() => setShowSearch(true)}
      />

      <MessageList
        socketRef={socketRef}
        activeChannelId={activeChannelId}
        activeGuildId={activeGuildId}
      />

      {user && (
        <MessageInput
          socketRef={socketRef}
          activeChannelId={activeChannelId}
          activeGuildId={activeGuildId}
          currentUser={user}
          addMessage={addMessage}
        />
      )}

      {showSearch && (
        <SearchModal
          guildId={activeGuildId}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}

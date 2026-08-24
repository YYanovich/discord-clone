import { useState, useEffect } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { useAuthStore } from "../../store/authStore";
import { useGuildStore } from "../../store/guildStore";
import { useVoiceStore } from "../../store/voiceStore";
import CreateChannelModal from "../modals/CreateChannelModal";
import InviteModal from "../modals/InviteModal";
import { useNavigate, useParams } from "react-router-dom";

interface IChannelSidebar {
  socketRef: RefObject<Socket | null>;
}

export default function ChannelSidebar({ socketRef }: IChannelSidebar) {
  const { user } = useAuthStore();
  const { guilds, activeGuildId, activeChannelId } = useGuildStore();
  const { activeVoiceChannelId, setActiveChannel: setVoiceActiveChannel } = useVoiceStore();

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const activeGuild = guilds.find((g) => g.id === activeGuildId);
  const isOwner = activeGuild?.ownerId === user?.id;

  const useNavigateHook = useNavigate();
  const { guildId: urlGuildId, channelId: urlChannelId } = useParams<{ 
    guildId: string; 
    channelId?: string 
  }>();

  useEffect(() => {
    if (urlChannelId && urlChannelId !== activeChannelId) {
      useGuildStore.setState({ activeChannelId: urlChannelId });
    }
  }, [urlChannelId, activeChannelId]);

  const handleSelectChannel = (channelId: string) => {
    if (!urlGuildId || activeChannelId === channelId) return;
    
    useGuildStore.setState({ activeChannelId: channelId });
    useNavigateHook(`/app/guild/${urlGuildId}/channel/${channelId}`);
    
    socketRef.current?.emit("channel:join", {
      channelId,
      guildId: urlGuildId,
      userId: user?.id,
    });
  };

  const handleSelectVoiceChannel = (channelId: string) => {
    if (!urlGuildId) return;

    useNavigateHook(`/app/guild/${urlGuildId}/channel/${channelId}`);

    if (activeVoiceChannelId === channelId) return;

    setVoiceActiveChannel(channelId, urlGuildId);

    socketRef.current?.emit("voice:join", {
      channelId,
      guildId: urlGuildId,
    });
  };

  if (!activeGuild) {
    return (
      <div className="w-60 bg-zinc-950/60 backdrop-blur-xl border-r border-zinc-800/80 flex items-center justify-center shrink-0">
        <p className="text-zinc-600 text-sm">Select a server</p>
      </div>
    );
  }

  const uncategorized = activeGuild.channels.filter(
    (ch) => !ch.categoryId && ch.type === "TEXT",
  );
  const voiceChannels = activeGuild.channels.filter(
    (ch) => ch.type === "VOICE" && !ch.categoryId,
  );

  return (
    <>
      <div className="w-60 bg-zinc-950/60 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col shrink-0">
        <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <h2 className="text-zinc-100 font-semibold text-sm truncate">
            {activeGuild.name}
          </h2>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setShowInvite(true)}
              title="Invite people"
              className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z" />
              </svg>
            </button>

            {isOwner && (
              <button
                onClick={() => setShowCreateChannel(true)}
                title="Create channel"
                className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {uncategorized.length > 0 && (
            <div className="mb-1">
              <p className="px-2 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Text channels
              </p>
              {uncategorized.map((channel) => {
                const isActive = activeChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel.id)}
                    className={`w-full text-left px-2 py-1.5 flex items-center gap-1.5 text-sm rounded-lg transition-colors cursor-pointer
                      ${
                        isActive
                          ? "bg-zinc-700/80 text-zinc-100"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                      }
                    `}
                  >
                    <span className="text-zinc-500 text-xs w-4 text-center shrink-0">
                      #
                    </span>
                    <span className="truncate">{channel.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeGuild.categories.map((category) => {
            const channels = activeGuild.channels.filter(
              (ch) => ch.categoryId === category.id,
            );
            if (channels.length === 0) return null;
            return (
              <div key={category.id} className="mt-3">
                <p className="px-2 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {category.name}
                </p>
                {channels.map((channel) => {
                  if (channel.type === "VOICE") {
                    const isActiveVoice = activeVoiceChannelId === channel.id;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectVoiceChannel(channel.id)}
                        className={`w-full text-left px-2 py-1.5 flex items-center gap-1.5 text-sm rounded-lg transition-colors cursor-pointer
                           ${isActiveVoice ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"}
                         `}
                      >
                        <span className="text-xs w-4 text-center shrink-0">
                          🔊
                        </span>
                        <span className="truncate">{channel.name}</span>
                      </button>
                    );
                  } else {
                    const isActive = activeChannelId === channel.id;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectChannel(channel.id)}
                        className={`w-full text-left px-2 py-1.5 flex items-center gap-1.5 text-sm rounded-lg transition-colors cursor-pointer
                           ${isActive ? "bg-zinc-700/80 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"}
                         `}
                      >
                        <span className="text-zinc-500 text-xs w-4 text-center shrink-0">
                          #
                        </span>
                        <span className="truncate">{channel.name}</span>
                      </button>
                    );
                  }
                })}
              </div>
            );
          })}

          {voiceChannels.length > 0 && (
            <div className="mt-3">
              <p className="px-2 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Voice channels
              </p>
              {voiceChannels.map((channel) => {
                const isActiveVoice = activeVoiceChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleSelectVoiceChannel(channel.id)}
                    className={`w-full text-left px-2 py-1.5 flex items-center gap-1.5 text-sm rounded-lg transition-colors cursor-pointer
                      ${isActiveVoice ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"}
                    `}
                  >
                    <span className="text-xs w-4 text-center shrink-0">🔊</span>
                    <span className="truncate">{channel.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateChannel && activeGuildId && (
        <CreateChannelModal
          guildId={activeGuildId}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
      {showInvite && activeGuildId && (
        <InviteModal
          guildId={activeGuildId}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGuildStore } from "../store/guildStore";
import { useSocket } from "../hooks/useSocket";
import { useVoiceSocket } from "../hooks/useVoiceSocket";
import { useVoiceStore } from "../store/voiceStore";
import { useAppBootstrap } from "../hooks/useAppBootstrap";
import GuildSidebar from "../components/layout/GuildSidebar";
import ChannelSidebar from "../components/layout/ChannelSidebar";
import ChatArea from "../components/layout/ChatArea";
import MemberList from "../components/layout/MemberList";
import VoiceChannelView from "../components/voice/VoiceChannelView";
import { PhoneCall } from "lucide-react"; 

export default function AppPage() {
  const { guildId: urlGuildId, channelId: urlChannelId } = useParams<{
    guildId?: string;
    channelId?: string;
  }>();
  
  const socketRef = useSocket();
  const { activeGuildId, guilds } = useGuildStore();
  const { activeVoiceChannelId, participants } = useVoiceStore();
  const [isVoiceMinimized, setIsVoiceMinimized] = useState(false);

  useVoiceSocket(socketRef);
  
  useAppBootstrap(urlGuildId, urlChannelId, socketRef);

  const activeGuild = guilds.find((g) => g.id === activeGuildId);
  const currentViewedChannel = activeGuild?.channels?.find((c) => c.id === urlChannelId);
  
  const isViewingVoiceChannel = currentViewedChannel?.type === "VOICE";
  const isConnectedToVoice = Boolean(activeVoiceChannelId);
  
  const showSplitScreen = isConnectedToVoice && !isViewingVoiceChannel && !isVoiceMinimized;

  useEffect(() => {
    if (isViewingVoiceChannel) {
      setIsVoiceMinimized(false);
    }
  }, [isViewingVoiceChannel]);

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      <GuildSidebar socketRef={socketRef} />
      <ChannelSidebar socketRef={socketRef} />

      {isViewingVoiceChannel && (
        <div className="flex-1 flex overflow-hidden bg-zinc-900 relative">
          <div className="flex-1 w-full h-full">
            <VoiceChannelView socketRef={socketRef} />
          </div>
        </div>
      )}

      {showSplitScreen && (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="shrink-0 h-[35vh] min-h-50 border-b border-zinc-800/80 flex bg-zinc-900 relative min-w-0">
            <div className="flex-1 w-full h-full overflow-hidden flex flex-col min-h-0">
              <VoiceChannelView 
                socketRef={socketRef} 
                isSplitScreen={true} 
                onMinimize={() => setIsVoiceMinimized(true)} 
              />
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden relative">
            <ChatArea socketRef={socketRef} />
            <MemberList />
          </div>
        </div>
      )}

      {!isViewingVoiceChannel && !showSplitScreen && (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {isConnectedToVoice && (
            <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-300 shadow-sm">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors" 
                onClick={() => setIsVoiceMinimized(false)}
              >
                <PhoneCall className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="font-medium">Voice connected ({participants.length + 1} members)</span>
              </div>
              <button
                onClick={() => setIsVoiceMinimized(false)}
                className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors"
              >
                Open window
              </button>
            </div>
          )}
          <div className="flex-1 flex overflow-hidden">
            <ChatArea socketRef={socketRef} />
            <MemberList />
          </div>
        </div>
      )}
    </div>
  );
}
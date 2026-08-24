import { useCallback, useState, useMemo } from "react";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useVoiceStore } from "../../store/voiceStore";
import { useVoiceChannel } from "../../hooks/useVoiceChannel";
import { useAuthStore } from "../../store/authStore";
import { VoiceParticipantTile } from "./VoiceParticipantTile";
import { VoiceControls } from "./VoiceControls";
import DeviceSettingsModal from "../modals/DeviceSettingsModal";
import { Loader2, Users, ChevronDown } from "lucide-react";

interface IVoiceChannelView {
  socketRef: RefObject<Socket | null>;
  isSplitScreen?: boolean;
  onMinimize?: () => void;
}

export default function VoiceChannelView({
  socketRef,
  isSplitScreen,
  onMinimize,
}: IVoiceChannelView) {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { getRoom, toggleCamera, toggleScreenShare } =
    useVoiceChannel(socketRef);
  const { user } = useAuthStore();

  const {
    participants,
    activeSpeakerId,
    isMuted,
    isDeafened,
    isCameraOn,
    isScreenSharing,
    isConnected,
    isConnecting,
    activeVoiceChannelId,
    activeVoiceGuildId,
    qualityMetrics, 
    setMuted,
    setDeafened,
    leaveVoiceChannel,
  } = useVoiceStore();

  const handleMuteToggle = useCallback(() => {
    const newMuted = !isMuted;
    setMuted(newMuted);
    socketRef.current?.emit("voice:mute", {
      channelId: activeVoiceChannelId,
      guildId: activeVoiceGuildId,
      muted: newMuted,
    });
  }, [isMuted, activeVoiceChannelId, activeVoiceGuildId, setMuted, socketRef]);

  const handleDeafenToggle = useCallback(() => {
    const newDeafened = !isDeafened;
    setDeafened(newDeafened);
    socketRef.current?.emit("voice:deafen", {
      channelId: activeVoiceChannelId,
      guildId: activeVoiceGuildId,
      deafened: newDeafened,
    });
  }, [
    isDeafened,
    activeVoiceChannelId,
    activeVoiceGuildId,
    setDeafened,
    socketRef,
  ]);

  const handleLeave = useCallback(() => {
    const room = getRoom();
    if (room) {
      room.disconnect();
    }

    const guildToNavigate = activeVoiceGuildId;

    leaveVoiceChannel();
    socketRef.current?.emit("voice:leave", {
      channelId: activeVoiceChannelId,
      guildId: activeVoiceGuildId,
    });

    if (!isSplitScreen && guildToNavigate) {
      navigate(`/app/guild/${guildToNavigate}`);
    }
  }, [
    activeVoiceChannelId,
    activeVoiceGuildId,
    leaveVoiceChannel,
    getRoom,
    socketRef,
    navigate,
    isSplitScreen,
  ]);

  const allParticipants = useMemo(() => {
    const selfParticipant = {
      userId: user?.id ?? "",
      username: user?.username ?? "You",
      muted: isMuted,
      deafened: isDeafened,
      speaking: activeSpeakerId === user?.id,
      audioLevel: 0,
      isCameraOn,
      isScreenSharing,
    };
    return [selfParticipant, ...participants];
  }, [
    user,
    isMuted,
    isDeafened,
    activeSpeakerId,
    isCameraOn,
    isScreenSharing,
    participants,
  ]);

  const room = getRoom();
  const cols =
    allParticipants.length <= 1 ? 1 : allParticipants.length <= 4 ? 2 : 3;
  const isLoading = !isConnected && isConnecting;

  return (
    <div className="flex flex-col bg-zinc-900 h-full min-h-0 relative">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-yellow-400" : "bg-green-400 animate-pulse"}`}
          />
          <span className="text-zinc-300 text-xs font-medium">
            {isLoading
              ? "Connecting..."
              : qualityMetrics
                ? `Voice Connected • ${qualityMetrics.rtt} ms`
                : "Voice Connected"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-zinc-500">
            <Users className="w-3 h-3" />
            <span className="text-xs">{allParticipants.length}</span>
          </div>
          {isSplitScreen && onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1 rounded bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition flex items-center justify-center"
              title="Hide voice window"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Joining voice...</p>
            </div>
          </div>
        ) : (
          <div
            className="h-full overflow-y-auto p-4"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: isSplitScreen ? "minmax(0, 1fr)" : "1fr",
              alignContent: "stretch",
              justifyItems: "center",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {allParticipants.map((participant) => (
              <VoiceParticipantTile
                key={participant.userId}
                participant={participant}
                isActive={activeSpeakerId === participant.userId}
                isSelf={participant.userId === user?.id}
                room={room}
                isSplitScreen={Boolean(isSplitScreen)}
              />
            ))}
          </div>
        )}
      </div>

      <VoiceControls
        onMuteToggle={handleMuteToggle}
        onDeafenToggle={handleDeafenToggle}
        onCameraToggle={toggleCamera}
        onScreenShareToggle={toggleScreenShare}
        onLeave={handleLeave}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />

      {isSettingsOpen && (
        <DeviceSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
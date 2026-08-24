import { useEffect, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import { useVoiceStore } from "../store/voiceStore";
import { useAuthStore } from "../store/authStore";
import { useGuildStore } from "../store/guildStore";
import { useSocketStore } from "../store/socketStore";
import { toast } from "sonner";

type VoiceParticipantData = {
  userId: string;
  muted: boolean;
  deafened: boolean;
};

type VoiceStateMap = Record<string, VoiceParticipantData[]>;

function getUsernameFromStore(userId: string): string {
  const members = useGuildStore.getState().members;
  const member = members.find(
    (m) => m.userId === userId || m.user?.id === userId
  );
  return member?.user?.username ?? userId;
}

export function useVoiceSocket(socketRef: RefObject<Socket | null>) {
  const {
    addParticipant, removeParticipant, updateParticipant,
    setLivekitCredentials, setParticipants, leaveVoiceChannel,
    setMuted, setDeafened,
  } = useVoiceStore();

  const isConnected = useSocketStore((s) => s.isConnected);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    const onVoiceError = (data: { message: string }) => {
      toast.error(`Voice: ${data.message}`);
      leaveVoiceChannel();
    };

    const onVoiceJoined = (data: {
      channelId: string;
      participants: VoiceParticipantData[];
      livekitToken: string;
      livekitUrl: string;
    }) => {
      if (!data.livekitToken || typeof data.livekitToken !== "string") {
        toast.error("Invalid voice token. Is LiveKit running?");
        leaveVoiceChannel();
        return;
      }

      const currentUserId = useAuthStore.getState().user?.id;

      const others = data.participants
        .filter((p) => p.userId !== currentUserId)
        .map((p) => ({
          userId: p.userId,
          username: getUsernameFromStore(p.userId), 
          muted: p.muted,
          deafened: p.deafened,
          speaking: false,
          audioLevel: 0,
          isCameraOn: false,
          isScreenSharing: false,
        }));

      setParticipants(others);
      setLivekitCredentials(data.livekitToken, data.livekitUrl);
    };

    const onUserJoined = (data: { userId: string; channelId: string }) => {
      const currentUserId = useAuthStore.getState().user?.id;
      if (data.userId === currentUserId) return;

      const existing = useVoiceStore.getState().participants
        .find((p) => p.userId === data.userId);
      if (existing) return;

      addParticipant({
        userId: data.userId,
        username: getUsernameFromStore(data.userId),
        muted: false,
        deafened: false,
        speaking: false,
        audioLevel: 0,
        isCameraOn: false,
        isScreenSharing: false,
      });
    };

    const onUserLeft = (data: { userId: string; channelId: string }) => {
      removeParticipant(data.userId);
    };

    const onUserMuted = (data: { userId: string; muted: boolean }) => {
      const currentUserId = useAuthStore.getState().user?.id;
      if (data.userId === currentUserId) setMuted(data.muted);
      else updateParticipant(data.userId, { muted: data.muted });
    };

    const onUserDeafened = (data: { userId: string; deafened: boolean }) => {
      const currentUserId = useAuthStore.getState().user?.id;
      if (data.userId === currentUserId) setDeafened(data.deafened);
      else updateParticipant(data.userId, { deafened: data.deafened });
    };

    const onUserSpeaking = (data: { userId: string; speaking: boolean }) => {
      updateParticipant(data.userId, { speaking: data.speaking });
    };

    const onVoiceChannelState = (data: {
      channelId: string;
      participants: VoiceParticipantData[];
    }) => {
      const { activeVoiceChannelId } = useVoiceStore.getState();
      const currentUserId = useAuthStore.getState().user?.id;
      if (data.channelId !== activeVoiceChannelId) return;

      const others = data.participants
        .filter((p) => p.userId !== currentUserId)
        .map((p) => ({
          userId: p.userId,
          username: getUsernameFromStore(p.userId),
          muted: p.muted,
          deafened: p.deafened,
          speaking: false,
          audioLevel: 0,
          isCameraOn: false,
          isScreenSharing: false,
        }));

      setParticipants(others);
    };

    const onVoiceGuildState = (state: VoiceStateMap) => {
      const { activeVoiceChannelId } = useVoiceStore.getState();
      const currentUserId = useAuthStore.getState().user?.id;
      if (!activeVoiceChannelId || !state[activeVoiceChannelId]) return;

      const others = state[activeVoiceChannelId]
        .filter((p) => p.userId !== currentUserId)
        .map((p) => ({
          userId: p.userId,
          username: getUsernameFromStore(p.userId),
          muted: p.muted,
          deafened: p.deafened,
          speaking: false,
          audioLevel: 0,
          isCameraOn: false,
          isScreenSharing: false,
        }));

      setParticipants(others);
    };

    socket.on("voice:error", onVoiceError);
    socket.on("voice:joined", onVoiceJoined);
    socket.on("voice:user-joined", onUserJoined);
    socket.on("voice:user-left", onUserLeft);
    socket.on("voice:user-muted", onUserMuted);
    socket.on("voice:user-deafened", onUserDeafened);
    socket.on("voice:user-speaking", onUserSpeaking);
    socket.on("voice:channel-state", onVoiceChannelState);
    socket.on("voice:guild-state", onVoiceGuildState);

    return () => {
      socket.off("voice:error", onVoiceError);
      socket.off("voice:joined", onVoiceJoined);
      socket.off("voice:user-joined", onUserJoined);
      socket.off("voice:user-left", onUserLeft);
      socket.off("voice:user-muted", onUserMuted);
      socket.off("voice:user-deafened", onUserDeafened);
      socket.off("voice:user-speaking", onUserSpeaking);
      socket.off("voice:channel-state", onVoiceChannelState);
      socket.off("voice:guild-state", onVoiceGuildState);
    };
  }, [isConnected]);
}
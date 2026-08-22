import { create } from "zustand";

export interface IVoiceParticipant {
  userId: string;
  username: string;
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
  audioLevel: number;
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

export interface IVoiceQualityMetrics {
  rtt: number;
  packetLoss: number;
  jitter: number;
  bitrate: number;
}

interface VoiceStore {
  livekitToken: string | null;
  livekitUrl: string | null;
  activeVoiceChannelId: string | null;
  activeVoiceGuildId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  participants: IVoiceParticipant[];
  activeSpeakerId: string | null;
  qualityMetrics: IVoiceQualityMetrics | null;

  //media Devices
  selectedMicrophoneId: string | null;
  selectedCameraId: string | null;
  selectedSpeakerId: string | null;

  //actions
  setLivekitCredentials: (token: string, url: string) => void;
  setActiveChannel: (channelId: string, guildId: string) => void;
  setConnected: (status: boolean) => void;
  setConnecting: (status: boolean) => void;
  setMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
  setCameraOn: (on: boolean) => void;
  setScreenSharing: (on: boolean) => void;
  addParticipant: (p: IVoiceParticipant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, data: Partial<IVoiceParticipant>) => void;
  setParticipants: (p: IVoiceParticipant[]) => void;
  setActiveSpeaker: (userId: string | null) => void;
  setQualityMetrics: (metrics: IVoiceQualityMetrics | null) => void;
  setSelectedMicrophone: (id: string) => void;
  setSelectedCamera: (id: string) => void;
  setSelectedSpeaker: (id: string) => void;
  leaveVoiceChannel: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  livekitToken: null,
  livekitUrl: null,
  activeVoiceChannelId: null,
  activeVoiceGuildId: null,
  isConnected: false,
  isConnecting: false,
  isMuted: false,
  isDeafened: false,
  isCameraOn: false,
  isScreenSharing: false,
  participants: [],
  activeSpeakerId: null,
  qualityMetrics: null,
  selectedMicrophoneId: null,
  selectedCameraId: null,
  selectedSpeakerId: null,

  setLivekitCredentials: (token, url) =>
    set({ livekitToken: token, livekitUrl: url }),
  setActiveChannel: (channelId, guildId) =>
    set({ activeVoiceChannelId: channelId, activeVoiceGuildId: guildId }),
  setConnected: (status) => set({ isConnected: status }),
  setConnecting: (status) => set({ isConnecting: status }),
  setMuted: (muted) => set({ isMuted: muted }),
  setDeafened: (deafened) => set({ isDeafened: deafened }),
  setCameraOn: (on) => set({ isCameraOn: on }),
  setScreenSharing: (on) => set({ isScreenSharing: on }),
  addParticipant: (p) =>
    set((state) => {
      const existing = state.participants.find((e) => e.userId === p.userId);
      if (existing) {
        if (existing.username === existing.userId && p.username !== p.userId) {
          return {
            participants: state.participants.map((e) =>
              e.userId === p.userId ? { ...e, username: p.username } : e,
            ),
          };
        }
        return state; 
      }
      return { participants: [...state.participants, p] };
    }),
  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.userId !== userId),
    })),
  updateParticipant: (userId, data) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.userId === userId ? { ...p, ...data } : p,
      ),
    })),
  setParticipants: (p) => set({ participants: p }),
  setActiveSpeaker: (userId) => set({ activeSpeakerId: userId }),
  setQualityMetrics: (metrics) => set({ qualityMetrics: metrics }),
  setSelectedMicrophone: (id) => set({ selectedMicrophoneId: id }),
  setSelectedCamera: (id) => set({ selectedCameraId: id }),
  setSelectedSpeaker: (id) => set({ selectedSpeakerId: id }),

  leaveVoiceChannel: () =>
    set({
      livekitToken: null,
      livekitUrl: null,
      activeVoiceChannelId: null,
      activeVoiceGuildId: null,
      isConnected: false,
      isConnecting: false,
      participants: [],
      activeSpeakerId: null,
      qualityMetrics: null,
      isCameraOn: false,
      isScreenSharing: false,
    }),
}));

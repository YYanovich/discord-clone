import { useEffect, useRef, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteAudioTrack,
} from "livekit-client";
import type { TrackPublication, Participant } from "livekit-client";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";
import { useVoiceStore } from "../store/voiceStore";
import { toast } from "sonner";

export function useVoiceChannel(socketRef: RefObject<Socket | null>) {
  const roomRef = useRef<Room | null>(null);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    livekitToken,
    livekitUrl,
    activeVoiceChannelId,
    activeVoiceGuildId,
    isMuted,
    isDeafened,
    selectedMicrophoneId,
    selectedCameraId,
    setConnected,
    setConnecting,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setActiveSpeaker,
    setQualityMetrics,
    setMuted,
  } = useVoiceStore();

  useEffect(() => {
    if (!livekitToken || !livekitUrl || !activeVoiceChannelId) {
      setConnecting(false);
      return;
    }

    let cancelled = false;

    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    const connect = async () => {
      setConnecting(true);

      const room = new Room({
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          deviceId: selectedMicrophoneId ?? undefined,
        },
        videoCaptureDefaults: {
          deviceId: selectedCameraId ?? undefined,
          resolution: { width: 1280, height: 720, frameRate: 30 },
        },
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        if (cancelled) return;

        addParticipant({
          userId: participant.identity,
          username: participant.name ?? participant.identity,
          muted: participant.isMicrophoneEnabled === false,
          deafened: false,
          speaking: false,
          audioLevel: 0,
          isCameraOn: participant.isCameraEnabled,
          isScreenSharing: false,
        });

        if (isDeafened) {
          participant.audioTrackPublications.forEach((pub: TrackPublication) => {
            if (pub.track instanceof RemoteAudioTrack) pub.track.setVolume(0);
          });
        }
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        if (cancelled) return;
        removeParticipant(participant.identity);
      });

      room.on(
        RoomEvent.TrackSubscribed,
        (track: Track, publication: TrackPublication, participant: RemoteParticipant) => {
          if (cancelled) return;

          if (track.kind === Track.Kind.Video) {
            const isScreenShare = publication.source === Track.Source.ScreenShare;
            updateParticipant(participant.identity, {
              isCameraOn: !isScreenShare,
              isScreenSharing: isScreenShare,
            });
          }

          if (track.kind === Track.Kind.Audio) {
            updateParticipant(participant.identity, { muted: false });
            if (isDeafened && track instanceof RemoteAudioTrack) {
              track.setVolume(0);
            }
          }
        },
      );

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track: Track, publication: TrackPublication, participant: RemoteParticipant) => {
          if (cancelled) return;

          if (track.kind === Track.Kind.Video) {
            const isScreenShare = publication.source === Track.Source.ScreenShare;
            if (isScreenShare) {
              updateParticipant(participant.identity, { isScreenSharing: false });
            } else {
              updateParticipant(participant.identity, { isCameraOn: false });
            }
          }

          if (track.kind === Track.Kind.Audio) {
            updateParticipant(participant.identity, { muted: true });
          }
        },
      );

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        if (cancelled) return;

        room.remoteParticipants.forEach((p: RemoteParticipant) => {
          updateParticipant(p.identity, { speaking: false });
        });
        updateParticipant(room.localParticipant.identity, { speaking: false });

        speakers.forEach((speaker: Participant) => {
          if (speaker.identity !== room.localParticipant.identity) {
            updateParticipant(speaker.identity, { speaking: true });
          }
        });

        const topSpeaker = speakers.find(
          (s: Participant) => s.identity !== room.localParticipant.identity,
        );
        setActiveSpeaker(topSpeaker?.identity ?? null);
      });

      room.on(RoomEvent.TrackMuted, (publication: TrackPublication, participant: Participant) => {
        if (cancelled) return;
        if (participant.identity === room.localParticipant.identity) return;
        if (publication.kind === Track.Kind.Audio)
          updateParticipant(participant.identity, { muted: true });
      });

      room.on(RoomEvent.TrackUnmuted, (publication: TrackPublication, participant: Participant) => {
        if (cancelled) return;
        if (participant.identity === room.localParticipant.identity) return;
        if (publication.kind === Track.Kind.Audio)
          updateParticipant(participant.identity, { muted: false });
      });

      room.on(RoomEvent.Connected, () => {
        if (cancelled) return;
        setConnected(true);
        setConnecting(false);

        startAudioLevelPolling(room);
        startMetricsCollection(room);

        room.remoteParticipants.forEach((participant: RemoteParticipant) => {
          addParticipant({
            userId: participant.identity,
            username: participant.name ?? participant.identity,
            muted: participant.isMicrophoneEnabled === false,
            deafened: false,
            speaking: false,
            audioLevel: 0,
            isCameraOn: participant.isCameraEnabled,
            isScreenSharing: false,
          });
        });
      });

      room.on(RoomEvent.Disconnected, () => {
        if (cancelled) return;
        setConnected(false);
        setConnecting(false);
        stopAudioLevelPolling();
        stopMetricsCollection();
      });

      try {
        const sanitizedUrl = livekitUrl ? livekitUrl.replace("localhost", "127.0.0.1") : "";

        const connectPromise = room.connect(sanitizedUrl, livekitToken);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("LiveKit connection timeout")), 10000)
        );

        await Promise.race([connectPromise, timeoutPromise]);
        if (cancelled) return;

        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          setMuted(false);
          socketRef.current?.emit("voice:mute", {
            channelId: activeVoiceChannelId,
            guildId: activeVoiceGuildId,
            muted: false,
          });
        } catch (micErr) {
          console.warn("Browser blocked auto-microphone:", micErr);
          setMuted(true);
        }

        setConnected(true);
        setConnecting(false);
      } catch (err) {
        if (cancelled) return;
        console.error("LiveKit connection error:", err);
        setConnecting(false);
        setConnected(false);
        toast.error("Could not connect to voice server");
      }
    };

    connect();

    return () => {
      cancelled = true;
      setConnecting(false);
      setConnected(false);
      stopAudioLevelPolling();
      stopMetricsCollection();

      roomRef.current?.remoteParticipants.forEach((p) => {
        removeParticipant(p.identity);
      });

      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [livekitToken, livekitUrl, activeVoiceChannelId]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;

    room.remoteParticipants.forEach((participant: RemoteParticipant) => {
      participant.audioTrackPublications.forEach((pub: TrackPublication) => {
        if (pub.track && pub.track instanceof RemoteAudioTrack) {
          pub.track.setVolume(isDeafened ? 0 : 1);
        }
      });
    });
  }, [isDeafened]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room?.localParticipant) return;
    room.localParticipant.setMicrophoneEnabled(!isMuted).catch(console.warn);
  }, [isMuted]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || !selectedMicrophoneId) return;
    room.switchActiveDevice("audioinput", selectedMicrophoneId).catch(console.error);
  }, [selectedMicrophoneId]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || !selectedCameraId) return;
    room.switchActiveDevice("videoinput", selectedCameraId).catch(console.error);
  }, [selectedCameraId]);

  const startAudioLevelPolling = useCallback(
    (room: Room) => {
      audioLevelIntervalRef.current = setInterval(() => {
        room.remoteParticipants.forEach((participant: RemoteParticipant) => {
          const level = Math.round((participant.audioLevel ?? 0) * 100);
          updateParticipant(participant.identity, {
            speaking: level > 8,
            audioLevel: level,
          });
        });

        const localLevel = Math.round((room.localParticipant.audioLevel ?? 0) * 100);
        updateParticipant(room.localParticipant.identity, {
          speaking: localLevel > 8,
          audioLevel: localLevel,
        });
      }, 100);
    },
    [updateParticipant],
  );

  const stopAudioLevelPolling = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
  }, []);

  const startMetricsCollection = useCallback(
    (room: Room) => {
      const fetchAndSetMetrics = async () => {
        const metrics = await collectRTCStats(room);
        if (metrics) {
          setQualityMetrics(metrics);
          socketRef.current?.emit("voice:metrics", {
            channelId: activeVoiceChannelId,
            guildId: activeVoiceGuildId,
            metrics,
          });
        }
      };

      fetchAndSetMetrics();
      metricsIntervalRef.current = setInterval(fetchAndSetMetrics, 5000);
    },
    [activeVoiceChannelId, activeVoiceGuildId, setQualityMetrics, socketRef],
  );

  const stopMetricsCollection = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const isCurrentlyOn = useVoiceStore.getState().isCameraOn;

    try {
      await room.localParticipant.setCameraEnabled(!isCurrentlyOn);
      useVoiceStore.getState().setCameraOn(!isCurrentlyOn);
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err?.name === "NotAllowedError") {
        alert("Camera permission denied. Please allow camera access in browser settings.");
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const isSharing = useVoiceStore.getState().isScreenSharing;

    try {
      if (isSharing) {
        await room.localParticipant.setScreenShareEnabled(false);
        useVoiceStore.getState().setScreenSharing(false);
      } else {
        await room.localParticipant.setScreenShareEnabled(true, {
          resolution: { width: 1920, height: 1080, frameRate: 15 },
          audio: true,
        });
        useVoiceStore.getState().setScreenSharing(true);
      }
    } catch (err: any) {
      if (err?.name !== "NotAllowedError") {
        console.error("Screen share error:", err);
      }
    }
  }, []);

  const getRoom = useCallback(() => roomRef.current, []);

  return { getRoom, toggleCamera, toggleScreenShare };
}

async function collectRTCStats(room: Room) {
  try {
    if (room.state !== "connected") return null;

    let rtt = 0;
    let packetLoss = 0;
    let jitter = 0;
    let bitrate = 0;

    const engine = (room as any).engine;
    const pc =
      engine?.publisher?.pc ||
      engine?.publisher?.connection?.pc ||
      engine?.publisher?.transport?.pc ||
      engine?.client?.publisher?.pc ||
      (room as any).pc;

    if (pc && typeof pc.getStats === "function") {
      const stats = await pc.getStats();
      stats.forEach((report: any) => {
        if (report.type === "candidate-pair" && (report.state === "succeeded" || report.selected)) {
          rtt = (report.currentRoundTripTime ?? report.roundTripTime ?? 0) * 1000;
        }
        if (report.type === "remote-inbound-rtp") {
          jitter = (report.jitter ?? 0) * 1000;
          const lost = report.packetsLost ?? 0;
          const received = (report.packetsReceived ?? 0) + lost;
          packetLoss = received > 0 ? (lost / received) * 100 : 0;
        }
        if (report.type === "outbound-rtp" && report.mediaType === "audio") {
          bitrate = report.bytesSent ?? 0;
        }
      });
    }

    return {
      rtt: Math.round(rtt), 
      packetLoss: Math.round(packetLoss * 10) / 10,
      jitter: Math.round(jitter),
      bitrate: Math.round(bitrate),
    };
  } catch {
    return { rtt: 0, packetLoss: 0, jitter: 0, bitrate: 0 };
  }
}
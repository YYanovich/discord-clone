import { useState, useEffect, useCallback } from "react";
import { useVoiceStore } from "../store/voiceStore";

export interface IMediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput" | "videoinput";
}

export function useMediaDevices() {
  const [devices, setDevices] = useState<{
    microphones: IMediaDeviceInfo[];
    cameras: IMediaDeviceInfo[];
    speakers: IMediaDeviceInfo[];
  }>({
    microphones: [],
    cameras: [],
    speakers: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const {
    setSelectedMicrophone,
    setSelectedCamera,
    setSelectedSpeaker,
    selectedMicrophoneId,
    selectedCameraId,
    selectedSpeakerId,
  } = useVoiceStore();

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const allDevices = await navigator.mediaDevices.enumerateDevices();

      setDevices({
        microphones: allDevices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microfone ${d.deviceId.slice(0, 4)}`,
            kind: "audioinput",
          })),
        cameras: allDevices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 4)}`,
            kind: "videoinput",
          })),
        speakers: allDevices
          .filter((d) => d.kind === "audiooutput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Dynamic ${d.deviceId.slice(0, 4)}`,
            kind: "audiooutput",
          })),
      });
    } catch (err) {
      console.error("Failed to load devices:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();

    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, []);

  return {
    devices,
    isLoading,
    selectedMicrophoneId,
    selectedCameraId,
    selectedSpeakerId,
    setSelectedMicrophone,
    setSelectedCamera,
    setSelectedSpeaker,
    reload: loadDevices,
  };
}
import { useCallback, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Settings,
  Wifi,
  WifiOff,
  Loader2
} from "lucide-react";
import { useVoiceStore } from "../../store/voiceStore";
import { ControlButton } from "./ControlButton";

export interface IVoiceControlsProps {
  onMuteToggle: () => void;
  onDeafenToggle: () => void;
  onCameraToggle: () => Promise<void>;
  onScreenShareToggle: () => Promise<void>;
  onLeave: () => void;
  onSettingsOpen?: () => void;
}

export function VoiceControls({
  onMuteToggle,
  onDeafenToggle,
  onCameraToggle,
  onScreenShareToggle,
  onLeave,
  onSettingsOpen,
}: IVoiceControlsProps) {
  const { 
    isMuted, 
    isDeafened, 
    isCameraOn, 
    isScreenSharing, 
    qualityMetrics, 
    isConnected, 
    isConnecting 
  } = useVoiceStore();

  const [cameraLoading, setCameraLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);

  const handleCameraToggle = useCallback(async () => {
    setCameraLoading(true);
    try {
      await onCameraToggle();
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        alert("Camera access denied, enable it in browser settings");
      }
    } finally {
      setCameraLoading(false);
    }
  }, [onCameraToggle]);

  const handleScreenToggle = useCallback(async () => {
    setScreenLoading(true);
    try {
      await onScreenShareToggle();
    } catch {
    } finally {
      setScreenLoading(false);
    }
  }, [onScreenShareToggle]);

  const connectionQuality = !qualityMetrics
    ? "good" 
    : qualityMetrics.packetLoss > 5 || qualityMetrics.rtt > 300
    ? "poor"
    : qualityMetrics.packetLoss > 1 || qualityMetrics.rtt > 150
    ? "fair"
    : "good";

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-t border-zinc-800/60 shrink-0">
      <div className="flex items-center gap-2 min-w-30 select-none">
        {isConnecting && !isConnected ? (
          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...
          </div>
        ) : !isConnected ? (
          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
            Disconnected
          </div>
        ) : (
          <div 
            className="flex items-center gap-1.5 cursor-default"
            title={
              qualityMetrics 
                ? `Ping: ${qualityMetrics.rtt}ms\nPacket Loss: ${qualityMetrics.packetLoss}%\nJitter: ${qualityMetrics.jitter}ms`
                : "Connected (measuring network...)"
            }
          >
            {connectionQuality === "poor" && (
              <div className="flex items-center gap-1.5 text-red-400 text-[12px] font-medium">
                <WifiOff className="w-4 h-4" />
                <span className="flex items-baseline gap-1">Poor <span className="text-[10px] text-zinc-500 font-normal">{qualityMetrics?.rtt ?? 0} ms</span></span>
              </div>
            )}
            {connectionQuality === "fair" && (
              <div className="flex items-center gap-1.5 text-yellow-400 text-[12px] font-medium">
                <Wifi className="w-4 h-4" />
                <span className="flex items-baseline gap-1">Fair <span className="text-[10px] text-zinc-500 font-normal">{qualityMetrics?.rtt ?? 0} ms</span></span>
              </div>
            )}
            {connectionQuality === "good" && (
              <div className="flex items-center gap-1.5 text-green-400 text-[12px] font-medium">
                <Wifi className="w-4 h-4" />
                <span className="flex items-baseline gap-1">
                  {qualityMetrics ? `Good` : `Connected`} 
                  {qualityMetrics && <span className="text-[10px] text-zinc-500 font-normal">{qualityMetrics.rtt} ms</span>}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ControlButton
          onClick={onMuteToggle}
          active={isMuted}
          activeColor="bg-red-600 hover:bg-red-500"
          inactiveColor="bg-zinc-700 hover:bg-zinc-600"
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
          icon={isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        />
        <ControlButton
          onClick={onDeafenToggle}
          active={isDeafened}
          activeColor="bg-red-600 hover:bg-red-500"
          inactiveColor="bg-zinc-700 hover:bg-zinc-600"
          title={isDeafened ? "Undeafen" : "Deafen"}
          icon={isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        />
        <ControlButton
          onClick={handleCameraToggle}
          active={isCameraOn}
          activeColor="bg-indigo-600 hover:bg-indigo-500"
          inactiveColor="bg-zinc-700 hover:bg-zinc-600"
          title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          disabled={cameraLoading}
          icon={
            cameraLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isCameraOn ? (
              <Video className="w-4 h-4" />
            ) : (
              <VideoOff className="w-4 h-4" />
            )
          }
        />
        <ControlButton
          onClick={handleScreenToggle}
          active={isScreenSharing}
          activeColor="bg-green-600 hover:bg-green-500"
          inactiveColor="bg-zinc-700 hover:bg-zinc-600"
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
          disabled={screenLoading}
          icon={
            screenLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isScreenSharing ? (
              <MonitorOff className="w-4 h-4" />
            ) : (
              <Monitor className="w-4 h-4" />
            )
          }
        />
        <ControlButton
          onClick={onLeave}
          active={false}
          activeColor=""
          inactiveColor="bg-red-700 hover:bg-red-600"
          title="Leave voice channel"
          icon={<PhoneOff className="w-4 h-4" />}
          className="ml-1"
        />
      </div>

      <div className="flex items-center gap-1 min-w-20 justify-end">
        {onSettingsOpen && (
          <button
            onClick={onSettingsOpen}
            title="Voice settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
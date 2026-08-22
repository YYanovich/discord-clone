import { useEffect, useState } from "react";
import { useVoiceStore } from "../../store/voiceStore";
import { X, ChevronDown } from "lucide-react";

interface IDeviceSettingsModalProps {
  onClose: () => void;
}

export default function DeviceSettingsModal({ onClose }: IDeviceSettingsModalProps) {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

  const {
    selectedMicrophoneId, setSelectedMicrophone,
    selectedCameraId, setSelectedCamera,
    selectedSpeakerId, setSelectedSpeaker
  } = useVoiceStore();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        stream.getTracks().forEach(t => t.stop());
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((devices) => {
        setMics(devices.filter(d => d.kind === "audioinput"));
        setCams(devices.filter(d => d.kind === "videoinput"));
        setSpeakers(devices.filter(d => d.kind === "audiooutput"));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2B2D31] border border-zinc-800/50 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-zinc-100 mb-6">Voice & Video Settings</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-2 tracking-wide">
              Microphone
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-[#1E1F22] border border-[#1E1F22] text-zinc-200 rounded-md p-2.5 pr-10 text-sm outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                value={selectedMicrophoneId || ""}
                onChange={(e) => setSelectedMicrophone(e.target.value)}
              >
                <option value="">Default System Microphone</option>
                {mics.map(m => (
                  <option key={m.deviceId} value={m.deviceId}>{m.label || `Mic ${m.deviceId}`}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-2 tracking-wide">
              Output Device (Speakers)
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-[#1E1F22] border border-[#1E1F22] text-zinc-200 rounded-md p-2.5 pr-10 text-sm outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                value={selectedSpeakerId || ""}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
              >
                <option value="">Default System Speakers</option>
                {speakers.map(s => (
                  <option key={s.deviceId} value={s.deviceId}>{s.label || `Speaker ${s.deviceId}`}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-2 tracking-wide">
              Camera
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-[#1E1F22] border border-[#1E1F22] text-zinc-200 rounded-md p-2.5 pr-10 text-sm outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                value={selectedCameraId || ""}
                onChange={(e) => setSelectedCamera(e.target.value)}
              >
                <option value="">Default Camera</option>
                {cams.map(c => (
                  <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId}`}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
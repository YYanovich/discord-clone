import { useMediaDevices } from "../../hooks/useMediaDevices";

export function DeviceSelector() {
  const {
    devices,
    isLoading,
    selectedMicrophoneId,
    selectedCameraId,
    selectedSpeakerId,
    setSelectedMicrophone,
    setSelectedCamera,
    setSelectedSpeaker,
  } = useMediaDevices();

  if (isLoading) {
    return <div className="text-zinc-500 text-sm">Loading devices...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Microphone
        </label>
        <select
          value={selectedMicrophoneId ?? ""}
          onChange={(e) => setSelectedMicrophone(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Default microphone</option>
          {devices.microphones.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Camera
        </label>
        <select
          value={selectedCameraId ?? ""}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Default camera</option>
          {devices.cameras.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Speaker
        </label>
        <select
          value={selectedSpeakerId ?? ""}
          onChange={(e) => setSelectedSpeaker(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Default speaker</option>
          {devices.speakers.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
import { useCallback, memo } from "react";
import type { Room, TrackPublication } from "livekit-client";
import { Track } from "livekit-client";
import { MicOff, Monitor, VolumeX } from "lucide-react";
import type { IVoiceParticipant } from "../../store/voiceStore";
import { useVoiceStore } from "../../store/voiceStore";

interface IVoiceParticipantTile {
  participant: IVoiceParticipant;
  isActive: boolean;
  isSelf: boolean;
  room: Room | null;
  isSplitScreen?: boolean;
}

export const VoiceParticipantTile = memo(function VoiceParticipantTile({
  participant,
  isActive,
  isSelf,
  room,
  isSplitScreen = false,
}: IVoiceParticipantTile) {
  const { selectedSpeakerId } = useVoiceStore();

  const videoRef = useCallback((element: HTMLVideoElement | null) => {
    if (!element || !room) return;
    const lkParticipant = isSelf
      ? room.localParticipant
      : room.remoteParticipants.get(participant.userId);
      
    if (!lkParticipant) return;
    
    lkParticipant.videoTrackPublications.forEach((pub: TrackPublication) => {
      if (pub.track) {
        pub.track.attach(element);
      }
    });
  }, [room, participant.userId, isSelf]);

  const audioRef = useCallback((element: HTMLAudioElement | null) => {
    if (!element || !room || isSelf) return;
    
    if (selectedSpeakerId && typeof (element as any).setSinkId === 'function') {
      (element as any).setSinkId(selectedSpeakerId).catch(console.error);
    }

    const lkParticipant = room.remoteParticipants.get(participant.userId);
    if (!lkParticipant) return;

    lkParticipant.audioTrackPublications.forEach((pub: TrackPublication) => {
      if (pub.track && pub.track.kind === Track.Kind.Audio) {
         pub.track.attach(element);
      }
    });
  }, [room, participant.userId, isSelf, selectedSpeakerId]);

  //animation when participant is speaking
  const speakingRingOpacity = Math.min(participant.audioLevel / 40, 1);
  const speakingRingColor = participant.speaking
    ? `rgba(34, 197, 94, ${0.4 + speakingRingOpacity * 0.6})`
    : "transparent";

  const layoutClasses = isSplitScreen
    ? "w-full h-full min-h-0" //split window
    : "w-full h-full"; //full window

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden bg-zinc-800
        flex items-center justify-center
        transition-all duration-150 select-none
        ${layoutClasses}
      `}
      style={{
        boxShadow: participant.speaking
          ? `0 0 0 2px ${speakingRingColor}, 0 0 12px rgba(34,197,94,0.3)`
          : isActive
            ? "0 0 0 2px rgba(99,102,241,0.8)"
            : "none",
      }}
    >
      {participant.isCameraOn || participant.isScreenSharing ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isSelf}
          playsInline
          className={`
            w-full h-full
            ${participant.isScreenSharing ? "object-contain" : "object-cover"}
          `}
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold transition-all duration-100"
            style={{
              boxShadow: participant.speaking
                ? `0 0 0 3px rgba(34,197,94,0.6), 0 0 16px rgba(34,197,94,0.4)`
                : "none",
            }}
          >
            {(participant.username[0] ?? "?").toUpperCase()}
          </div>
          <span className="text-zinc-300 text-sm font-medium max-w-40 truncate">
            {participant.username}
          </span>
        </div>
      )}

      {!isSelf && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          style={{ display: "none" }}
        />
      )}

      {(participant.isCameraOn || participant.isScreenSharing) && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-linear-to-t from-black/70 to-transparent">
          <span className="text-white text-xs font-medium truncate block">
            {participant.username}
          </span>
        </div>
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {participant.muted && (
          <div className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
        {participant.deafened && (
          <div className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm">
            <VolumeX className="w-3 h-3 text-white" />
          </div>
        )}
        {participant.isScreenSharing && (
          <div className="w-6 h-6 rounded-full bg-green-600/90 flex items-center justify-center backdrop-blur-sm">
            <Monitor className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {isSelf && (
        <div className="absolute top-3 left-3">
          <span className="text-xs text-zinc-300 bg-black/60 px-2 py-0.5 rounded font-medium">
            You
          </span>
        </div>
      )}
    </div>
  );
});
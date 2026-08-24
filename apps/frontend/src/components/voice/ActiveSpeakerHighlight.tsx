import { useCallback, useEffect, useRef } from "react";
import type { Room, TrackPublication } from "livekit-client";
import { Track } from "livekit-client";
import { MicOff, Monitor } from "lucide-react";
import type { IVoiceParticipant } from "../../store/voiceStore";

interface IActiveSpeakerHighlight {
  participant: IVoiceParticipant;
  room: Room | null;
}

export function ActiveSpeakerHighlight({ participant, room }: IActiveSpeakerHighlight) {
  const isSelf = room?.localParticipant.identity === participant.userId;
  const screenEl = useRef<HTMLVideoElement | null>(null);
  const cameraEl = useRef<HTMLVideoElement | null>(null);

  const screenRef = useCallback((node: HTMLVideoElement | null) => {
    const lkParticipant = isSelf ? room?.localParticipant : room?.remoteParticipants.get(participant.userId);
    const track = lkParticipant?.getTrackPublication(Track.Source.ScreenShare)?.track;
    if (screenEl.current && track) track.detach(screenEl.current);
    screenEl.current = node;
    if (node && track) track.attach(node);
  }, [room, participant.userId, isSelf]);

  const cameraRef = useCallback((node: HTMLVideoElement | null) => {
    const lkParticipant = isSelf ? room?.localParticipant : room?.remoteParticipants.get(participant.userId);
    const track = lkParticipant?.getTrackPublication(Track.Source.Camera)?.track;
    if (cameraEl.current && track) track.detach(cameraEl.current);
    cameraEl.current = node;
    if (node && track) track.attach(node);
  }, [room, participant.userId, isSelf]);

  useEffect(() => {
    const lkParticipant = isSelf ? room?.localParticipant : room?.remoteParticipants.get(participant.userId);
    if (!lkParticipant) return;

    const attachTrack = (track: Track) => {
      if (track.source === Track.Source.ScreenShare && screenEl.current) track.attach(screenEl.current);
      if (track.source === Track.Source.Camera && cameraEl.current) track.attach(cameraEl.current);
    };

    const detachTrack = (track: Track) => {
      if (track.source === Track.Source.ScreenShare && screenEl.current) track.detach(screenEl.current);
      if (track.source === Track.Source.Camera && cameraEl.current) track.detach(cameraEl.current);
    };

    const handleLocalPub = (pub: TrackPublication) => { if (pub.track) attachTrack(pub.track); };
    const handleLocalUnpub = (pub: TrackPublication) => { if (pub.track) detachTrack(pub.track); };

    lkParticipant.on("trackSubscribed", attachTrack);
    lkParticipant.on("trackUnsubscribed", detachTrack);
    
    if (isSelf) {
      lkParticipant.on("localTrackPublished", handleLocalPub);
      lkParticipant.on("localTrackUnpublished", handleLocalUnpub);
    }

    return () => {
      lkParticipant.off("trackSubscribed", attachTrack);
      lkParticipant.off("trackUnsubscribed", detachTrack);
      if (isSelf) {
        lkParticipant.off("localTrackPublished", handleLocalPub);
        lkParticipant.off("localTrackUnpublished", handleLocalUnpub);
      }
    };
  }, [room, participant.userId, isSelf]);

  const hasAnyVideo = participant.isCameraOn || participant.isScreenSharing;

  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden bg-zinc-800/80 relative flex items-center justify-center"
      style={{ boxShadow: "0 0 0 2px rgba(34, 197, 94, 0.7), 0 0 20px rgba(34, 197, 94, 0.2)" }}
    >
      {hasAnyVideo ? (
        <video
          ref={participant.isScreenSharing ? screenRef : cameraRef}
          autoPlay muted={isSelf} playsInline
          className={`w-full h-full ${participant.isScreenSharing ? "object-contain" : "object-cover"}`}
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: "1.5s" }} />
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold relative">
              {(participant.username[0] ?? "?").toUpperCase()}
            </div>
          </div>
          <div className="text-center">
            <p className="text-zinc-200 text-lg font-semibold">{participant.username}</p>
            <p className="text-green-400 text-sm font-medium animate-pulse">Speaking...</p>
          </div>
        </div>
      )}

      {participant.isScreenSharing && participant.isCameraOn && (
        <div className="absolute bottom-16 right-6 w-48 h-32 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-700/50 z-10">
          <video ref={cameraRef} autoPlay muted={isSelf} playsInline className="w-full h-full object-cover" />
        </div>
      )}

      {hasAnyVideo && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-linear-to-t from-black/80 to-transparent z-20">
          <div className="flex items-center gap-2">
            {participant.isScreenSharing && <Monitor className="w-3.5 h-3.5 text-green-400" />}
            <span className="text-white text-sm font-medium">{participant.username}</span>
            {participant.muted && <MicOff className="w-3.5 h-3.5 text-red-400 ml-auto" />}
          </div>
        </div>
      )}
    </div>
  );
}
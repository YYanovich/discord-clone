import { useRef, useEffect } from "react";
import type { Room, TrackPublication } from "livekit-client";
import { Track } from "livekit-client";
import { MicOff, Monitor } from "lucide-react";
import type { IVoiceParticipant } from "../../store/voiceStore";

interface IActiveSpeakerHighlight {
  participant: IVoiceParticipant;
  room: Room | null;
}

export function ActiveSpeakerHighlight({ participant, room }: IActiveSpeakerHighlight) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!room || !videoRef.current) return;

    const lkParticipant =
      room.localParticipant.identity === participant.userId
        ? room.localParticipant
        : room.remoteParticipants.get(participant.userId);

    if (!lkParticipant) return;

    const attachVideo = () => {
      lkParticipant.videoTrackPublications.forEach((pub: TrackPublication) => {
        if (pub.track && videoRef.current) {
          pub.track.attach(videoRef.current);
        }
      });
    };

    attachVideo();

    const onTrackSubscribed = (track: Track) => {
      if (track.kind === Track.Kind.Video && videoRef.current) {
        track.attach(videoRef.current);
      }
    };
    lkParticipant.on("trackSubscribed", onTrackSubscribed);

    return () => {
      lkParticipant.off("trackSubscribed", onTrackSubscribed);
      lkParticipant.videoTrackPublications.forEach((pub: TrackPublication) => {
        if (pub.track && videoRef.current) {
          pub.track.detach(videoRef.current);
        }
      });
    };
  }, [room, participant.userId, participant.isCameraOn, participant.isScreenSharing]);

  const hasVideo = participant.isCameraOn || participant.isScreenSharing;

  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden bg-zinc-800/80 relative flex items-center justify-center"
      style={{
        boxShadow: "0 0 0 2px rgba(34, 197, 94, 0.7), 0 0 20px rgba(34, 197, 94, 0.2)",
      }}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted={room?.localParticipant.identity === participant.userId}
          playsInline
          className={`w-full h-full ${
            participant.isScreenSharing ? "object-contain" : "object-cover"
          }`}
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
            <div
              className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold relative"
            >
              {(participant.username[0] ?? "?").toUpperCase()}
            </div>
          </div>
          <div className="text-center">
            <p className="text-zinc-200 text-lg font-semibold">
              {participant.username}
            </p>
            <p className="text-green-400 text-sm font-medium animate-pulse">
              Speaking...
            </p>
          </div>
        </div>
      )}

      {hasVideo && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-linear-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            {participant.isScreenSharing && (
              <Monitor className="w-3.5 h-3.5 text-green-400" />
            )}
            <span className="text-white text-sm font-medium">
              {participant.username}
            </span>
            {participant.muted && (
              <MicOff className="w-3.5 h-3.5 text-red-400 ml-auto" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
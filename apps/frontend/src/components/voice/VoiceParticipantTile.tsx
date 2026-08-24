import { memo, useEffect, useRef, useState, useCallback } from "react";
import type { Room, LocalVideoTrack, RemoteVideoTrack, LocalAudioTrack, RemoteAudioTrack } from "livekit-client";
import { Track, RoomEvent } from "livekit-client";
import { MicOff, Monitor } from "lucide-react";
import type { IVoiceParticipant } from "../../store/voiceStore";
import { useVoiceStore } from "../../store/voiceStore";

type VideoTrack = LocalVideoTrack | RemoteVideoTrack;
type AudioTrack = LocalAudioTrack | RemoteAudioTrack;

interface IVoiceParticipantTile {
  participant: IVoiceParticipant;
  isActive: boolean;
  isSelf: boolean;
  isSplitScreen?: boolean;
  room: Room | null;
}

//this weakmap serves as a global cache that automatically garbage collects video elements when their associated tracks are destroyed preventing memory leaks
const videoElementCache = new WeakMap<VideoTrack, HTMLVideoElement>();

//we use this helper to create a persistent video element or retrieve it from cache to prevent flickering during react re renders
function getOrCreateVideoElement(track: VideoTrack, isSelf: boolean): HTMLVideoElement {
  let el = videoElementCache.get(track);
  if (!el) {
    el = document.createElement("video");
    el.autoplay = true;
    el.playsInline = true;
    //we must mute the local video so the user does not hear their own echo
    if (isSelf) el.muted = true; 
    
    //we attach the hardware track to the html element exactly once to maintain a stable media stream
    track.attach(el);
    videoElementCache.set(track, el);
  }
  return el;
}

//this component acts as a trojan horse for react where we render an empty div and inject the raw dom node manually
const MediaVideo = memo(function MediaVideo({
  track,
  isSelf,
  className,
}: {
  track: VideoTrack | null;
  isSelf: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !track) return;

    //we retrieve the persistent video element for this specific track from our weakmap cache
    const videoEl = getOrCreateVideoElement(track, isSelf);
    
    //we apply dynamic tailwind classes for sizing and object fit properties
    videoEl.className = className || "";

    //this is where the dom reparenting magic happens by appending the element without react knowing about it
    container.appendChild(videoEl);

    return () => {
      //on unmount we safely remove the element from the container but we do not detach the track so it stays alive in memory for instant reuse
      if (container.contains(videoEl)) {
        container.removeChild(videoEl);
      }
    };
  }, [track, isSelf, className]);

  //react only manages this empty safe div while we control its contents via the useeffect hook above
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center overflow-hidden" 
    />
  );
});

//this component handles remote audio streams and supports dynamic audio routing via sink ids
const MediaAudio = memo(function MediaAudio({
  track,
  selectedSpeakerId,
}: {
  track: AudioTrack | null;
  selectedSpeakerId: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    
    //we attach the incoming audio track to our hidden html audio element
    track.attach(el);
    
    //if the user selected a specific output device we dynamically route the audio there
    if (selectedSpeakerId && "setSinkId" in el) {
      (el as any).setSinkId(selectedSpeakerId).catch(() => {});
    }
    
    return () => {
      //we cleanly detach the audio track when the component unmounts to free up resources
      try {
        track.detach(el);
      } catch {}
    };
  }, [track, selectedSpeakerId]);

  //we render a hidden audio tag because we only need it to play sound without any visual footprint
  return <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />;
});

//this is the main tile component that orchestrates video audio and ui states for a single participant in the grid
export const VoiceParticipantTile = memo(function VoiceParticipantTile({
  participant,
  isActive,
  isSelf,
  room,
}: IVoiceParticipantTile) {
  const { selectedSpeakerId } = useVoiceStore();

  //local state to hold references to the active media tracks for this specific user
  const [cameraTrack, setCameraTrack] = useState<VideoTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<VideoTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);

  //this callback scans the livekit participant instance and extracts their current audio and video tracks
  const updateTracks = useCallback(() => {
    if (!room) return;
    
    //we grab the correct participant object depending on whether it is the local user or a remote peer
    const lkParticipant = isSelf
      ? room.localParticipant
      : room.remoteParticipants.get(participant.userId);

    //if the participant left or disconnected we clear all active tracks
    if (!lkParticipant) {
      setCameraTrack(null);
      setScreenTrack(null);
      setAudioTrack(null);
      return;
    }

    //we extract the camera track if it is currently published
    const cameraPub = lkParticipant.getTrackPublication(Track.Source.Camera);
    setCameraTrack((cameraPub?.track as VideoTrack) ?? null);

    //we extract the screen share track if the user is currently presenting
    const screenPub = lkParticipant.getTrackPublication(Track.Source.ScreenShare);
    setScreenTrack((screenPub?.track as VideoTrack) ?? null);

    //we only extract audio tracks for remote peers because we do not want to play back our own microphone
    if (!isSelf) {
      const audioPub = lkParticipant.getTrackPublication(Track.Source.Microphone);
      setAudioTrack((audioPub?.track as AudioTrack) ?? null);
    }
  }, [room, participant.userId, isSelf]);

  useEffect(() => {
    //we perform an initial track sync when the component mounts
    updateTracks();

    if (!room) return;

    //we define a list of events to watch so we can keep our local react state in sync with network changes
    const events = [
      RoomEvent.TrackSubscribed,
      RoomEvent.TrackUnsubscribed,
      RoomEvent.TrackPublished,
      RoomEvent.TrackUnpublished,
      RoomEvent.TrackMuted,
      RoomEvent.TrackUnmuted,
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
    ];

    //we bind our update function to all relevant livekit room events
    events.forEach((evt) => room.on(evt, updateTracks));

    return () => {
      //we clean up all event listeners when the tile is unmounted to prevent memory leaks
      events.forEach((evt) => room.off(evt, updateTracks));
    };
  }, [room, updateTracks]);

  //derived state to make conditional rendering inside the return block cleaner
  const isScreenSharingActive = !!screenTrack;
  const isCameraOnActive = !!cameraTrack;

  //we calculate dynamic ui variables for the speaking indicator ring based on live audio levels
  const speakingRingOpacity = Math.min(participant.audioLevel / 40, 1);
  const speakingRingColor = participant.speaking
    ? `rgba(34, 197, 94, ${0.4 + speakingRingOpacity * 0.6})`
    : "transparent";

  //we render the main wrapper with dynamic shadows and flex properties based on speaking state and grid constraints
  return (
    <div
    className={`
      relative rounded-xl overflow-hidden bg-zinc-800
      flex items-center justify-center w-full h-full min-h-0 max-h-full
      transition-all duration-300 select-none
    `}
    style={{
      boxShadow: participant.speaking
        ? `0 0 0 2px ${speakingRingColor}, 0 0 12px rgba(34,197,94,0.3)`
        : isActive
        ? "0 0 0 2px rgba(99,102,241,0.8)"
        : "none",
      backgroundColor: "#27272a",
    }}
  >
      {/*we conditionally render the screen share the camera or the fallback avatar based on stream availability*/}
      {isScreenSharingActive ? (
        <MediaVideo
          track={screenTrack}
          isSelf={isSelf}
          className="w-full h-full object-contain"
        />
      ) : isCameraOnActive ? (
        <MediaVideo
          track={cameraTrack}
          isSelf={isSelf}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold"
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

      {/*if both screen share and camera are active we render the camera as a small picture in picture overlay*/}
      {isScreenSharingActive && isCameraOnActive && (
        <div className="absolute bottom-12 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden shadow-lg border border-zinc-700 z-10">
          <MediaVideo
            track={cameraTrack}
            isSelf={isSelf}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/*we mount the hidden audio element for remote peers to play their microphone streams*/}
      {!isSelf && (
        <MediaAudio track={audioTrack} selectedSpeakerId={selectedSpeakerId} />
      )}

      {/*we display the participant name gradient overlay at the bottom if any video stream is active*/}
      {(isCameraOnActive || isScreenSharingActive) && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-linear-to-t from-black/70 to-transparent z-20">
          <span className="text-white text-xs font-medium truncate block">
            {participant.username}
          </span>
        </div>
      )}

      {/*we display status badges in the top right corner for muted microphones and active screen shares*/}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
        {participant.muted && (
          <div className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
        {isScreenSharingActive && (
          <div className="w-6 h-6 rounded-full bg-green-600/90 flex items-center justify-center backdrop-blur-sm">
            <Monitor className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/*we show a small badge indicating which tile belongs to the local user*/}
      {isSelf && (
        <div className="absolute top-3 left-3 z-20">
          <span className="text-xs text-zinc-300 bg-black/60 px-2 py-0.5 rounded font-medium">
            You
          </span>
        </div>
      )}
    </div>
  );
});
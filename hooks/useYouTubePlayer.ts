"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isYouTubeEmbedError,
  loadYouTubeIframeAPI,
  type YouTubeCaptionTrack,
  type YouTubePlayer,
  type YouTubeVideoData,
} from "@/lib/youtubeApi";

interface UseYouTubePlayerOptions {
  containerId: string;
  onReady?: () => void;
  onError?: (code: number) => void;
  onStateChange?: (state: number) => void;
  onPlaylistIndexChange?: () => void;
  onVideoEnded?: () => void;
}

function pickCaptionTrack(
  tracks: YouTubeCaptionTrack[]
): YouTubeCaptionTrack | undefined {
  if (tracks.length === 0) return undefined;
  return (
    tracks.find((track) => track.languageCode === "en") ??
    tracks.find((track) => track.languageCode?.startsWith("en")) ??
    tracks[0]
  );
}

export function useYouTubePlayer({
  containerId,
  onReady,
  onError,
  onStateChange,
  onPlaylistIndexChange,
  onVideoEnded,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const lastPlaylistIndexRef = useRef(-1);
  const captionsReadyRef = useRef(false);
  const pendingCaptionsEnabledRef = useRef<boolean | null>(null);
  const volumeRampRef = useRef<number | null>(null);
  const callbacksRef = useRef({
    onReady,
    onError,
    onStateChange,
    onPlaylistIndexChange,
    onVideoEnded,
  });

  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onError,
      onStateChange,
      onPlaylistIndexChange,
      onVideoEnded,
    };
  }, [onReady, onError, onStateChange, onPlaylistIndexChange, onVideoEnded]);

  const applyCaptionsEnabled = useCallback((enabled: boolean) => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (enabled) {
        const tracks = player.getOption(
          "captions",
          "tracklist"
        ) as YouTubeCaptionTrack[] | undefined;
        const track = pickCaptionTrack(tracks ?? []);
        if (!track) return;
        player.setOption("captions", "track", track);
      } else {
        player.setOption("captions", "track", {});
      }
    } catch {
      // Captions module may be unavailable for this video
    }
  }, []);

  const setCaptionsEnabled = useCallback(
    (enabled: boolean) => {
      pendingCaptionsEnabledRef.current = enabled;
      if (captionsReadyRef.current) {
        applyCaptionsEnabled(enabled);
      }
    },
    [applyCaptionsEnabled]
  );

  const cancelVolumeRamp = useCallback(() => {
    if (volumeRampRef.current !== null) {
      cancelAnimationFrame(volumeRampRef.current);
      volumeRampRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initPlayer = async () => {
      await loadYouTubeIframeAPI();
      if (!mounted || !window.YT) return;

      const container = document.getElementById(containerId);
      if (!container) return;

      playerRef.current = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        host: "https://www.youtube.com",
        playerVars: {
          autoplay: 1,
          mute: 1,
          cc_load_policy: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          origin:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: () => {
            if (!mounted) return;
            setPlayerReady(true);
            callbacksRef.current.onReady?.();
          },
          onApiChange: () => {
            const player = playerRef.current;
            if (!player) return;

            try {
              const options = player.getOptions("captions");
              if (!options.includes("track")) return;

              captionsReadyRef.current = true;
              if (pendingCaptionsEnabledRef.current !== null) {
                applyCaptionsEnabled(pendingCaptionsEnabledRef.current);
              }
            } catch {
              // Captions module not available yet
            }
          },
          onStateChange: (event) => {
            callbacksRef.current.onStateChange?.(event.data);

            const playerState = window.YT!.PlayerState;

            if (event.data === playerState.ENDED) {
              callbacksRef.current.onVideoEnded?.();
            }

            if (event.data === playerState.PLAYING) {
              try {
                const index = event.target.getPlaylistIndex();
                if (index >= 0 && index !== lastPlaylistIndexRef.current) {
                  lastPlaylistIndexRef.current = index;
                  callbacksRef.current.onPlaylistIndexChange?.();
                }
              } catch {
                // Playlist index unavailable for non-playlist playback
              }

              if (pendingCaptionsEnabledRef.current) {
                window.setTimeout(() => {
                  applyCaptionsEnabled(true);
                }, 200);
              }
            }
          },
          onError: (event) => {
            if (isYouTubeEmbedError(event.data)) {
              callbacksRef.current.onError?.(event.data);
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      mounted = false;
      cancelVolumeRamp();
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
      lastPlaylistIndexRef.current = -1;
      captionsReadyRef.current = false;
      pendingCaptionsEnabledRef.current = null;
    };
  }, [applyCaptionsEnabled, cancelVolumeRamp, containerId]);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.stopVideo();
  }, []);

  const setVolume = useCallback(
    (volume: number) => {
      cancelVolumeRamp();
      playerRef.current?.setVolume(volume);
      if (volume === 0) {
        playerRef.current?.mute();
      } else {
        playerRef.current?.unMute();
      }
    },
    [cancelVolumeRamp]
  );

  const rampVolume = useCallback(
    (targetVolume: number, durationMs: number) => {
      const player = playerRef.current;
      if (!player || durationMs <= 0) return;

      cancelVolumeRamp();
      player.setVolume(0);
      player.mute();

      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        const nextVolume = Math.round(targetVolume * t);

        player.setVolume(nextVolume);
        if (nextVolume > 0) {
          player.unMute();
        } else {
          player.mute();
        }

        if (t < 1) {
          volumeRampRef.current = requestAnimationFrame(tick);
        } else {
          volumeRampRef.current = null;
        }
      };

      volumeRampRef.current = requestAnimationFrame(tick);
    },
    [cancelVolumeRamp]
  );

  const loadVideo = useCallback((videoId: string, startSeconds = 0) => {
    const player = playerRef.current;
    if (!player || !videoId) return;
    lastPlaylistIndexRef.current = -1;
    player.mute();
    player.setVolume(0);
    player.loadVideoById({ videoId, startSeconds });
    player.playVideo();
  }, []);

  const loadPlaylist = useCallback((playlistId: string, index = 0) => {
    const player = playerRef.current;
    if (!player || !playlistId) return;
    lastPlaylistIndexRef.current = index;
    player.mute();
    player.setVolume(0);
    player.loadPlaylist(playlistId, index, 0);
    player.playVideo();
  }, []);

  const nextVideo = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.nextVideo();
  }, []);

  const previousVideo = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.previousVideo();
  }, []);

  const getPlaylistIndex = useCallback((): number => {
    if (!playerRef.current) return 0;
    try {
      const index = playerRef.current.getPlaylistIndex();
      return index >= 0 ? index : 0;
    } catch {
      return 0;
    }
  }, []);

  const getPlaylist = useCallback((): string[] => {
    if (!playerRef.current) return [];
    try {
      return playerRef.current.getPlaylist() ?? [];
    } catch {
      return [];
    }
  }, []);

  const getVideoData = useCallback((): YouTubeVideoData | null => {
    if (!playerRef.current) return null;
    try {
      return playerRef.current.getVideoData();
    } catch {
      return null;
    }
  }, []);

  const getPlayerState = useCallback((): number => {
    if (!playerRef.current) return -1;
    try {
      return playerRef.current.getPlayerState();
    } catch {
      return -1;
    }
  }, []);

  const seekTo = useCallback((seconds: number, allowSeekAhead = true) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(seconds, allowSeekAhead);
  }, []);

  const syncPlaylistIndex = useCallback(() => {
    if (!playerRef.current) return;
    try {
      lastPlaylistIndexRef.current = playerRef.current.getPlaylistIndex();
    } catch {
      lastPlaylistIndexRef.current = -1;
    }
  }, []);

  return {
    playerReady,
    play,
    pause,
    stop,
    setVolume,
    rampVolume,
    cancelVolumeRamp,
    loadVideo,
    loadPlaylist,
    nextVideo,
    previousVideo,
    getPlaylistIndex,
    getPlaylist,
    getVideoData,
    getPlayerState,
    seekTo,
    syncPlaylistIndex,
    setCaptionsEnabled,
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isYouTubeEmbedError,
  loadYouTubeIframeAPI,
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
          autoplay: 0,
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
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
      lastPlaylistIndexRef.current = -1;
    };
  }, [containerId]);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.stopVideo();
  }, []);

  const setVolume = useCallback((volume: number) => {
    playerRef.current?.setVolume(volume);
    if (volume === 0) {
      playerRef.current?.mute();
    } else {
      playerRef.current?.unMute();
    }
  }, []);

  const loadVideo = useCallback((videoId: string, startSeconds = 0) => {
    if (!playerRef.current || !videoId) return;
    lastPlaylistIndexRef.current = -1;
    playerRef.current.loadVideoById({ videoId, startSeconds });
  }, []);

  const loadPlaylist = useCallback((playlistId: string, index = 0) => {
    if (!playerRef.current || !playlistId) return;
    lastPlaylistIndexRef.current = index;
    playerRef.current.loadPlaylist(playlistId, index, 0);
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
  };
}

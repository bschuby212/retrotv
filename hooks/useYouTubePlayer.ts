"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isYouTubeEmbedError,
  loadYouTubeIframeAPI,
  type YouTubePlayer,
} from "@/lib/youtubeApi";

interface UseYouTubePlayerOptions {
  containerId: string;
  onReady?: () => void;
  onError?: (code: number) => void;
  onStateChange?: (state: number) => void;
}

export function useYouTubePlayer({
  containerId,
  onReady,
  onError,
  onStateChange,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const callbacksRef = useRef({ onReady, onError, onStateChange });

  useEffect(() => {
    callbacksRef.current = { onReady, onError, onStateChange };
  }, [onReady, onError, onStateChange]);

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
        },
        events: {
          onReady: () => {
            if (!mounted) return;
            setPlayerReady(true);
            callbacksRef.current.onReady?.();
          },
          onStateChange: (event) => {
            callbacksRef.current.onStateChange?.(event.data);
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

  const loadVideo = useCallback((videoId: string) => {
    if (!playerRef.current || !videoId) return;
    playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
  }, []);

  const cueVideo = useCallback((videoId: string) => {
    if (!playerRef.current || !videoId) return;
    playerRef.current.cueVideoById({ videoId, startSeconds: 0 });
  }, []);

  return {
    playerReady,
    play,
    pause,
    stop,
    setVolume,
    loadVideo,
    cueVideo,
  };
}

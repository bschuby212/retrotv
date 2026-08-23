"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { channels, isChannelPlayable } from "@/config/channels";
import { tvSettings } from "@/config/tvSettings";
import { truncateTitle } from "@/lib/youtubeApi";
import type {
  Channel,
  EpisodeOSDPayload,
  OSDState,
  PowerPhase,
  TVControlsActions,
  TVControlsInternal,
  TVControlsState,
} from "@/lib/tvTypes";

interface UseTVControlsOptions {
  playerReady: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlayerVolume: (volume: number) => void;
  rampVolume: (targetVolume: number, durationMs: number) => void;
  cancelVolumeRamp: () => void;
  loadVideo: (videoId: string, startSeconds?: number) => void;
  loadPlaylist: (playlistId: string, index?: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getPlaylistIndex: () => number;
  getPlaylist: () => string[];
  getVideoData: () => { title: string; video_id?: string } | null;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  syncPlaylistIndex: () => void;
  playbackShieldRef: RefObject<HTMLDivElement | null>;
}

function wrapIndex(index: number, length: number): number {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

function clampVolume(value: number): number {
  return Math.min(
    tvSettings.volumeMax,
    Math.max(tvSettings.volumeMin, value)
  );
}

function isTvInteractive(powerPhase: PowerPhase): boolean {
  return powerPhase === "on" || powerPhase === "booting";
}

export function useTVControls({
  playerReady,
  play,
  pause,
  stop,
  setPlayerVolume,
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
  getCurrentTime,
  seekTo,
  syncPlaylistIndex,
  playbackShieldRef,
}: UseTVControlsOptions): TVControlsState &
  TVControlsActions &
  TVControlsInternal {
  const [isPowered, setIsPowered] = useState(false);
  const [powerPhase, setPowerPhase] = useState<PowerPhase>("off");
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [volume, setVolume] = useState<number>(tvSettings.defaultVolume);
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  const [isPlaybackShielded, setPlaybackShielded] = useState(true);
  const [osd, setOsd] = useState<OSDState>({ type: null });
  const [hasSignal, setHasSignal] = useState(true);

  const channelOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const episodeOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transportOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const powerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rampTriggeredRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isStoppedRef = useRef(false);
  const hasSignalRef = useRef(true);
  const shieldRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const sourceGenerationRef = useRef(0);
  const expectedVideoIdRef = useRef<string | null>(null);
  const channelLockRef = useRef(false);
  const episodePositionRef = useRef<Record<number, number>>({});
  const errorSkipAttemptsRef = useRef(0);
  const isPoweredRef = useRef(isPowered);
  const powerPhaseRef = useRef(powerPhase);
  const currentChannelIndexRef = useRef(currentChannelIndex);
  const volumeRef = useRef(volume);

  const currentChannel: Channel = channels[currentChannelIndex] ?? channels[0];

  useEffect(() => {
    isPoweredRef.current = isPowered;
    powerPhaseRef.current = powerPhase;
    currentChannelIndexRef.current = currentChannelIndex;
    volumeRef.current = volume;
    hasSignalRef.current = hasSignal;
  }, [isPowered, powerPhase, currentChannelIndex, volume, hasSignal]);

  const clearChannelOsdTimer = useCallback(() => {
    if (channelOsdTimerRef.current) {
      clearTimeout(channelOsdTimerRef.current);
      channelOsdTimerRef.current = null;
    }
  }, []);

  const clearEpisodeOsdTimer = useCallback(() => {
    if (episodeOsdTimerRef.current) {
      clearTimeout(episodeOsdTimerRef.current);
      episodeOsdTimerRef.current = null;
    }
  }, []);

  const clearVolumeOsdTimer = useCallback(() => {
    if (volumeOsdTimerRef.current) {
      clearTimeout(volumeOsdTimerRef.current);
      volumeOsdTimerRef.current = null;
    }
  }, []);

  const clearTransportOsdTimer = useCallback(() => {
    if (transportOsdTimerRef.current) {
      clearTimeout(transportOsdTimerRef.current);
      transportOsdTimerRef.current = null;
    }
  }, []);

  const coverPlayback = useCallback(() => {
    if (shieldRevealTimerRef.current) {
      clearTimeout(shieldRevealTimerRef.current);
      shieldRevealTimerRef.current = null;
    }
    sourceGenerationRef.current += 1;
    const shield = playbackShieldRef.current;
    if (shield) {
      shield.dataset.active = "true";
    }
    setPlaybackShielded(true);
  }, [playbackShieldRef]);

  const canRevealPlayback = useCallback(() => {
    if (
      !isPoweredRef.current ||
      powerPhaseRef.current !== "on" ||
      isLoadingRef.current ||
      isStoppedRef.current ||
      !hasSignalRef.current
    ) {
      return false;
    }
    if (getPlayerState() !== 1) return false;

    const expectedId = expectedVideoIdRef.current;
    if (expectedId) {
      const data = getVideoData();
      if (data?.video_id && data.video_id !== expectedId) return false;
    }

    return true;
  }, [getPlayerState, getVideoData]);

  const scheduleReveal = useCallback(() => {
    if (shieldRevealTimerRef.current) {
      clearTimeout(shieldRevealTimerRef.current);
    }

    const generation = sourceGenerationRef.current;
    const startedAt = getCurrentTime();

    const attemptReveal = (pass: number) => {
      shieldRevealTimerRef.current = setTimeout(() => {
        shieldRevealTimerRef.current = null;
        if (generation !== sourceGenerationRef.current) return;
        if (!canRevealPlayback()) return;

        const now = getCurrentTime();
        if (now <= startedAt && pass < 2) {
          attemptReveal(pass + 1);
          return;
        }
        if (now <= startedAt && getPlayerState() !== 1) return;

        const shield = playbackShieldRef.current;
        if (shield) {
          shield.dataset.active = "false";
        }
        setPlaybackShielded(false);
      }, tvSettings.shieldRevealDelayMs);
    };

    attemptReveal(0);
  }, [canRevealPlayback, getCurrentTime, getPlayerState, playbackShieldRef]);

  const endLoading = useCallback(() => {
    rampTriggeredRef.current = false;
    cancelVolumeRamp();
    isLoadingRef.current = false;
  }, [cancelVolumeRamp]);

  const finishLoading = useCallback(() => {
    if (!rampTriggeredRef.current) {
      rampTriggeredRef.current = true;
      rampVolume(volumeRef.current, tvSettings.loadVolumeFadeMs);
    }
    isLoadingRef.current = false;
    if (!isStoppedRef.current && getPlayerState() === 1) {
      scheduleReveal();
    }
  }, [getPlayerState, rampVolume, scheduleReveal]);

  const beginLoading = useCallback(() => {
    coverPlayback();
    isStoppedRef.current = false;
    rampTriggeredRef.current = false;
    isLoadingRef.current = true;

    if (isPoweredRef.current && powerPhaseRef.current === "on") {
      cancelVolumeRamp();
      setPlayerVolume(0);
    }
  }, [cancelVolumeRamp, coverPlayback, setPlayerVolume]);

  const getSavedEpisodeIndex = useCallback((channel: Channel): number => {
    return episodePositionRef.current[channel.channel] ?? 0;
  }, []);

  const saveEpisodeIndex = useCallback((channel: Channel, index: number) => {
    episodePositionRef.current[channel.channel] = Math.max(0, index);
  }, []);

  const buildEpisodePayload = useCallback(
    (channel: Channel, playlistIndex: number): EpisodeOSDPayload => {
      const videoData = getVideoData();
      const payload: EpisodeOSDPayload = {
        channelNumber: channel.channel,
        channelName: channel.name,
        episodeNumber: playlistIndex + 1,
      };

      if (videoData?.title) {
        payload.episodeTitle = truncateTitle(
          videoData.title,
          tvSettings.maxEpisodeTitleLength
        );
      }

      return payload;
    },
    [getVideoData]
  );

  const showChannelOsd = useCallback(
    (channel: Channel) => {
      clearChannelOsdTimer();
      clearEpisodeOsdTimer();
      setOsd({
        type: "channel",
        payload: {
          channelNumber: channel.channel,
          channelName: channel.name,
        },
      });
      channelOsdTimerRef.current = setTimeout(() => {
        setOsd((prev) => (prev.type === "channel" ? { type: null } : prev));
      }, tvSettings.channelOsdHideMs);
    },
    [clearChannelOsdTimer, clearEpisodeOsdTimer]
  );

  const showEpisodeOsd = useCallback(
    (channel: Channel, playlistIndex: number) => {
      clearEpisodeOsdTimer();
      clearChannelOsdTimer();
      clearVolumeOsdTimer();
      clearTransportOsdTimer();

      const payload = buildEpisodePayload(channel, playlistIndex);
      setOsd({ type: "episode", payload });

      episodeOsdTimerRef.current = setTimeout(() => {
        setOsd((prev) => (prev.type === "episode" ? { type: null } : prev));
      }, tvSettings.episodeOsdHideMs);
    },
    [
      buildEpisodePayload,
      clearChannelOsdTimer,
      clearEpisodeOsdTimer,
      clearTransportOsdTimer,
      clearVolumeOsdTimer,
    ]
  );

  const showTransportOsd = useCallback(
    (type: "play" | "pause" | "stop") => {
      clearTransportOsdTimer();
      clearVolumeOsdTimer();
      setOsd({ type });
      transportOsdTimerRef.current = setTimeout(() => {
        setOsd((prev) => (prev.type === type ? { type: null } : prev));
      }, tvSettings.channelOsdHideMs);
    },
    [clearTransportOsdTimer, clearVolumeOsdTimer]
  );

  const showVolumeOsd = useCallback(
    (nextVolume: number) => {
      clearVolumeOsdTimer();
      clearChannelOsdTimer();
      clearEpisodeOsdTimer();
      clearTransportOsdTimer();
      setOsd({
        type: nextVolume === 0 ? "mute" : "volume",
        payload: { volume: nextVolume },
      });
      volumeOsdTimerRef.current = setTimeout(() => {
        setOsd((prev) =>
          prev.type === "volume" || prev.type === "mute" ? { type: null } : prev
        );
      }, tvSettings.volumeOsdHideMs);
    },
    [
      clearVolumeOsdTimer,
      clearChannelOsdTimer,
      clearEpisodeOsdTimer,
      clearTransportOsdTimer,
    ]
  );

  const showNoSignal = useCallback(() => {
    clearChannelOsdTimer();
    clearEpisodeOsdTimer();
    coverPlayback();
    hasSignalRef.current = false;
    endLoading();
    setHasSignal(false);
    setOsd({ type: null });
  }, [clearChannelOsdTimer, clearEpisodeOsdTimer, coverPlayback, endLoading]);

  const loadChannelSource = useCallback(
    (channel: Channel) => {
      if (!isChannelPlayable(channel)) {
        coverPlayback();
        stop();
        showNoSignal();
        return;
      }

      errorSkipAttemptsRef.current = 0;
      hasSignalRef.current = true;
      expectedVideoIdRef.current =
        channel.type === "playlist" ? null : channel.videoId ?? null;
      setHasSignal(true);
      beginLoading();

      if (channel.type === "playlist" && channel.playlistId) {
        const savedIndex = getSavedEpisodeIndex(channel);
        loadPlaylist(channel.playlistId, savedIndex);
        syncPlaylistIndex();
      } else if (channel.videoId) {
        loadVideo(channel.videoId, 0);
      }
    },
    [
      beginLoading,
      coverPlayback,
      getSavedEpisodeIndex,
      loadPlaylist,
      loadVideo,
      showNoSignal,
      stop,
      syncPlaylistIndex,
    ]
  );

  const loadCurrentChannel = useCallback(
    (index: number, showOsd = true) => {
      const channel = channels[index];
      if (!channel) return;

      if (!channel.sourceUrl || channel.type === "unconfigured") {
        coverPlayback();
        isStoppedRef.current = true;
        hasSignalRef.current = true;
        setHasSignal(true);
        stop();
        if (showOsd) showChannelOsd(channel);
        return;
      }

      if (!isChannelPlayable(channel)) {
        stop();
        showNoSignal();
        if (showOsd) showChannelOsd(channel);
        return;
      }

      if (playerReady) {
        loadChannelSource(channel);
      }

      if (showOsd) showChannelOsd(channel);
    },
    [coverPlayback, loadChannelSource, playerReady, showChannelOsd, showNoSignal, stop]
  );

  const performChannelChange = useCallback(
    (direction: 1 | -1) => {
      if (
        !isPoweredRef.current ||
        powerPhaseRef.current !== "on" ||
        channelLockRef.current
      ) {
        return;
      }

      channelLockRef.current = true;
      setIsChangingChannel(true);
      beginLoading();

      const nextIndex = wrapIndex(
        currentChannelIndexRef.current + direction,
        channels.length
      );

      setTimeout(() => {
        setCurrentChannelIndex(nextIndex);
        loadCurrentChannel(nextIndex);
        setIsChangingChannel(false);
        channelLockRef.current = false;
      }, tvSettings.channelTransitionMs);
    },
    [beginLoading, loadCurrentChannel]
  );

  const channelUp = useCallback(() => {
    performChannelChange(1);
  }, [performChannelChange]);

  const channelDown = useCallback(() => {
    performChannelChange(-1);
  }, [performChannelChange]);

  const applyVolume = useCallback(
    (nextVolume: number) => {
      const clamped = clampVolume(nextVolume);
      setVolume(clamped);
      if (playerReady && isPoweredRef.current) {
        setPlayerVolume(clamped);
      }
      showVolumeOsd(clamped);
    },
    [playerReady, setPlayerVolume, showVolumeOsd]
  );

  const volumeUp = useCallback(() => {
    if (!isPoweredRef.current) return;
    if (
      powerPhaseRef.current === "off" ||
      powerPhaseRef.current === "shuttingDown"
    ) {
      return;
    }
    applyVolume(volumeRef.current + tvSettings.volumeStep);
  }, [applyVolume]);

  const volumeDown = useCallback(() => {
    if (!isPoweredRef.current) return;
    if (
      powerPhaseRef.current === "off" ||
      powerPhaseRef.current === "shuttingDown"
    ) {
      return;
    }
    applyVolume(volumeRef.current - tvSettings.volumeStep);
  }, [applyVolume]);

  const togglePlayPause = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (!isChannelPlayable(channel)) return;

    const state = getPlayerState();
    const playing = state === 1;

    if (playing) {
      coverPlayback();
      pause();
      showTransportOsd("pause");
    } else {
      isStoppedRef.current = false;
      play();
      showTransportOsd("play");
    }
  }, [coverPlayback, getPlayerState, pause, play, showTransportOsd]);

  const stopPlayback = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (!isChannelPlayable(channel)) return;

    coverPlayback();
    isStoppedRef.current = true;
    seekTo(0);
    pause();
    showTransportOsd("stop");
  }, [coverPlayback, pause, seekTo, showTransportOsd]);

  const episodePrevious = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (channel.type !== "playlist" || !channel.playlistId || !playerReady) return;

    beginLoading();
    previousVideo();

    window.setTimeout(() => {
      const index = getPlaylistIndex();
      saveEpisodeIndex(channel, index);
      showEpisodeOsd(channel, index);
    }, 150);
  }, [
    beginLoading,
    getPlaylistIndex,
    playerReady,
    previousVideo,
    saveEpisodeIndex,
    showEpisodeOsd,
  ]);

  const episodeNext = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (channel.type !== "playlist" || !channel.playlistId || !playerReady) return;

    beginLoading();
    nextVideo();

    window.setTimeout(() => {
      const index = getPlaylistIndex();
      saveEpisodeIndex(channel, index);
      showEpisodeOsd(channel, index);
    }, 150);
  }, [
    beginLoading,
    getPlaylistIndex,
    nextVideo,
    playerReady,
    saveEpisodeIndex,
    showEpisodeOsd,
  ]);

  const handlePlaylistIndexChange = useCallback(() => {
    const channel = channels[currentChannelIndexRef.current];
    if (channel.type !== "playlist" || !channel.playlistId) return;

    const index = getPlaylistIndex();
    saveEpisodeIndex(channel, index);

    if (!channelLockRef.current && powerPhaseRef.current === "on") {
      showEpisodeOsd(channel, index);
    }
  }, [getPlaylistIndex, saveEpisodeIndex, showEpisodeOsd]);

  const handleVideoEnded = useCallback(() => {
    const channel = channels[currentChannelIndexRef.current];
    if (!channel || !isPoweredRef.current) return;

    coverPlayback();

    if (channel.loop && channel.videoId) {
      seekTo(0);
      play();
      return;
    }

    if (channel.type === "playlist" && tvSettings.autoPlayNextEpisode) {
      return;
    }

    if (channel.type === "playlist" && !tvSettings.autoPlayNextEpisode) {
      isStoppedRef.current = true;
      pause();
    }
  }, [coverPlayback, pause, play, seekTo]);

  const handlePlayerError = useCallback(
    (code?: number) => {
      const channel = channels[currentChannelIndexRef.current];

      if (
        channel.type === "playlist" &&
        channel.videoId &&
        errorSkipAttemptsRef.current === 0
      ) {
        errorSkipAttemptsRef.current += 1;
        hasSignalRef.current = true;
        setHasSignal(true);
        beginLoading();
        loadVideo(channel.videoId, 0);
        return;
      }

      if (channel.type === "playlist" && channel.playlistId) {
        const playlist = getPlaylist();
        const currentIndex = getPlaylistIndex();
        errorSkipAttemptsRef.current += 1;

        if (
          playlist.length > 0 &&
          currentIndex < playlist.length - 1 &&
          errorSkipAttemptsRef.current < playlist.length
        ) {
          beginLoading();
          nextVideo();
          window.setTimeout(() => {
            const index = getPlaylistIndex();
            saveEpisodeIndex(channel, index);
            setHasSignal(true);
            showEpisodeOsd(channel, index);
          }, 200);
          return;
        }
      }

      if (code === 153) {
        console.warn("[RetroTV] YouTube embed error 153 — check Referrer-Policy");
      }

      showNoSignal();
    },
    [
      beginLoading,
      getPlaylist,
      getPlaylistIndex,
      loadVideo,
      nextVideo,
      saveEpisodeIndex,
      showEpisodeOsd,
      showNoSignal,
    ]
  );

  const handlePlayerStateChange = useCallback(
    (state: number) => {
      if (state === 0 || state === 2) {
        coverPlayback();
      }

      if (isLoadingRef.current) {
        if (
          !isStoppedRef.current &&
          (state === -1 || state === 2 || state === 5)
        ) {
          play();
        }

        if (state === 1) {
          finishLoading();
        }
        return;
      }

      if (state === 1 && !isStoppedRef.current) {
        scheduleReveal();
      }
    },
    [coverPlayback, finishLoading, play, scheduleReveal]
  );

  const togglePower = useCallback(() => {
    if (
      powerPhaseRef.current === "booting" ||
      powerPhaseRef.current === "shuttingDown"
    ) {
      return;
    }

    if (powerTimerRef.current) {
      clearTimeout(powerTimerRef.current);
      powerTimerRef.current = null;
    }

    if (isPoweredRef.current) {
      coverPlayback();
      setPowerPhase("shuttingDown");
      endLoading();
      pause();
      stop();

      powerTimerRef.current = setTimeout(() => {
        setIsPowered(false);
        setPowerPhase("off");
        setOsd({ type: null });
      }, tvSettings.powerOffDurationMs);
    } else {
      coverPlayback();
      isStoppedRef.current = false;
      setIsPowered(true);
      setPowerPhase("booting");

      powerTimerRef.current = setTimeout(() => {
        setPowerPhase("on");
        if (playerReady) {
          setPlayerVolume(volumeRef.current);
          loadCurrentChannel(currentChannelIndexRef.current, true);
        } else {
          showChannelOsd(channels[currentChannelIndexRef.current]);
        }
      }, tvSettings.powerOnDurationMs);
    }
  }, [
    coverPlayback,
    endLoading,
    loadCurrentChannel,
    pause,
    playerReady,
    setPlayerVolume,
    showChannelOsd,
    stop,
  ]);

  useEffect(() => {
    if (playerReady && isPowered && powerPhase === "on") {
      setPlayerVolume(volume);
      const channel = channels[currentChannelIndex];
      if (isChannelPlayable(channel)) {
        loadChannelSource(channel);
      }
    }
  }, [playerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      clearChannelOsdTimer();
      clearEpisodeOsdTimer();
      clearVolumeOsdTimer();
      clearTransportOsdTimer();
      if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
      if (shieldRevealTimerRef.current) {
        clearTimeout(shieldRevealTimerRef.current);
      }
      cancelVolumeRamp();
    };
  }, [
    clearChannelOsdTimer,
    clearEpisodeOsdTimer,
    clearVolumeOsdTimer,
    clearTransportOsdTimer,
    cancelVolumeRamp,
  ]);

  return {
    isPowered,
    powerPhase,
    currentChannelIndex,
    volume,
    isChangingChannel,
    isPlaybackShielded,
    osd,
    playerReady,
    hasSignal,
    currentChannel,
    togglePower,
    channelUp,
    channelDown,
    volumeUp,
    volumeDown,
    togglePlayPause,
    stopPlayback,
    episodePrevious,
    episodeNext,
    handlePlayerError,
    handlePlaylistIndexChange,
    handleVideoEnded,
    handlePlayerStateChange,
  };
}

export type UseTVControlsReturn = ReturnType<typeof useTVControls>;

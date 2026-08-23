"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { channels } from "@/config/channels";
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
  loadPlaylist: (playlistId: string, index?: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getPlaylistIndex: () => number;
  getPlaylist: () => string[];
  getVideoData: () => { title: string } | null;
  syncPlaylistIndex: () => void;
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
  loadPlaylist,
  nextVideo,
  previousVideo,
  getPlaylistIndex,
  getPlaylist,
  getVideoData,
  syncPlaylistIndex,
}: UseTVControlsOptions): TVControlsState &
  TVControlsActions &
  TVControlsInternal {
  const [isPowered, setIsPowered] = useState(false);
  const [powerPhase, setPowerPhase] = useState<PowerPhase>("off");
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [volume, setVolume] = useState<number>(tvSettings.defaultVolume);
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  const [osd, setOsd] = useState<OSDState>({ type: null });
  const [hasSignal, setHasSignal] = useState(true);

  const channelOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const episodeOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const powerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  }, [isPowered, powerPhase, currentChannelIndex, volume]);

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
      clearVolumeOsdTimer,
    ]
  );

  const showVolumeOsd = useCallback(
    (nextVolume: number) => {
      clearVolumeOsdTimer();
      clearChannelOsdTimer();
      clearEpisodeOsdTimer();
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
    [clearVolumeOsdTimer, clearChannelOsdTimer, clearEpisodeOsdTimer]
  );

  const showNoSignal = useCallback(() => {
    clearChannelOsdTimer();
    clearEpisodeOsdTimer();
    setHasSignal(false);
    setOsd({ type: null });
  }, [clearChannelOsdTimer, clearEpisodeOsdTimer]);

  const loadCurrentChannel = useCallback(
    (index: number, showOsd = true) => {
      const channel = channels[index];
      if (!channel) return;

      errorSkipAttemptsRef.current = 0;

      if (!channel.playlistId) {
        setHasSignal(true);
        stop();
        if (showOsd) showChannelOsd(channel);
        return;
      }

      const savedIndex = getSavedEpisodeIndex(channel);

      if (playerReady) {
        loadPlaylist(channel.playlistId, savedIndex);
        setHasSignal(true);
        syncPlaylistIndex();
        if (isPoweredRef.current && powerPhaseRef.current === "on") {
          play();
        }
      }

      if (showOsd) showChannelOsd(channel);
    },
    [
      getSavedEpisodeIndex,
      loadPlaylist,
      play,
      playerReady,
      showChannelOsd,
      stop,
      syncPlaylistIndex,
    ]
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
    [loadCurrentChannel]
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

  const episodePrevious = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (!channel?.playlistId || !playerReady) return;

    previousVideo();
    play();

    window.setTimeout(() => {
      const index = getPlaylistIndex();
      saveEpisodeIndex(channel, index);
      showEpisodeOsd(channel, index);
    }, 150);
  }, [
    getPlaylistIndex,
    play,
    playerReady,
    previousVideo,
    saveEpisodeIndex,
    showEpisodeOsd,
  ]);

  const episodeNext = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (!channel?.playlistId || !playerReady) return;

    nextVideo();
    play();

    window.setTimeout(() => {
      const index = getPlaylistIndex();
      saveEpisodeIndex(channel, index);
      showEpisodeOsd(channel, index);
    }, 150);
  }, [
    getPlaylistIndex,
    nextVideo,
    play,
    playerReady,
    saveEpisodeIndex,
    showEpisodeOsd,
  ]);

  const handlePlaylistIndexChange = useCallback(() => {
    const channel = channels[currentChannelIndexRef.current];
    if (!channel?.playlistId) return;

    const index = getPlaylistIndex();
    saveEpisodeIndex(channel, index);

    if (!channelLockRef.current && powerPhaseRef.current === "on") {
      showEpisodeOsd(channel, index);
    }
  }, [getPlaylistIndex, saveEpisodeIndex, showEpisodeOsd]);

  const handlePlayerError = useCallback(() => {
    const channel = channels[currentChannelIndexRef.current];
    if (!channel?.playlistId) {
      showNoSignal();
      return;
    }

    const playlist = getPlaylist();
    const currentIndex = getPlaylistIndex();
    errorSkipAttemptsRef.current += 1;

    if (
      playlist.length > 0 &&
      currentIndex < playlist.length - 1 &&
      errorSkipAttemptsRef.current < playlist.length
    ) {
      nextVideo();
      play();
      window.setTimeout(() => {
        const index = getPlaylistIndex();
        saveEpisodeIndex(channel, index);
        setHasSignal(true);
        showEpisodeOsd(channel, index);
      }, 200);
      return;
    }

    showNoSignal();
  }, [
    getPlaylist,
    getPlaylistIndex,
    nextVideo,
    play,
    saveEpisodeIndex,
    showEpisodeOsd,
    showNoSignal,
  ]);

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
      setPowerPhase("shuttingDown");
      pause();
      stop();

      powerTimerRef.current = setTimeout(() => {
        setIsPowered(false);
        setPowerPhase("off");
        setOsd({ type: null });
      }, tvSettings.powerOffDurationMs);
    } else {
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
      if (channel?.playlistId) {
        loadPlaylist(channel.playlistId, getSavedEpisodeIndex(channel));
        play();
      }
    }
  }, [playerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      clearChannelOsdTimer();
      clearEpisodeOsdTimer();
      clearVolumeOsdTimer();
      if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
    };
  }, [
    clearChannelOsdTimer,
    clearEpisodeOsdTimer,
    clearVolumeOsdTimer,
  ]);

  return {
    isPowered,
    powerPhase,
    currentChannelIndex,
    volume,
    isChangingChannel,
    osd,
    playerReady,
    hasSignal,
    currentChannel,
    togglePower,
    channelUp,
    channelDown,
    volumeUp,
    volumeDown,
    episodePrevious,
    episodeNext,
    handlePlayerError,
    handlePlaylistIndexChange,
  };
}

export type UseTVControlsReturn = ReturnType<typeof useTVControls>;

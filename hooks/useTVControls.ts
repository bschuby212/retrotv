"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  loadVideo: (videoId: string, startSeconds?: number) => void;
  loadPlaylist: (playlistId: string, index?: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getPlaylistIndex: () => number;
  getPlaylist: () => string[];
  getVideoData: () => { title: string } | null;
  getPlayerState: () => number;
  seekTo: (seconds: number) => void;
  syncPlaylistIndex: () => void;
  setCaptionsEnabled: (enabled: boolean) => void;
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
}: UseTVControlsOptions): TVControlsState &
  TVControlsActions &
  TVControlsInternal {
  const [isPowered, setIsPowered] = useState(false);
  const [powerPhase, setPowerPhase] = useState<PowerPhase>("off");
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [volume, setVolume] = useState<number>(tvSettings.defaultVolume);
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  const [isTuningIn, setIsTuningIn] = useState(false);
  const [captionsEnabled, setCaptionsEnabledState] = useState(false);
  const [osd, setOsd] = useState<OSDState>({ type: null });
  const [hasSignal, setHasSignal] = useState(true);

  const channelOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const episodeOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transportOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const powerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tuneInStartedAtRef = useRef(0);
  const tuneInEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tuneInMaxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelLockRef = useRef(false);
  const episodePositionRef = useRef<Record<number, number>>({});
  const errorSkipAttemptsRef = useRef(0);
  const isPoweredRef = useRef(isPowered);
  const powerPhaseRef = useRef(powerPhase);
  const currentChannelIndexRef = useRef(currentChannelIndex);
  const volumeRef = useRef(volume);
  const captionsEnabledRef = useRef(captionsEnabled);

  const currentChannel: Channel = channels[currentChannelIndex] ?? channels[0];

  useEffect(() => {
    isPoweredRef.current = isPowered;
    powerPhaseRef.current = powerPhase;
    currentChannelIndexRef.current = currentChannelIndex;
    volumeRef.current = volume;
    captionsEnabledRef.current = captionsEnabled;
  }, [isPowered, powerPhase, currentChannelIndex, volume, captionsEnabled]);

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

  const beginTuneIn = useCallback(() => {
    if (tuneInEndTimerRef.current) {
      clearTimeout(tuneInEndTimerRef.current);
      tuneInEndTimerRef.current = null;
    }
    if (tuneInMaxTimerRef.current) {
      clearTimeout(tuneInMaxTimerRef.current);
    }

    tuneInStartedAtRef.current = Date.now();
    setIsTuningIn(true);

    tuneInMaxTimerRef.current = setTimeout(() => {
      setIsTuningIn(false);
      tuneInMaxTimerRef.current = null;
    }, tvSettings.tuneInMaxMs);
  }, []);

  const tryEndTuneIn = useCallback(() => {
    if (tuneInEndTimerRef.current) {
      clearTimeout(tuneInEndTimerRef.current);
    }

    const elapsed = Date.now() - tuneInStartedAtRef.current;
    const waitMs = Math.max(
      tvSettings.tuneInSettleMs,
      tvSettings.tuneInMinMs - elapsed
    );

    tuneInEndTimerRef.current = setTimeout(() => {
      setIsTuningIn(false);
      if (tuneInMaxTimerRef.current) {
        clearTimeout(tuneInMaxTimerRef.current);
        tuneInMaxTimerRef.current = null;
      }
      tuneInEndTimerRef.current = null;
    }, waitMs);
  }, []);

  const reapplyCaptionsIfEnabled = useCallback(() => {
    if (!captionsEnabledRef.current) return;
    window.setTimeout(() => {
      setCaptionsEnabled(true);
    }, 400);
  }, [setCaptionsEnabled]);

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
    (type: "play" | "pause" | "stop" | "ccOn" | "ccOff") => {
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
    setHasSignal(false);
    setOsd({ type: null });
  }, [clearChannelOsdTimer, clearEpisodeOsdTimer]);

  const loadChannelSource = useCallback(
    (channel: Channel) => {
      if (!isChannelPlayable(channel)) {
        stop();
        showNoSignal();
        return;
      }

      errorSkipAttemptsRef.current = 0;
      setHasSignal(true);
      beginTuneIn();

      if (channel.type === "playlist" && channel.playlistId) {
        const savedIndex = getSavedEpisodeIndex(channel);
        loadPlaylist(channel.playlistId, savedIndex);
        syncPlaylistIndex();
      } else if (channel.videoId) {
        loadVideo(channel.videoId, 0);
      }

      if (isPoweredRef.current && powerPhaseRef.current === "on") {
        play();
      }

      reapplyCaptionsIfEnabled();
    },
    [
      beginTuneIn,
      getSavedEpisodeIndex,
      loadPlaylist,
      loadVideo,
      play,
      reapplyCaptionsIfEnabled,
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
    [loadChannelSource, playerReady, showChannelOsd, showNoSignal, stop]
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
      beginTuneIn();

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
    [beginTuneIn, loadCurrentChannel]
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
      pause();
      showTransportOsd("pause");
    } else {
      play();
      showTransportOsd("play");
    }
  }, [getPlayerState, pause, play, showTransportOsd]);

  const stopPlayback = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (!isChannelPlayable(channel)) return;

    seekTo(0);
    pause();
    showTransportOsd("stop");
  }, [pause, seekTo, showTransportOsd]);

  const episodePrevious = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (channel.type !== "playlist" || !channel.playlistId || !playerReady) return;

    beginTuneIn();
    previousVideo();
    play();

    window.setTimeout(() => {
      const index = getPlaylistIndex();
      saveEpisodeIndex(channel, index);
      showEpisodeOsd(channel, index);
      reapplyCaptionsIfEnabled();
    }, 150);
  }, [
    beginTuneIn,
    getPlaylistIndex,
    play,
    playerReady,
    previousVideo,
    reapplyCaptionsIfEnabled,
    saveEpisodeIndex,
    showEpisodeOsd,
  ]);

  const episodeNext = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (channel.type !== "playlist" || !channel.playlistId || !playerReady) return;

    beginTuneIn();
    nextVideo();
    play();

    window.setTimeout(() => {
      const index = getPlaylistIndex();
      saveEpisodeIndex(channel, index);
      showEpisodeOsd(channel, index);
      reapplyCaptionsIfEnabled();
    }, 150);
  }, [
    beginTuneIn,
    getPlaylistIndex,
    nextVideo,
    play,
    playerReady,
    reapplyCaptionsIfEnabled,
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

    reapplyCaptionsIfEnabled();
  }, [getPlaylistIndex, reapplyCaptionsIfEnabled, saveEpisodeIndex, showEpisodeOsd]);

  const handleVideoEnded = useCallback(() => {
    const channel = channels[currentChannelIndexRef.current];
    if (!channel || !isPoweredRef.current) return;

    if (channel.loop && channel.videoId) {
      beginTuneIn();
      seekTo(0);
      play();
      return;
    }

    if (channel.type === "playlist" && tvSettings.autoPlayNextEpisode) {
      beginTuneIn();
      return;
    }

    if (channel.type === "playlist" && !tvSettings.autoPlayNextEpisode) {
      pause();
    }
  }, [beginTuneIn, pause, play, seekTo]);

  const handlePlayerError = useCallback(() => {
    const channel = channels[currentChannelIndexRef.current];

    if (channel.type === "playlist" && channel.playlistId) {
      const playlist = getPlaylist();
      const currentIndex = getPlaylistIndex();
      errorSkipAttemptsRef.current += 1;

      if (
        playlist.length > 0 &&
        currentIndex < playlist.length - 1 &&
        errorSkipAttemptsRef.current < playlist.length
      ) {
        beginTuneIn();
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
    }

    showNoSignal();
  }, [
    beginTuneIn,
    getPlaylist,
    getPlaylistIndex,
    nextVideo,
    play,
    saveEpisodeIndex,
    showEpisodeOsd,
    showNoSignal,
  ]);

  const toggleCaptions = useCallback(() => {
    if (!isPoweredRef.current || !isTvInteractive(powerPhaseRef.current)) return;

    const channel = channels[currentChannelIndexRef.current];
    if (!isChannelPlayable(channel)) return;

    const nextEnabled = !captionsEnabledRef.current;
    setCaptionsEnabledState(nextEnabled);
    setCaptionsEnabled(nextEnabled);
    showTransportOsd(nextEnabled ? "ccOn" : "ccOff");
  }, [setCaptionsEnabled, showTransportOsd]);

  const handlePlayerStateChange = useCallback(
    (state: number) => {
      if (state === 1) {
        tryEndTuneIn();
      }
    },
    [tryEndTuneIn]
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
      setPowerPhase("shuttingDown");
      setIsTuningIn(false);
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
      if (tuneInEndTimerRef.current) clearTimeout(tuneInEndTimerRef.current);
      if (tuneInMaxTimerRef.current) clearTimeout(tuneInMaxTimerRef.current);
    };
  }, [
    clearChannelOsdTimer,
    clearEpisodeOsdTimer,
    clearVolumeOsdTimer,
    clearTransportOsdTimer,
  ]);

  return {
    isPowered,
    powerPhase,
    currentChannelIndex,
    volume,
    isChangingChannel,
    isTuningIn,
    captionsEnabled,
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
    toggleCaptions,
    handlePlayerError,
    handlePlaylistIndexChange,
    handleVideoEnded,
    handlePlayerStateChange,
  };
}

export type UseTVControlsReturn = ReturnType<typeof useTVControls>;

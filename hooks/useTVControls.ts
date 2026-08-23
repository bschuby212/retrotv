"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { channels } from "@/config/channels";
import { tvSettings } from "@/config/tvSettings";
import type {
  Channel,
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
  loadVideo: (videoId: string) => void;
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

export function useTVControls({
  playerReady,
  play,
  pause,
  stop,
  setPlayerVolume,
  loadVideo,
}: UseTVControlsOptions): TVControlsState & TVControlsActions & TVControlsInternal {
  const [isPowered, setIsPowered] = useState(false);
  const [powerPhase, setPowerPhase] = useState<PowerPhase>("off");
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [volume, setVolume] = useState<number>(tvSettings.defaultVolume);
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  const [osd, setOsd] = useState<OSDState>({ type: null });
  const [hasSignal, setHasSignal] = useState(true);

  const channelOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeOsdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const powerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelLockRef = useRef(false);
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

  const clearVolumeOsdTimer = useCallback(() => {
    if (volumeOsdTimerRef.current) {
      clearTimeout(volumeOsdTimerRef.current);
      volumeOsdTimerRef.current = null;
    }
  }, []);

  const showChannelOsd = useCallback(
    (channel: Channel) => {
      clearChannelOsdTimer();
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
    [clearChannelOsdTimer]
  );

  const showVolumeOsd = useCallback(
    (nextVolume: number) => {
      clearVolumeOsdTimer();
      clearChannelOsdTimer();
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
    [clearVolumeOsdTimer, clearChannelOsdTimer]
  );

  const showNoSignal = useCallback(() => {
    clearChannelOsdTimer();
    setHasSignal(false);
    setOsd({ type: null });
  }, [clearChannelOsdTimer]);

  const loadCurrentChannel = useCallback(
    (index: number, showOsd = true) => {
      const channel = channels[index];
      if (!channel) return;

      if (!channel.youtubeId) {
        setHasSignal(true);
        stop();
        if (showOsd) showChannelOsd(channel);
        return;
      }

      if (playerReady) {
        loadVideo(channel.youtubeId);
        setHasSignal(true);
        if (isPoweredRef.current && powerPhaseRef.current === "on") {
          play();
        }
      }

      if (showOsd) showChannelOsd(channel);
    },
    [loadVideo, play, showChannelOsd, stop, playerReady]
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

  const togglePower = useCallback(() => {
    if (powerPhaseRef.current === "booting" || powerPhaseRef.current === "shuttingDown") {
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
  }, [loadCurrentChannel, pause, play, playerReady, setPlayerVolume, showChannelOsd, stop]);

  const handlePlayerError = useCallback(() => {
    showNoSignal();
  }, [showNoSignal]);

  useEffect(() => {
    if (playerReady && isPowered && powerPhase === "on") {
      setPlayerVolume(volume);
      const channel = channels[currentChannelIndex];
      if (channel?.youtubeId) {
        loadVideo(channel.youtubeId);
        play();
      }
    }
  }, [playerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      clearChannelOsdTimer();
      clearVolumeOsdTimer();
      if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
    };
  }, [clearChannelOsdTimer, clearVolumeOsdTimer]);

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
    handlePlayerError,
  };
}

export type UseTVControlsReturn = ReturnType<typeof useTVControls>;

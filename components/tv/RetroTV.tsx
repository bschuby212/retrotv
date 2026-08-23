"use client";

import { useEffect, useRef } from "react";
import { TVControls } from "@/components/tv/TVControls";
import { TVScreen, YOUTUBE_CONTAINER_ID } from "@/components/tv/TVScreen";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { useTVControls } from "@/hooks/useTVControls";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import controlsStyles from "@/styles/tv/tv-controls.module.css";
import retroStyles from "@/styles/tv/retro-tv.module.css";

export function RetroTV() {
  const onErrorRef = useRef<(code: number) => void>(() => {});
  const onPlaylistIndexChangeRef = useRef<() => void>(() => {});

  const youtube = useYouTubePlayer({
    containerId: YOUTUBE_CONTAINER_ID,
    onError: (code) => onErrorRef.current(code),
    onPlaylistIndexChange: () => onPlaylistIndexChangeRef.current(),
  });

  const tv = useTVControls({
    playerReady: youtube.playerReady,
    play: youtube.play,
    pause: youtube.pause,
    stop: youtube.stop,
    setPlayerVolume: youtube.setVolume,
    loadPlaylist: youtube.loadPlaylist,
    nextVideo: youtube.nextVideo,
    previousVideo: youtube.previousVideo,
    getPlaylistIndex: youtube.getPlaylistIndex,
    getPlaylist: youtube.getPlaylist,
    getVideoData: youtube.getVideoData,
    syncPlaylistIndex: youtube.syncPlaylistIndex,
  });

  useEffect(() => {
    onErrorRef.current = tv.handlePlayerError;
    onPlaylistIndexChangeRef.current = tv.handlePlaylistIndexChange;
  }, [tv.handlePlayerError, tv.handlePlaylistIndexChange]);

  useKeyboardControls({
    actions: {
      togglePower: tv.togglePower,
      channelUp: tv.channelUp,
      channelDown: tv.channelDown,
      volumeUp: tv.volumeUp,
      volumeDown: tv.volumeDown,
      episodePrevious: tv.episodePrevious,
      episodeNext: tv.episodeNext,
    },
    isPowered: tv.isPowered,
  });

  const bezelStyle = {
    top: "5%",
    left: "4.5%",
    width: "91%",
    height: "66%",
    borderRadius: "22px 22px 26px 26px",
  } as React.CSSProperties;

  return (
    <div
      className={retroStyles.retroTv}
      role="application"
      aria-label="Retro CRT television"
    >
      <div className={retroStyles.body}>
        <span className={retroStyles.brandPlate}>GenericTV</span>
        <div
          className={retroStyles.bezelWell}
          style={bezelStyle}
          aria-hidden="true"
        />
        <TVScreen
          isPowered={tv.isPowered}
          powerPhase={tv.powerPhase}
          currentChannel={tv.currentChannel}
          isChangingChannel={tv.isChangingChannel}
          hasSignal={tv.hasSignal}
          osd={tv.osd}
          onChannelUp={tv.channelUp}
          onChannelDown={tv.channelDown}
        />
        <div className={retroStyles.speakerGrille} aria-hidden="true" />
        <div
          className={`${controlsStyles.standbyLed} ${
            !tv.isPowered
              ? controlsStyles.standbyLedActive
              : controlsStyles.standbyLedOn
          }`}
          aria-hidden="true"
        />
        <div className={retroStyles.controlsArea}>
          <TVControls
            isPowered={tv.isPowered}
            togglePower={tv.togglePower}
            channelUp={tv.channelUp}
            channelDown={tv.channelDown}
            volumeUp={tv.volumeUp}
            volumeDown={tv.volumeDown}
            episodePrevious={tv.episodePrevious}
            episodeNext={tv.episodeNext}
          />
        </div>
      </div>
    </div>
  );
}

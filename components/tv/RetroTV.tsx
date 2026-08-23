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
  const onVideoEndedRef = useRef<() => void>(() => {});
  const onStateChangeRef = useRef<(state: number) => void>(() => {});

  const youtube = useYouTubePlayer({
    containerId: YOUTUBE_CONTAINER_ID,
    onError: (code) => onErrorRef.current(code),
    onStateChange: (state) => onStateChangeRef.current(state),
    onPlaylistIndexChange: () => onPlaylistIndexChangeRef.current(),
    onVideoEnded: () => onVideoEndedRef.current(),
  });

  const tv = useTVControls({
    playerReady: youtube.playerReady,
    play: youtube.play,
    pause: youtube.pause,
    stop: youtube.stop,
    setPlayerVolume: youtube.setVolume,
    loadVideo: youtube.loadVideo,
    loadPlaylist: youtube.loadPlaylist,
    nextVideo: youtube.nextVideo,
    previousVideo: youtube.previousVideo,
    getPlaylistIndex: youtube.getPlaylistIndex,
    getPlaylist: youtube.getPlaylist,
    getVideoData: youtube.getVideoData,
    getPlayerState: youtube.getPlayerState,
    seekTo: youtube.seekTo,
    syncPlaylistIndex: youtube.syncPlaylistIndex,
    setCaptionsEnabled: youtube.setCaptionsEnabled,
  });

  useEffect(() => {
    onErrorRef.current = tv.handlePlayerError;
    onPlaylistIndexChangeRef.current = tv.handlePlaylistIndexChange;
    onVideoEndedRef.current = tv.handleVideoEnded;
    onStateChangeRef.current = tv.handlePlayerStateChange;
  }, [
    tv.handlePlayerError,
    tv.handlePlaylistIndexChange,
    tv.handleVideoEnded,
    tv.handlePlayerStateChange,
  ]);

  useKeyboardControls({
    actions: {
      togglePower: tv.togglePower,
      channelUp: tv.channelUp,
      channelDown: tv.channelDown,
      volumeUp: tv.volumeUp,
      volumeDown: tv.volumeDown,
      togglePlayPause: tv.togglePlayPause,
      stopPlayback: tv.stopPlayback,
      episodePrevious: tv.episodePrevious,
      episodeNext: tv.episodeNext,
      toggleCaptions: tv.toggleCaptions,
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
        <span className={retroStyles.brandPlate}>RetroTV</span>
        <div
          className={`${retroStyles.bezelWell} ${retroStyles.bezelShadow}`}
          style={bezelStyle}
          aria-hidden="true"
        />
        <TVScreen
          isPowered={tv.isPowered}
          powerPhase={tv.powerPhase}
          currentChannel={tv.currentChannel}
          isChangingChannel={tv.isChangingChannel}
          playerUiMasked={tv.playerUiMasked}
          hasSignal={tv.hasSignal}
          osd={tv.osd}
          onChannelUp={tv.channelUp}
          onChannelDown={tv.channelDown}
        />
        <div className={retroStyles.speakerGrille} aria-hidden="true" />
        <div className={controlsStyles.ledHousing} aria-hidden="true">
          <div
            className={`${controlsStyles.standbyLed} ${
              !tv.isPowered
                ? controlsStyles.standbyLedActive
                : controlsStyles.standbyLedOn
            }`}
          />
        </div>
        <div className={retroStyles.feet} aria-hidden="true">
          <span className={retroStyles.foot} />
          <span className={retroStyles.foot} />
        </div>
        <div className={retroStyles.controlsArea}>
          <div className={retroStyles.controlPanelInset}>
          <TVControls
            isPowered={tv.isPowered}
            togglePower={tv.togglePower}
            channelUp={tv.channelUp}
            channelDown={tv.channelDown}
            volumeUp={tv.volumeUp}
            volumeDown={tv.volumeDown}
            togglePlayPause={tv.togglePlayPause}
            stopPlayback={tv.stopPlayback}
            episodePrevious={tv.episodePrevious}
            episodeNext={tv.episodeNext}
            toggleCaptions={tv.toggleCaptions}
            captionsEnabled={tv.captionsEnabled}
          />
          </div>
        </div>
      </div>
    </div>
  );
}

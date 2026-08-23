"use client";

import { useEffect, useRef } from "react";
import { TVControls } from "@/components/tv/TVControls";
import { TVScreen, YOUTUBE_CONTAINER_ID } from "@/components/tv/TVScreen";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { useTVControls } from "@/hooks/useTVControls";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { tvScreenConfig } from "@/config/tvScreen";
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
    rampVolume: youtube.rampVolume,
    cancelVolumeRamp: youtube.cancelVolumeRamp,
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
    top: tvScreenConfig.screenTop,
    left: tvScreenConfig.screenLeft,
    width: tvScreenConfig.screenWidth,
    height: tvScreenConfig.screenHeight,
    borderRadius: tvScreenConfig.screenBorderRadius,
  } as React.CSSProperties;

  return (
    <div
      className={retroStyles.retroTv}
      role="application"
      aria-label="Retro CRT television"
    >
      <div className={retroStyles.shell}>
        <div className={retroStyles.faceSeam} aria-hidden="true" />
        <div className={retroStyles.lowerChassis} aria-hidden="true" />

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
          isLoading={tv.isLoading}
          loadingProgress={tv.loadingProgress}
          hasSignal={tv.hasSignal}
          osd={tv.osd}
          onChannelUp={tv.channelUp}
          onChannelDown={tv.channelDown}
        />

        <span className={retroStyles.brandPlate}>RETROTV</span>

        <div
          className={`${retroStyles.speaker} ${retroStyles.speakerLeft}`}
          aria-hidden="true"
        >
          <div className={retroStyles.speakerGrille} />
        </div>
        <div
          className={`${retroStyles.speaker} ${retroStyles.speakerRight}`}
          aria-hidden="true"
        >
          <div className={retroStyles.speakerGrille} />
        </div>

        <div className={retroStyles.lowerCenter}>
          <div className={retroStyles.vcrSection} aria-hidden="true">
            <div className={retroStyles.vcrRecess}>
              <div className={retroStyles.vcrFlap}>
                <span className={retroStyles.vcrLabel}>
                  VHS  DIGITAL TRACKING
                </span>
                <div className={retroStyles.vcrSlotOpening} />
              </div>
            </div>
          </div>

          <div className={retroStyles.controlsArea}>
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
            />
          </div>
        </div>

        <div className={retroStyles.avInputs} aria-hidden="true">
          <div className={retroStyles.avJack}>
            <span className={retroStyles.avJackLabel}>Video</span>
            <span
              className={`${retroStyles.avJackHole} ${retroStyles.avJackHoleVideo}`}
            />
          </div>
          <div className={retroStyles.avJack}>
            <span className={retroStyles.avJackLabel}>L</span>
            <span
              className={`${retroStyles.avJackHole} ${retroStyles.avJackHoleAudioL}`}
            />
          </div>
          <div className={retroStyles.avJack}>
            <span className={retroStyles.avJackLabel}>R</span>
            <span
              className={`${retroStyles.avJackHole} ${retroStyles.avJackHoleAudioR}`}
            />
          </div>
        </div>

        <div className={retroStyles.headphoneJack} aria-hidden="true">
          <span className={retroStyles.avJackLabel}>Phones</span>
          <span className={retroStyles.headphoneHole} />
        </div>

        <div className={retroStyles.bottomLip} aria-hidden="true" />

        <div className={retroStyles.feet} aria-hidden="true">
          <span className={retroStyles.foot} />
          <span className={retroStyles.foot} />
        </div>
      </div>
    </div>
  );
}

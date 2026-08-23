"use client";

import { useCallback } from "react";
import { isChannelPlayable } from "@/config/channels";
import { CRTOSD } from "@/components/tv/CRTDOSD";
import { CRTOverlay } from "@/components/tv/CRTOverlay";
import { PlaceholderScreen } from "@/components/tv/PlaceholderScreen";
import { StaticTransition } from "@/components/tv/StaticTransition";
import { YouTubePlayer } from "@/components/tv/YouTubePlayer";
import { tvScreenConfig } from "@/config/tvScreen";
import { tvSettings } from "@/config/tvSettings";
import type { Channel, OSDState, PowerPhase } from "@/lib/tvTypes";
import screenStyles from "@/styles/tv/tv-screen.module.css";

const YOUTUBE_CONTAINER_ID = "retro-tv-youtube-player";

interface TVScreenProps {
  isPowered: boolean;
  powerPhase: PowerPhase;
  currentChannel: Channel;
  isChangingChannel: boolean;
  isPlayerPlaying: boolean;
  hasSignal: boolean;
  osd: OSDState;
  onChannelUp: () => void;
  onChannelDown: () => void;
}

export function TVScreen({
  isPowered,
  powerPhase,
  currentChannel,
  isChangingChannel,
  isPlayerPlaying,
  hasSignal,
  osd,
  onChannelUp,
  onChannelDown,
}: TVScreenProps) {
  const playable = isChannelPlayable(currentChannel);
  const showPlayer = playable && isPowered && hasSignal;
  const revealIframe =
    showPlayer && !isChangingChannel && isPlayerPlaying;
  const showChromeMask = showPlayer && !isChangingChannel && isPlayerPlaying;
  const showStandbyCover =
    showPlayer && !isChangingChannel && !isPlayerPlaying;

  const showNoSignalOverlay =
    isPowered &&
    powerPhase === "on" &&
    Boolean(currentChannel.sourceUrl) &&
    !hasSignal;
  const showPlaceholder =
    isPowered &&
    powerPhase === "on" &&
    !currentChannel.sourceUrl &&
    currentChannel.type === "unconfigured";

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!tvSettings.enableScrollChannelChange || !isPowered) return;
      event.preventDefault();
      if (event.deltaY < 0) {
        onChannelUp();
      } else if (event.deltaY > 0) {
        onChannelDown();
      }
    },
    [isPowered, onChannelUp, onChannelDown]
  );

  const screenStyle = {
    top: tvScreenConfig.screenTop,
    left: tvScreenConfig.screenLeft,
    width: tvScreenConfig.screenWidth,
    height: tvScreenConfig.screenHeight,
    borderRadius: tvScreenConfig.screenBorderRadius,
  } as React.CSSProperties;

  const screenClasses = [
    screenStyles.screen,
    !isPowered ? screenStyles.poweredOff : "",
    powerPhase === "shuttingDown" ? screenStyles.shuttingDown : "",
    powerPhase === "booting" ? screenStyles.booting : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={screenClasses}
      style={screenStyle}
      onWheel={handleWheel}
    >
      <div
        className={screenStyles.screenInner}
        style={{ borderRadius: tvScreenConfig.screenBorderRadius }}
      >
        <YouTubePlayer
          containerId={YOUTUBE_CONTAINER_ID}
          visible={revealIframe}
        />

        {showStandbyCover && (
          <div
            className={`${screenStyles.layer} ${screenStyles.youtubeLoadCover}`}
            aria-hidden="true"
          />
        )}

        <div className={`${screenStyles.layer} ${screenStyles.contentLayer}`}>
          {showPlaceholder && (
            <PlaceholderScreen
              channelNumber={currentChannel.channel}
              channelName={currentChannel.name}
            />
          )}
          {showNoSignalOverlay && (
            <div className={screenStyles.noSignal}>
              <span className={screenStyles.noSignalText}>NO SIGNAL</span>
            </div>
          )}
        </div>

        <div className={`${screenStyles.layer} ${screenStyles.transitionLayer}`}>
          <StaticTransition active={isChangingChannel} />
        </div>

        <div className={`${screenStyles.layer} ${screenStyles.overlayLayer}`}>
          <CRTOverlay isPowered={isPowered} powerPhase={powerPhase} />
        </div>

        {showChromeMask && (
          <div
            className={`${screenStyles.layer} ${screenStyles.youtubeChromeBlocker}`}
            aria-hidden="true"
          >
            <div className={screenStyles.chromeBlockerTop} />
            <div className={screenStyles.chromeBlockerBottom} />
            <div className={screenStyles.chromeBlockerLeft} />
            <div className={screenStyles.chromeBlockerRight} />
          </div>
        )}
      </div>

      {isPowered && (
        <div className={screenStyles.osdLayer}>
          <CRTOSD osd={osd} />
        </div>
      )}
    </div>
  );
}

export { YOUTUBE_CONTAINER_ID };

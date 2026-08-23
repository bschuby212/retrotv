"use client";

import { useCallback } from "react";
import type { RefObject } from "react";
import { DEBUG_YOUTUBE_MASK } from "@/config/debugYoutubeMask";
import { CRTOSD } from "@/components/tv/CRTDOSD";
import { CRTOverlay } from "@/components/tv/CRTOverlay";
import { PlaybackShield } from "@/components/tv/PlaybackShield";
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
  hasSignal: boolean;
  osd: OSDState;
  playbackShieldRef: RefObject<HTMLDivElement | null>;
  onChannelUp: () => void;
  onChannelDown: () => void;
}

export function TVScreen({
  isPowered,
  powerPhase,
  currentChannel,
  isChangingChannel,
  hasSignal,
  osd,
  playbackShieldRef,
  onChannelUp,
  onChannelDown,
}: TVScreenProps) {
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
    DEBUG_YOUTUBE_MASK ? screenStyles.debugMask : "",
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
        <div className={screenStyles.screenViewport}>
          <YouTubePlayer containerId={YOUTUBE_CONTAINER_ID} />

          <div className={screenStyles.crtEdgeMask} aria-hidden="true" />

          <PlaybackShield shieldRef={playbackShieldRef} />

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
        </div>

        <div className={screenStyles.screenEffects} aria-hidden="true" />

        <div className={`${screenStyles.layer} ${screenStyles.overlayLayer}`}>
          <CRTOverlay isPowered={isPowered} powerPhase={powerPhase} />
        </div>
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

"use client";

import { TVButton } from "@/components/tv/TVButton";
import type { TVControlsActions } from "@/lib/tvTypes";
import controlsStyles from "@/styles/tv/tv-controls.module.css";

interface TVControlsProps extends TVControlsActions {
  isPowered: boolean;
  captionsEnabled: boolean;
}

export function TVControls({
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
  captionsEnabled,
}: TVControlsProps) {
  return (
    <div className={controlsStyles.panel}>
      <div className={controlsStyles.cluster}>
        <span className={controlsStyles.clusterLabel}>Power</span>
        <TVButton
          variant="power"
          ariaLabel="Power"
          onClick={togglePower}
          hideLabel
        />
      </div>

      <div className={controlsStyles.gap} aria-hidden="true" />

      <div className={controlsStyles.cluster}>
        <span className={controlsStyles.clusterLabel}>Volume</span>
        <div className={controlsStyles.buttonPair}>
          <TVButton
            variant="narrow"
            icon="−"
            ariaLabel="Volume down"
            onClick={volumeDown}
            hideLabel
          />
          <TVButton
            variant="narrow"
            icon="+"
            ariaLabel="Volume up"
            onClick={volumeUp}
            hideLabel
          />
        </div>
      </div>

      <div className={controlsStyles.gapWide} aria-hidden="true" />

      <div className={controlsStyles.cluster}>
        <span className={controlsStyles.clusterLabel}>Channel</span>
        <div className={controlsStyles.buttonPair}>
          <TVButton
            variant="narrow"
            icon="−"
            ariaLabel="Channel down"
            onClick={channelDown}
            hideLabel
          />
          <TVButton
            variant="narrow"
            icon="+"
            ariaLabel="Channel up"
            onClick={channelUp}
            hideLabel
          />
        </div>
      </div>

      <div className={controlsStyles.gapWide} aria-hidden="true" />

      <div className={controlsStyles.transportGroup}>
        <div className={controlsStyles.cluster}>
          <span className={controlsStyles.clusterLabel}>Play</span>
          <TVButton
            variant="transport"
            icon="▶‖"
            ariaLabel="Play or pause"
            onClick={togglePlayPause}
            hideLabel
          />
        </div>
        <div className={controlsStyles.cluster}>
          <span className={controlsStyles.clusterLabel}>Stop</span>
          <TVButton
            variant="transport"
            icon="■"
            ariaLabel="Stop"
            onClick={stopPlayback}
            hideLabel
          />
        </div>
        <div className={controlsStyles.cluster}>
          <span className={controlsStyles.clusterLabel}>Prev</span>
          <TVButton
            variant="transport"
            icon="◀◀"
            ariaLabel="Previous episode"
            onClick={episodePrevious}
            hideLabel
          />
        </div>
        <div className={controlsStyles.cluster}>
          <span className={controlsStyles.clusterLabel}>Next</span>
          <TVButton
            variant="transport"
            icon="▶▶"
            ariaLabel="Next episode"
            onClick={episodeNext}
            hideLabel
          />
        </div>
        <div className={controlsStyles.cluster}>
          <span className={controlsStyles.clusterLabel}>CC</span>
          <TVButton
            variant="transport"
            icon="CC"
            ariaLabel="Toggle captions"
            onClick={toggleCaptions}
            active={captionsEnabled}
            hideLabel
          />
        </div>
      </div>
    </div>
  );
}

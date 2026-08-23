"use client";

import { TVButton } from "@/components/tv/TVButton";
import type { TVControlsActions } from "@/lib/tvTypes";
import controlsStyles from "@/styles/tv/tv-controls.module.css";

interface TVControlsProps extends TVControlsActions {
  isPowered: boolean;
}

export function TVControls({
  togglePower,
  channelUp,
  channelDown,
  volumeUp,
  volumeDown,
  episodePrevious,
  episodeNext,
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
          <span className={controlsStyles.clusterLabel}>Prev</span>
          <TVButton
            variant="transport"
            icon="|◀◀"
            ariaLabel="Previous episode"
            onClick={episodePrevious}
            hideLabel
          />
        </div>
        <div className={controlsStyles.cluster}>
          <span className={controlsStyles.clusterLabel}>Next</span>
          <TVButton
            variant="transport"
            icon="▶▶|"
            ariaLabel="Next episode"
            onClick={episodeNext}
            hideLabel
          />
        </div>
      </div>
    </div>
  );
}

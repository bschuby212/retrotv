"use client";

import { TVButton } from "@/components/tv/TVButton";
import type { TVControlsActions } from "@/lib/tvTypes";
import controlsStyles from "@/styles/tv/tv-controls.module.css";

interface TVControlsProps extends TVControlsActions {
  isPowered: boolean;
}

export function TVControls({
  isPowered,
  togglePower,
  channelUp,
  channelDown,
  volumeUp,
  volumeDown,
}: TVControlsProps) {
  return (
    <>
      <div
        className={`${controlsStyles.standbyLed} ${
          !isPowered
            ? controlsStyles.standbyLedActive
            : controlsStyles.standbyLedOn
        }`}
        aria-hidden="true"
      />
      <div className={controlsStyles.controls}>
        <TVButton
          label="Power"
          variant="power"
          onClick={togglePower}
        />
        <div className={controlsStyles.divider} aria-hidden="true" />
        <div className={controlsStyles.buttonGroup}>
          <TVButton
            label="Ch ▼"
            variant="channelDown"
            icon="▼"
            onClick={channelDown}
          />
          <TVButton
            label="Ch ▲"
            variant="channelUp"
            icon="▲"
            onClick={channelUp}
          />
        </div>
        <div className={controlsStyles.divider} aria-hidden="true" />
        <div className={controlsStyles.buttonGroup}>
          <TVButton label="Vol ▼" icon="−" onClick={volumeDown} />
          <TVButton label="Vol ▲" icon="+" onClick={volumeUp} />
        </div>
      </div>
    </>
  );
}

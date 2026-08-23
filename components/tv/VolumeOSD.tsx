import osdStyles from "@/styles/tv/osd.module.css";

const SEGMENT_COUNT = 20;

interface VolumeOSDProps {
  volume: number;
  muted?: boolean;
}

function buildBlockMeter(filledCount: number): string {
  const filled = "█".repeat(filledCount);
  const empty = "░".repeat(SEGMENT_COUNT - filledCount);
  return filled + empty;
}

export function VolumeOSD({ volume, muted = false }: VolumeOSDProps) {
  const filledCount = Math.round((volume / 100) * SEGMENT_COUNT);

  if (muted || volume === 0) {
    return (
      <div
        className={`${osdStyles.osd} ${osdStyles.osdCenter}`}
        role="status"
        aria-live="polite"
      >
        <div className={osdStyles.muteLabel}>MUTE</div>
      </div>
    );
  }

  return (
    <div
      className={`${osdStyles.osd} ${osdStyles.osdCenter} ${osdStyles.volumeOsd}`}
      role="status"
      aria-live="polite"
    >
      <div className={osdStyles.volumeHeader}>VOLUME</div>
      <div className={osdStyles.blockMeter} aria-hidden="true">
        {buildBlockMeter(filledCount)}
      </div>
      <div className={osdStyles.volumeValue}>{volume}</div>
    </div>
  );
}

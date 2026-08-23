import osdStyles from "@/styles/tv/osd.module.css";

const SEGMENT_COUNT = 20;

interface VolumeOSDProps {
  volume: number;
  muted?: boolean;
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
      <div className={osdStyles.volumeLabel}>VOLUME {volume}</div>
      <div className={`${osdStyles.meter} ${osdStyles.meterCenter}`} aria-hidden="true">
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <div
            key={i}
            className={`${osdStyles.segment} ${
              i < filledCount ? osdStyles.segmentFilled : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

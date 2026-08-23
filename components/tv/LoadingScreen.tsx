import loadingStyles from "@/styles/tv/loading-screen.module.css";

const SEGMENT_COUNT = 7;

interface LoadingScreenProps {
  active: boolean;
  progress: number;
}

export function LoadingScreen({ active, progress }: LoadingScreenProps) {
  if (!active) return null;

  const clamped = Math.min(1, Math.max(0, progress));
  const filledSegments = Math.floor(clamped * SEGMENT_COUNT);

  return (
    <div className={loadingStyles.loading} aria-hidden="true">
      <div className={loadingStyles.noise} />
      <div className={loadingStyles.scanlines} />
      <div className={loadingStyles.labelRow}>
        <span className={loadingStyles.label}>Loading</span>
        <span className={loadingStyles.cursor} />
      </div>
      <div className={loadingStyles.progressBar}>
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <span
            key={index}
            className={`${loadingStyles.segment} ${
              index < filledSegments ? loadingStyles.segmentFilled : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

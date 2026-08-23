import osdStyles from "@/styles/tv/osd.module.css";

interface EpisodeOSDProps {
  channelNumber: number;
  channelName: string;
  episodeNumber: number;
  episodeTitle?: string;
}

export function EpisodeOSD({
  channelNumber,
  channelName,
  episodeNumber,
  episodeTitle,
}: EpisodeOSDProps) {
  const formattedChannel = String(channelNumber).padStart(2, "0");

  return (
    <div className={osdStyles.osd} role="status" aria-live="polite">
      <div className={osdStyles.channelNumber}>CH {formattedChannel}</div>
      <div className={osdStyles.channelName}>{channelName}</div>
      <div className={osdStyles.episodeNumber}>
        EPISODE {episodeNumber}
      </div>
      {episodeTitle && (
        <div className={osdStyles.episodeTitle}>{episodeTitle}</div>
      )}
    </div>
  );
}

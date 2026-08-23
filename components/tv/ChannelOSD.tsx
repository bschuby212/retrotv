import osdStyles from "@/styles/tv/osd.module.css";

interface ChannelOSDProps {
  channelNumber: number;
  channelName: string;
}

export function ChannelOSD({ channelNumber, channelName }: ChannelOSDProps) {
  const formatted = String(channelNumber).padStart(2, "0");

  return (
    <div className={osdStyles.osd} role="status" aria-live="polite">
      <div className={osdStyles.channelNumber}>CH {formatted}</div>
      <div className={osdStyles.channelName}>{channelName}</div>
    </div>
  );
}

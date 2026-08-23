import placeholderStyles from "@/styles/tv/placeholder-screen.module.css";

interface PlaceholderScreenProps {
  channelNumber: number;
  channelName: string;
}

export function PlaceholderScreen({
  channelNumber,
  channelName,
}: PlaceholderScreenProps) {
  const formatted = String(channelNumber).padStart(2, "0");

  return (
    <div className={placeholderStyles.placeholder}>
      <div className={placeholderStyles.colorBars}>
        <div className={placeholderStyles.bar} />
        <div className={placeholderStyles.bar} />
        <div className={placeholderStyles.bar} />
        <div className={placeholderStyles.bar} />
        <div className={placeholderStyles.bar} />
        <div className={placeholderStyles.bar} />
        <div className={placeholderStyles.bar} />
      </div>
      <div className={placeholderStyles.placeholderInfo}>
        <div className={placeholderStyles.placeholderChannel}>
          CH {formatted} — {channelName.toUpperCase()}
        </div>
        <div className={placeholderStyles.placeholderHint}>
          NO VIDEO ID — ADD YOUTUBE ID IN CONFIG
        </div>
      </div>
      <div className={placeholderStyles.placeholderPattern} aria-hidden="true" />
    </div>
  );
}

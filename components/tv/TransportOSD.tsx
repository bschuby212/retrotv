import osdStyles from "@/styles/tv/osd.module.css";

interface TransportOSDProps {
  label: "PLAY" | "PAUSE" | "STOP";
}

export function TransportOSD({ label }: TransportOSDProps) {
  return (
    <div
      className={`${osdStyles.osd} ${osdStyles.osdCenter}`}
      role="status"
      aria-live="polite"
    >
      <div className={osdStyles.transportLabel}>{label}</div>
    </div>
  );
}

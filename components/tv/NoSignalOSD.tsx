import osdStyles from "@/styles/tv/osd.module.css";

export function NoSignalOSD() {
  return (
    <div
      className={`${osdStyles.osd} ${osdStyles.osdCenter}`}
      role="status"
      aria-live="polite"
    >
      <div className={osdStyles.noSignalOsd}>NO SIGNAL</div>
    </div>
  );
}

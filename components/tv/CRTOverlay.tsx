import overlayStyles from "@/styles/tv/crt-overlay.module.css";
import screenStyles from "@/styles/tv/tv-screen.module.css";

interface CRTOverlayProps {
  isPowered: boolean;
  powerPhase: "off" | "booting" | "on" | "shuttingDown";
}

export function CRTOverlay({ isPowered, powerPhase }: CRTOverlayProps) {
  const showBloom = isPowered && powerPhase === "on";
  const showBootBloom = powerPhase === "booting";

  return (
    <>
      <div
        className={`${overlayStyles.overlay} ${overlayStyles.scanlines} ${!isPowered ? overlayStyles.off : ""}`}
      />
      <div
        className={`${overlayStyles.overlay} ${overlayStyles.vignette}`}
      />
      <div
        className={`${overlayStyles.overlay} ${overlayStyles.noise}`}
      />
      <div
        className={`${overlayStyles.overlay} ${overlayStyles.phosphor} ${!isPowered ? overlayStyles.off : ""}`}
      />
      <div
        className={`${overlayStyles.overlay} ${overlayStyles.bloom} ${showBloom ? overlayStyles.bloomActive : ""}`}
      />
      <div
        className={`${overlayStyles.overlay} ${overlayStyles.glass} ${!isPowered ? overlayStyles.off : ""}`}
      />
      <div
        className={`${screenStyles.hum} ${showBloom ? screenStyles.humActive : ""}`}
        aria-hidden="true"
      />
      <div
        className={`${overlayStyles.powerBloom} ${showBootBloom ? overlayStyles.powerBloomActive : ""}`}
        aria-hidden="true"
      >
        {showBootBloom && <div className={overlayStyles.powerLine} />}
      </div>
    </>
  );
}

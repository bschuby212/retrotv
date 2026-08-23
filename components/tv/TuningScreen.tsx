import tuningStyles from "@/styles/tv/tuning-screen.module.css";

interface TuningScreenProps {
  active: boolean;
}

export function TuningScreen({ active }: TuningScreenProps) {
  if (!active) return null;

  return (
    <div className={tuningStyles.tuning} aria-hidden="true">
      <div className={tuningStyles.noise} />
      <div className={tuningStyles.rollBar} />
      <div className={tuningStyles.dim} />
      <div className={tuningStyles.scanlines} />
    </div>
  );
}

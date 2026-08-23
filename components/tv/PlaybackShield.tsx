import screenStyles from "@/styles/tv/tv-screen.module.css";

interface PlaybackShieldProps {
  active: boolean;
}

export function PlaybackShield({ active }: PlaybackShieldProps) {
  return (
    <div
      className={`${screenStyles.playbackShield} ${
        active ? "" : screenStyles.playbackShieldOff
      }`}
      aria-hidden="true"
    />
  );
}

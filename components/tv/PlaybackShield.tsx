import { useEffect, useRef } from "react";
import screenStyles from "@/styles/tv/tv-screen.module.css";

interface PlaybackShieldProps {
  shieldRef: React.RefObject<HTMLDivElement | null>;
}

export function PlaybackShield({ shieldRef }: PlaybackShieldProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (node.dataset.active == null) {
      node.dataset.active = "true";
    }
  }, []);

  return (
    <div
      ref={(node) => {
        nodeRef.current = node;
        shieldRef.current = node;
      }}
      className={screenStyles.playbackShield}
      aria-hidden="true"
    />
  );
}

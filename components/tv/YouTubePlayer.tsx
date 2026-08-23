"use client";

import screenStyles from "@/styles/tv/tv-screen.module.css";

interface YouTubePlayerProps {
  containerId: string;
  visible: boolean;
}

export function YouTubePlayer({ containerId, visible }: YouTubePlayerProps) {
  return (
    <div
      className={`${screenStyles.layer} ${screenStyles.playerLayer} ${!visible ? screenStyles.hidden : ""}`}
    >
      <div id={containerId} className={screenStyles.playerHost} />
    </div>
  );
}

"use client";

import screenStyles from "@/styles/tv/tv-screen.module.css";

interface YouTubePlayerProps {
  containerId: string;
}

export function YouTubePlayer({ containerId }: YouTubePlayerProps) {
  return (
    <div className={`${screenStyles.layer} ${screenStyles.playerLayer}`}>
      <div id={containerId} className={screenStyles.playerHost} />
    </div>
  );
}

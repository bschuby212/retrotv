"use client";

import { ChannelOSD } from "@/components/tv/ChannelOSD";
import { EpisodeOSD } from "@/components/tv/EpisodeOSD";
import { NoSignalOSD } from "@/components/tv/NoSignalOSD";
import { VolumeOSD } from "@/components/tv/VolumeOSD";
import type { OSDState } from "@/lib/tvTypes";

interface CRTOSDProps {
  osd: OSDState;
}

export function CRTOSD({ osd }: CRTOSDProps) {
  if (!osd.type) return null;

  switch (osd.type) {
    case "channel":
      if (
        osd.payload &&
        "channelNumber" in osd.payload &&
        "channelName" in osd.payload &&
        !("episodeNumber" in osd.payload)
      ) {
        return (
          <ChannelOSD
            channelNumber={osd.payload.channelNumber}
            channelName={osd.payload.channelName}
          />
        );
      }
      return null;
    case "episode":
      if (osd.payload && "episodeNumber" in osd.payload) {
        return (
          <EpisodeOSD
            channelNumber={osd.payload.channelNumber}
            channelName={osd.payload.channelName}
            episodeNumber={osd.payload.episodeNumber}
            episodeTitle={osd.payload.episodeTitle}
          />
        );
      }
      return null;
    case "volume":
      return (
        <VolumeOSD
          volume={
            osd.payload && "volume" in osd.payload ? osd.payload.volume : 0
          }
        />
      );
    case "mute":
      return <VolumeOSD volume={0} muted />;
    case "noSignal":
      return <NoSignalOSD />;
    default:
      return null;
  }
}

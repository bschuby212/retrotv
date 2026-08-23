import channelsData from "@/config/channels.json";
import type { Channel, ChannelSourceType } from "@/lib/tvTypes";

interface ChannelEntry {
  channel: number;
  name: string;
  sourceUrl?: string;
  type?: ChannelSourceType;
  videoId?: string;
  playlistId?: string;
  loop?: boolean;
  embeddable?: boolean;
  needsMapping?: boolean;
  note?: string;
}

/** Extract video ID from watch, youtu.be, or embed URLs. */
export function parseVideoId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1).split("/")[0] ?? "";
    }

    const v = url.searchParams.get("v");
    if (v) return v;

    const embedMatch = url.pathname.match(/\/embed\/([\w-]{11})/);
    if (embedMatch) return embedMatch[1];
  } catch {
    // Not a valid URL
  }

  return "";
}

/** Extract playlist ID from playlist URLs or raw PL... IDs. */
export function parsePlaylistId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (/^PL[\w-]+$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const list = url.searchParams.get("list");
    if (list) return list;
  } catch {
    // Not a valid URL
  }

  return "";
}

/** Detect YouTube Show URLs — not supported by IFrame Player API. */
export function isYouTubeShowUrl(input: string): boolean {
  try {
    const url = input.startsWith("http") ? new URL(input) : new URL(`https://${input}`);
    return url.pathname.includes("/show/");
  } catch {
    return false;
  }
}

function resolveChannel(entry: ChannelEntry): Channel {
  const sourceUrl = entry.sourceUrl ?? "";
  let type: ChannelSourceType = entry.type ?? "unconfigured";
  let videoId = entry.videoId ?? "";
  let playlistId = entry.playlistId ?? "";
  let embeddable = entry.embeddable ?? true;
  let needsMapping = entry.needsMapping ?? false;
  const note = entry.note;

  if (sourceUrl) {
    if (isYouTubeShowUrl(sourceUrl)) {
      type = "show";
      embeddable = false;
      needsMapping = entry.needsMapping ?? true;
    } else {
      videoId = videoId || parseVideoId(sourceUrl);
      playlistId = playlistId || parsePlaylistId(sourceUrl);

      if (playlistId && !videoId) {
        type = entry.type === "playlist" ? "playlist" : "playlist";
      } else if (videoId) {
        type = entry.type === "video" || entry.type === "live" ? entry.type : "video";
      } else if (!entry.type || entry.type === "unconfigured") {
        embeddable = false;
      }
    }
  } else {
    embeddable = false;
    type = "unconfigured";
  }

  if (entry.embeddable === false) {
    embeddable = false;
  }

  return {
    channel: entry.channel,
    name: entry.name,
    sourceUrl,
    type,
    videoId: videoId || undefined,
    playlistId: playlistId || undefined,
    loop: entry.loop ?? false,
    embeddable,
    needsMapping,
    note,
  };
}

export const channels: Channel[] = (channelsData.channels as ChannelEntry[]).map(
  resolveChannel
);

/** Whether this channel has a source the IFrame API can attempt to play. */
export function isChannelPlayable(channel: Channel): boolean {
  if (!channel.embeddable) return false;
  return Boolean(channel.videoId || channel.playlistId);
}

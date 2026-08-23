import channelsData from "@/config/channels.json";
import type { Channel } from "@/lib/tvTypes";

interface ChannelEntry {
  channel: number;
  name: string;
  playlistUrl?: string;
  playlistId?: string;
}

/** Extract playlist ID from a full YouTube URL or accept raw PL... IDs. */
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
    // Not a URL — return as-is if it looks like an ID
  }

  return trimmed;
}

export const channels: Channel[] = (channelsData.channels as ChannelEntry[]).map(
  (entry) => ({
    channel: entry.channel,
    name: entry.name,
    playlistId: parsePlaylistId(entry.playlistUrl ?? entry.playlistId ?? ""),
  })
);

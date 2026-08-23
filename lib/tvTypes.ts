export type ChannelSourceType =
  | "video"
  | "live"
  | "playlist"
  | "show"
  | "unconfigured";

export interface Channel {
  channel: number;
  name: string;
  sourceUrl: string;
  type: ChannelSourceType;
  videoId?: string;
  playlistId?: string;
  loop: boolean;
  embeddable: boolean;
  needsMapping?: boolean;
  note?: string;
}

export type PowerPhase = "off" | "booting" | "on" | "shuttingDown";

export type OSDType =
  | "channel"
  | "episode"
  | "volume"
  | "mute"
  | "noSignal"
  | "play"
  | "pause"
  | "stop"
  | "ccOn"
  | "ccOff"
  | null;

export interface ChannelOSDPayload {
  channelNumber: number;
  channelName: string;
}

export interface EpisodeOSDPayload {
  channelNumber: number;
  channelName: string;
  episodeNumber: number;
  episodeTitle?: string;
}

export interface VolumeOSDPayload {
  volume: number;
}

export type OSDPayload =
  | ChannelOSDPayload
  | EpisodeOSDPayload
  | VolumeOSDPayload;

export interface OSDState {
  type: OSDType;
  payload?: OSDPayload;
}

export interface TVScreenConfig {
  screenTop: string;
  screenLeft: string;
  screenWidth: string;
  screenHeight: string;
  screenBorderRadius: string;
}

export interface TVControlsActions {
  togglePower: () => void;
  channelUp: () => void;
  channelDown: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
  togglePlayPause: () => void;
  stopPlayback: () => void;
  episodePrevious: () => void;
  episodeNext: () => void;
  toggleCaptions: () => void;
}

export interface TVControlsInternal {
  handlePlayerError: () => void;
  handlePlaylistIndexChange: () => void;
  handleVideoEnded: () => void;
  handlePlayerStateChange: (state: number) => void;
}

export interface TVControlsState {
  isPowered: boolean;
  powerPhase: PowerPhase;
  currentChannelIndex: number;
  volume: number;
  isChangingChannel: boolean;
  isLoading: boolean;
  loadingProgress: number;
  isPlaybackShielded: boolean;
  captionsEnabled: boolean;
  osd: OSDState;
  playerReady: boolean;
  hasSignal: boolean;
  currentChannel: Channel;
}

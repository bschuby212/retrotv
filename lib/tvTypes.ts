export interface Channel {
  channel: number;
  name: string;
  playlistId: string;
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
  episodePrevious: () => void;
  episodeNext: () => void;
}

export interface TVControlsInternal {
  handlePlayerError: () => void;
  handlePlaylistIndexChange: () => void;
}

export interface TVControlsState {
  isPowered: boolean;
  powerPhase: PowerPhase;
  currentChannelIndex: number;
  volume: number;
  isChangingChannel: boolean;
  osd: OSDState;
  playerReady: boolean;
  hasSignal: boolean;
  currentChannel: Channel;
}

export interface Channel {
  channel: number;
  name: string;
  youtubeId: string;
}

export type PowerPhase = "off" | "booting" | "on" | "shuttingDown";

export type OSDType =
  | "channel"
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

export interface VolumeOSDPayload {
  volume: number;
}

export interface OSDState {
  type: OSDType;
  payload?: ChannelOSDPayload | VolumeOSDPayload;
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
}

export interface TVControlsInternal {
  handlePlayerError: () => void;
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

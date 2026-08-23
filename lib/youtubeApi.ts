export interface YouTubeVideoData {
  video_id: string;
  title: string;
  author: string;
  video_url: string;
}

export interface YouTubeCaptionTrack {
  languageCode?: string;
  languageName?: string;
  kind?: string;
  name?: string;
}

export interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  loadVideoById: (
    videoId: string | { videoId: string; startSeconds?: number }
  ) => void;
  cueVideoById: (
    videoId: string | { videoId: string; startSeconds?: number }
  ) => void;
  loadPlaylist: (
    playlistId: string | { list: string; index?: number; startSeconds?: number },
    index?: number,
    startSeconds?: number
  ) => void;
  cuePlaylist: (
    playlistId: string | { list: string; index?: number; startSeconds?: number },
    index?: number,
    startSeconds?: number
  ) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getPlaylistIndex: () => number;
  getPlaylist: () => string[];
  getVideoData: () => YouTubeVideoData;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getOptions: (module?: string) => string[];
  getOption: (module: string, option: string) => unknown;
  setOption: (module: string, option: string, value: unknown) => void;
  destroy: () => void;
}

export interface YouTubePlayerOptions {
  height?: string;
  width?: string;
  videoId?: string;
  host?: string;
  playerVars?: Record<string, string | number | undefined>;
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void;
    onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
    onError?: (event: { data: number; target: YouTubePlayer }) => void;
    onApiChange?: (event: { target: YouTubePlayer }) => void;
  };
}

export interface YouTubeAPI {
  Player: new (
    elementId: string | HTMLElement,
    options: YouTubePlayerOptions
  ) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

export function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (apiLoadPromise) {
    return apiLoadPromise;
  }

  apiLoadPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (existingScript) {
      const checkReady = () => {
        if (window.YT?.Player) {
          resolve();
        } else {
          window.setTimeout(checkReady, 50);
        }
      };
      checkReady();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  });

  return apiLoadPromise;
}

export function isYouTubeEmbedError(code: number): boolean {
  return [2, 5, 100, 101, 150].includes(code);
}

export function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength - 1).trim()}…`;
}

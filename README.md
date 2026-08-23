# Retro CRT TV

Interactive late-90s CRT television built with Next.js, TypeScript, and CSS Modules. YouTube playback is driven by the IFrame Player API so physical controls and keyboard shortcuts behave like a real TV.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controls

| Input | Action |
|---|---|
| Power button / Space | Toggle power |
| Ch ▲ / Arrow Up | Channel up |
| Ch ▼ / Arrow Down | Channel down |
| Vol ▲ / Arrow Right | Volume up (+5) |
| Vol ▼ / Arrow Left | Volume down (−5) |

## Configuration

### Channels — `config/channels.ts`

Add, remove, reorder, or rename channels here:

```ts
export const channels = [
  { channel: 2, name: "Pokémon", youtubeId: "YOUR_VIDEO_ID" },
  { channel: 3, name: "Yu-Gi-Oh!", youtubeId: "" },
];
```

Leave `youtubeId` blank to show a color-bar placeholder screen. Use the video ID only (e.g. `Bkm_tBed4KQ` from a live URL).

### Screen alignment — `config/tvScreen.ts`

When you add a transparent TV frame PNG, adjust these values so the video lines up with the screen cutout:

```ts
export const tvScreenConfig = {
  screenTop: "8.5%",
  screenLeft: "7%",
  screenWidth: "86%",
  screenHeight: "58%",
  screenBorderRadius: "18px 18px 22px 22px",
};
```

### Behavior — `config/tvSettings.ts`

- `enableScrollChannelChange` — mouse wheel channel change (default: `false`)
- Volume step, OSD timings, transition durations

## Architecture

```
RetroTV
├── TVScreen (positioned aperture + effect stack)
│   ├── YouTubePlayer
│   ├── PlaceholderScreen
│   ├── StaticTransition
│   ├── CRTOverlay
│   └── CRTOSD (channel / volume / mute)
└── TVControls (physical buttons + standby LED)
```

Hooks: `useTVControls`, `useYouTubePlayer`, `useKeyboardControls`

## Future frame image

1. Place your frame at `public/tv-frame.png`
2. Overlay it on the housing layer
3. Tune `config/tvScreen.ts` until the player aligns with the transparent opening

No player or control logic changes are required.

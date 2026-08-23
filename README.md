# Retro CRT TV

Interactive late-90s CRT television built with Next.js, TypeScript, and CSS Modules. Each channel maps to a YouTube playlist; physical controls and keyboard shortcuts navigate shows and episodes.

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
| Channel + / − / ↑ / ↓ | Switch show playlist |
| Volume + / − / → / ← | Volume ±5 |
| Prev `\|◀◀` / `[` | Previous episode in playlist |
| Next `▶▶\|` / `]` | Next episode in playlist |

Hardware labels are printed on the TV panel — no separate UI instructions needed.

## Configuration

### Channels — `config/channels.ts`

Each channel is a show or collection backed by a YouTube playlist:

```ts
export const channels = [
  { channel: 2, name: "Pokémon", playlistId: "PLxxxxxxxx" },
  { channel: 3, name: "Yu-Gi-Oh!", playlistId: "" },
];
```

Leave `playlistId` blank to show a color-bar placeholder. Episode position is remembered per channel when you return.

Use the playlist ID from a YouTube playlist URL (`list=PL...`).

### Behavior — `config/tvSettings.ts`

- `autoPlayNextEpisode` — let playlist continue when an episode ends (default: `true`)
- `enableScrollChannelChange` — mouse wheel channel change (default: `false`)
- Volume step, OSD timings, transition durations

### Screen alignment — `config/tvScreen.ts`

When you add a transparent TV frame PNG, adjust these values so video aligns with the screen cutout.

## Architecture

```
RetroTV
├── TVScreen (positioned aperture + effect stack)
│   ├── YouTubePlayer (playlist API)
│   ├── PlaceholderScreen
│   ├── StaticTransition
│   ├── CRTOverlay
│   └── CRTOSD (channel / episode / volume / mute)
└── TVControls (power, volume, channel, prev/next episode)
```

Hooks: `useTVControls`, `useYouTubePlayer`, `useKeyboardControls`

## Future frame image

1. Place your frame at `public/tv-frame.png`
2. Overlay it on the housing layer
3. Tune `config/tvScreen.ts` until the player aligns with the transparent opening

No player or control logic changes are required.

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

### Channels — just send links in chat

You do not need to edit any code. Paste YouTube playlist links here in chat, tell me the show name and channel number, and I will add them.

Example message:

> Channel 2 Pokémon: https://www.youtube.com/playlist?list=PLxxxx

Links are stored in [`config/channels.json`](config/channels.json). Full URLs work — the app extracts the playlist ID automatically.

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

# Embed test report

Tested via YouTube IFrame Player API on `http://localhost:3000` (Aug 23, 2026).

| Ch | Name | Source URL | Result |
|---|---|---|---|
| 02 | YU-GI-OH! | https://www.youtube.com/watch?v=I6WRXeKZK64 | **NO SIGNAL** — player error (likely embedding restricted by uploader/YouTube) |
| 03 | POKÉMON — SEASON 1 | https://www.youtube.com/show/VLPLRcHmntfmJ8BNpfON92grhkv6WxuqF5vD?sbp=Kgt6M2hNWDY1S2h0Z0AB | **NO SIGNAL** — YouTube Show URLs are not supported by IFrame Player API; flagged `needsMapping: true` in config |
| 04 | CLASSIC CARTOONS | https://www.youtube.com/watch?v=W0Rb3v7J1ZQ | **NO SIGNAL** — player error (likely embedding restricted) |
| 05 | POKÉMON: THE FIRST MOVIE | https://www.youtube.com/watch?v=CvTG5HtDYpY | **NO SIGNAL** — player error (likely embedding restricted) |
| 06 | YU-GI-OH! MOVIE | https://www.youtube.com/watch?v=iqJifTEbatc | **NO SIGNAL** — player error (likely embedding restricted) |
| 07 | YU-GI-OH! MOVIE 2 | https://www.youtube.com/watch?v=h-AEPFNIJFc | **NO SIGNAL** — player error (likely embedding restricted) |

## Notes

- Original URLs are preserved exactly in [`channels.json`](channels.json).
- oEmbed returned HTTP 200 for video IDs, but oEmbed does **not** guarantee iframe embed permission.
- When the IFrame API fires error codes 100/101/150, the TV shows **NO SIGNAL** and channel switching remains functional.
- Channel 03 requires a proper Season 1 **playlist ID** or individual **video IDs** once you provide them — the Show page URL cannot be used directly.

## To fix a NO SIGNAL channel

Send a replacement link in chat (playlist or watch URL). No coding required on your end.

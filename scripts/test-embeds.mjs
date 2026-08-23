import { chromium } from "playwright";
import channelsData from "../config/channels.json" with { type: "json" };

const VIDEO_IDS = {
  2: "I6WRXeKZK64",
  4: "W0Rb3v7J1ZQ",
  5: "CvTG5HtDYpY",
  6: "iqJifTEbatc",
  7: "h-AEPFNIJFc",
};

const results = [];

for (const entry of channelsData.channels) {
  const result = {
    channel: entry.channel,
    name: entry.name,
    sourceUrl: entry.sourceUrl,
    type: entry.type,
    status: "pending",
  };

  if (entry.type === "show" || entry.embeddable === false) {
    result.status = "not_embeddable_by_design";
    result.note = entry.note;
  } else if (VIDEO_IDS[entry.channel]) {
    const id = VIDEO_IDS[entry.channel];
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    );
    result.videoId = id;
    result.status = res.ok ? "oembed_ok" : `oembed_http_${res.status}`;
  }

  results.push(result);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Power" }).click();
await page.waitForTimeout(900);

for (const ch of [2, 3, 4, 5, 6, 7]) {
  let attempts = 0;
  while (attempts < 8) {
    const text = await page.locator("body").innerText();
    if (text.includes(`CH 0${ch}`) || text.includes(`CH ${ch}`)) break;
    await page.getByRole("button", { name: "Channel up" }).click();
    await page.waitForTimeout(450);
    attempts++;
  }
  await page.waitForTimeout(1200);
  const noSignal = (await page.getByText("NO SIGNAL").count()) > 0;
  const entry = results.find((r) => r.channel === ch);
  if (entry && entry.status !== "not_embeddable_by_design") {
    entry.playerResult = noSignal ? "NO_SIGNAL" : "PLAYING";
  } else if (entry) {
    entry.playerResult = noSignal ? "NO_SIGNAL" : "UNEXPECTED_SIGNAL";
  }
}

console.log(JSON.stringify(results, null, 2));
await browser.close();

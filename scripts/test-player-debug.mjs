import { chromium } from "playwright";

const tests = [
  { name: "CH02 Yu-Gi-Oh", id: "I6WRXeKZK64" },
  { name: "CH04 Cartoons", id: "W0Rb3v7J1ZQ" },
  { name: "CH05 Pokemon Movie", id: "CvTG5HtDYpY" },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const t of tests) {
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__ytErrors = [];
    window.onYouTubeIframeAPIReady = () => {};
  });

  await page.getByRole("button", { name: "Power" }).click();
  await page.waitForTimeout(2500);

  const body = await page.locator("body").innerText();
  const hasNoSignal = body.includes("NO SIGNAL");
  const hasIframe = (await page.locator("iframe").count()) > 0;

  console.log(JSON.stringify({ ...t, hasNoSignal, hasIframe, snippet: body.slice(0, 200) }));
}

await browser.close();

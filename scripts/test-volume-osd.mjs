import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

await page.getByRole("button", { name: "Power" }).click();
await page.waitForTimeout(1000);

await page.getByRole("button", { name: "Vol ▲" }).click();
await page.waitForTimeout(200);

const volumeText = page.getByText(/VOLUME \d+/);
const channelText = page.getByText(/^CH \d+$/);

console.log("Volume OSD visible:", await volumeText.count());
console.log("Channel OSD visible:", await channelText.count());

if (await volumeText.count()) {
  console.log("Volume text:", await volumeText.first().textContent());
}

const statusEls = await page.locator('[role="status"]').allTextContents();
console.log("Status elements:", statusEls);

await browser.close();

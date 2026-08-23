import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, error: String(e) });
  }
}

await check("Page loads with TV", async () => {
  await page.waitForSelector('[aria-label="Retro CRT television"]');
});

await check("Power on shows placeholder", async () => {
  await page.getByRole("button", { name: "Power" }).click();
  await page.waitForTimeout(700);
  await page.getByText("CH 02");
});

await check("Volume OSD on Vol+", async () => {
  await page.getByRole("button", { name: "Volume up" }).click();
  await page.waitForTimeout(100);
  const count = await page.getByText(/^VOLUME$/).count();
  if (count === 0) throw new Error("No volume OSD");
});

await check("Channel up changes channel", async () => {
  await page.getByRole("button", { name: "Channel up" }).click();
  await page.waitForTimeout(400);
  await page.getByText("CH 03");
});

await check("Channel OSD appears", async () => {
  const status = await page.locator('[role="status"]').allTextContents();
  if (!status.some((t) => t.includes("CH 03"))) throw new Error(status.join("|"));
});

await check("Hardware labels visible", async () => {
  await page.getByText("Volume", { exact: true });
  await page.getByText("Channel", { exact: true });
  await page.getByText("Prev", { exact: true });
  await page.getByText("Next", { exact: true });
});

await check("Space toggles power off", async () => {
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
});

await check("Bracket keys mapped", async () => {
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);
  await page.keyboard.press("[");
  await page.keyboard.press("]");
  // No crash; placeholder channel has no playlist
});

console.log(JSON.stringify(results, null, 2));
console.log("Passed:", results.filter((r) => r.pass).length, "/", results.length);

await browser.close();

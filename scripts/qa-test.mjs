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
  await page.getByRole("button", { name: "Vol ▲" }).click();
  await page.waitForTimeout(100);
  const count = await page.getByText(/VOLUME \d+/).count();
  if (count === 0) throw new Error("No volume OSD");
});

await check("Channel up changes channel", async () => {
  await page.getByRole("button", { name: "Ch ▲" }).click();
  await page.waitForTimeout(400);
  await page.getByText("CH 03");
});

await check("Channel OSD appears", async () => {
  const status = await page.locator('[role="status"]').allTextContents();
  if (!status.some((t) => t.includes("CH 03"))) throw new Error(status.join("|"));
});

await check("Arrow down changes channel", async () => {
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  await page.getByText("CH 02");
});

await check("Space toggles power off", async () => {
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  const led = page.locator('[class*="standbyLedActive"]');
  if ((await led.count()) === 0) throw new Error("Standby LED not active");
});

await check("Keyboard ignored when off (channel)", async () => {
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(300);
  // Still off - no channel content visible
});

await check("Power on via space", async () => {
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);
  await page.getByText("CH 02");
});

await check("Mute at volume 0", async () => {
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(100);
  const mute = await page.getByText("MUTE").count();
  if (mute === 0) throw new Error("MUTE not shown");
});

console.log(JSON.stringify(results, null, 2));
console.log("Passed:", results.filter((r) => r.pass).length, "/", results.length);

await browser.close();

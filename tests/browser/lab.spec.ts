import { test, expect, type Page } from "@playwright/test";
async function ready(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
}
async function changeRange(page: Page, name: string, value: number) {
  const input = page.getByRole("slider", { name, exact: true });
  await input.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(el, String(v));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(input).toHaveValue(String(value));
  await page.waitForTimeout(120);
}
async function pixels(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas")!;
    const gl = canvas.getContext("webgl2")!;
    const buffer = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      buffer,
    );
    const root = canvas.getBoundingClientRect();
    const values: Record<string, number[]> = {};
    for (const cell of document.querySelectorAll<HTMLElement>("[data-model]")) {
      const r = cell.getBoundingClientRect();
      const x = Math.round(
          ((r.left + r.width / 2 - root.left) / root.width) * canvas.width,
        ),
        y = Math.round(
          ((root.bottom - (r.top + r.height / 2)) / root.height) *
            canvas.height,
        );
      let count = 0;
      const sums = [0, 0, 0];
      for (let dy = -10; dy <= 10; dy++)
        for (let dx = -10; dx <= 10; dx++) {
          const offset = ((y + dy) * canvas.width + x + dx) * 4;
          sums[0] += buffer[offset];
          sums[1] += buffer[offset + 1];
          sums[2] += buffer[offset + 2];
          count++;
        }
      values[cell.dataset.model!] = sums.map((v) => v / count);
    }
    return values;
  });
}
test("real WebGL, shared parameter changes, and independent backgrounds", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await ready(page);
  const initial = await pixels(page);
  expect(Object.keys(initial)).toHaveLength(4);
  for (const value of Object.values(initial))
    expect(value.reduce((a, b) => a + b, 0)).toBeGreaterThan(60);
  await page.screenshot({
    path: info.outputPath("desktop-compare-en.png"),
    fullPage: true,
  });
  await page.getByLabel("Environment light on", { exact: true }).uncheck();
  await page.waitForTimeout(150);
  const before = await pixels(page);
  await page.getByLabel("Background", { exact: true }).selectOption("sunset");
  await page.waitForTimeout(150);
  const backgroundOnly = await pixels(page);
  expect(backgroundOnly).toEqual(before);
  await page.getByLabel("Environment light on", { exact: true }).check();
  await page.waitForTimeout(150);
  expect(await pixels(page)).not.toEqual(before);
  await changeRange(page, "Roughness · PBR", 0.8);
  expect((await pixels(page)).pbr).not.toEqual(initial.pbr);
  await page.getByRole("button", { name: "Move light", exact: true }).click();
  const a = await page.getByTestId("render-host").getAttribute("data-frames");
  await page.waitForTimeout(500);
  const b = await page.getByTestId("render-host").getAttribute("data-frames");
  expect(Number(b)).toBeGreaterThan(Number(a));
  await page.getByRole("button", { name: "Pause light", exact: true }).click();
  await page.getByRole("button", { name: "Reset all", exact: true }).click();
  await page.getByRole("button", { name: "Metal", exact: true }).click();
  await page.getByRole("button", { name: "Diffuse", exact: true }).click();
  await page.waitForTimeout(150);
  const diffuse = await pixels(page);
  expect(diffuse.pbr.every((v) => v === 0)).toBe(true);
  expect(diffuse.lambert.reduce((a, b) => a + b, 0)).toBeGreaterThan(60);
  await page.screenshot({
    path: info.outputPath("metal-diffuse.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Specular", exact: true }).click();
  await page.waitForTimeout(150);
  expect((await pixels(page)).lambert.every((v) => v === 0)).toBe(true);
  await page.getByRole("button", { name: "Combined", exact: true }).click();
  await page.getByRole("button", { name: "Single", exact: true }).click();
  await page
    .getByLabel("Reflection model", { exact: true })
    .selectOption("pbr");
  await page.getByLabel("Shape", { exact: true }).selectOption("knot");
  await page.getByTestId("render-host").focus();
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(150);
  await page.screenshot({
    path: info.outputPath("single-metal-knot.png"),
    fullPage: true,
  });
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save render PNG", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "shader-history-render.png",
  );
  expect(errors).toEqual([]);
});
test("guide, Japanese, repeated tab switches, and phone layout", async ({
  page,
}, info) => {
  await ready(page);
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A history of better questions." }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("guide-en.png"),
    fullPage: true,
  });
  await expect(
    page.getByRole("link", { name: /Bui Tuong Phong/ }),
  ).toHaveAttribute("href", /Phong_1975/);
  await page.getByRole("slider", { name: "Diagram light angle" }).press("Home");
  await page.getByRole("button", { name: "日本語", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "光の表現を、問いからたどる。" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("guide-ja.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await page
    .getByRole("button", { name: "Lab で試す", exact: false })
    .first()
    .click();
  await expect(page.getByLabel("反射モデル")).toHaveValue("lambert");
  await page.getByRole("button", { name: "比較", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("mobile-ja.png"),
    fullPage: true,
  });
  await page.getByLabel("背景", { exact: true }).selectOption("sky");
  await page.getByLabel("背景と照明環境を連動").check();
  await expect(page.getByLabel("照明環境", { exact: true })).toHaveValue("sky");
  await page.getByLabel("照明環境", { exact: true }).selectOption("sunset");
  await expect(page.getByLabel("背景", { exact: true })).toHaveValue("sunset");
  await page.getByRole("button", { name: "すべてリセット" }).click();
  await expect(page.getByLabel("背景と照明環境を連動")).not.toBeChecked();
  await expect(page.getByLabel("背景", { exact: true })).toHaveValue("dark");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

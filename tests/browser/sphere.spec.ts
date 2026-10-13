import { test, expect, type Page } from "@playwright/test";

async function completedPixels(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas")!;
    const gl = canvas.getContext("webgl2")!;
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 100) lit++;
    return {
      lit,
      width: canvas.width,
      height: canvas.height,
      error: gl.getError(),
    };
  });
}
async function afterChange(page: Page, action: () => Promise<unknown>) {
  const host = page.getByTestId("render-host");
  const frame = Number(await host.getAttribute("data-frames"));
  await action();
  await expect
    .poll(async () => Number(await host.getAttribute("data-frames")))
    .toBeGreaterThan(frame);
  expect((await completedPixels(page)).error).toBe(0);
}
async function range(page: Page, name: string, value: number) {
  const input = page.getByRole("slider", { name, exact: true });
  await afterChange(page, () =>
    input.evaluate((el, value) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(el, String(value));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value),
  );
  await expect(input).toHaveValue(String(value));
}

test("sphere reflections at low roughness, rotated environment, and polar view", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await completedPixels(page);
  await afterChange(page, () =>
    page.getByRole("button", { name: "Metal", exact: true }).click(),
  );
  await afterChange(page, () =>
    page.getByRole("button", { name: "Single", exact: true }).click(),
  );
  await expect(
    page.getByLabel("Reflection model", { exact: true }),
  ).toHaveValue("pbr");
  await range(page, "Intensity", 0);
  await range(page, "Roughness · PBR", 0.08);
  expect((await completedPixels(page)).lit).toBeGreaterThan(1000);
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("sphere-studio-gloss.png") });
  await range(page, "Roughness · PBR", 0.35);
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("sphere-studio-rough.png") });
  await range(page, "Environment rotation", 115);
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("sphere-environment-rotated.png") });
  await range(page, "Roughness · PBR", 0.08);
  await page.getByTestId("render-host").focus();
  for (let i = 0; i < 14; i++)
    await afterChange(page, () => page.keyboard.press("ArrowDown"));
  expect((await completedPixels(page)).lit).toBeGreaterThan(1000);
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("sphere-polar-view.png") });
  for (let i = 0; i < 6; i++)
    await afterChange(page, () => page.keyboard.press("ArrowUp"));
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("sphere-oblique-view.png") });
  await afterChange(page, () =>
    page.setViewportSize({ width: 390, height: 844 }),
  );
  expect((await completedPixels(page)).lit).toBeGreaterThan(1000);
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("sphere-mobile-gloss.png") });
  await afterChange(page, () =>
    page.setViewportSize({ width: 1536, height: 1024 }),
  );
  await page.getByTestId("render-host").focus();
  for (let i = 0; i < 6; i++)
    await afterChange(page, () => page.keyboard.press("ArrowDown"));
  await afterChange(page, () =>
    page.getByLabel("Environment light on", { exact: true }).uncheck(),
  );
  await range(page, "Intensity", 3);
  await range(page, "Azimuth", 0);
  await range(page, "Elevation", 80);
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("sphere-direct-polar.png") });
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-mode",
    "compare",
  );
  await completedPixels(page);
  await expect(page.locator("[data-model]")).toHaveCount(4);
  expect(errors).toEqual([]);
});

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
  await range(page, "Environment intensity", 1.2);
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

async function centerColor(page: Page) {
  await completedPixels(page);
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas")!;
    const gl = canvas.getContext("webgl2")!;
    const pixels = new Uint8Array(9 * 9 * 4);
    gl.readPixels(
      Math.floor(canvas.width / 2) - 4,
      Math.floor(canvas.height / 2) - 4,
      9,
      9,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );
    const sum = [0, 0, 0];
    for (let i = 0; i < pixels.length; i += 4)
      for (let c = 0; c < 3; c++) sum[c] += pixels[i + c];
    return sum.map((x) => x / 81);
  });
}

test("Lambert environment irradiance on a fixed flat face is camera invariant", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await completedPixels(page);
  await afterChange(page, () =>
    page.getByRole("button", { name: "Single", exact: true }).click(),
  );
  await afterChange(page, () =>
    page
      .getByLabel("Reflection model", { exact: true })
      .selectOption("lambert"),
  );
  await afterChange(page, () =>
    page.getByLabel("Shape", { exact: true }).selectOption("cube"),
  );
  // Keep this pre-existing invariance fixture independent of the UI default color.
  await afterChange(page, () =>
    page.getByLabel("Base color", { exact: true }).evaluate((el) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(el, "#ce9458");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }),
  );
  await range(page, "Intensity", 0);
  for (const environment of ["studio", "sky", "sunset"]) {
    await afterChange(page, () =>
      page
        .getByLabel("Lighting environment", { exact: true })
        .selectOption(environment),
    );
    await afterChange(page, () =>
      page.getByRole("button", { name: "Reset view", exact: true }).click(),
    );
    const initial = await centerColor(page);
    expect(initial.reduce((a, b) => a + b, 0)).toBeGreaterThan(60);
    await page.getByTestId("render-host").focus();
    // The central rays stay on the same flat front face, away from rounded edges.
    for (const key of [
      "ArrowLeft",
      "ArrowLeft",
      "ArrowLeft",
      "ArrowLeft",
      "ArrowDown",
      "ArrowDown",
    ]) {
      await afterChange(page, () => page.keyboard.press(key));
      const moved = await centerColor(page);
      for (let c = 0; c < 3; c++)
        expect(Math.abs(moved[c] - initial[c])).toBeLessThanOrEqual(1);
    }
  }
  expect(errors).toEqual([]);
});

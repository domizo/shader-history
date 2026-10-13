import { test, expect, type Page } from "@playwright/test";

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
    const center =
      (Math.floor(canvas.height / 2) * canvas.width +
        Math.floor(canvas.width / 2)) *
      4;
    let lit = 0;
    for (let i = 0; i < buffer.length; i += 4)
      if (buffer[i] + buffer[i + 1] + buffer[i + 2] > 80) lit++;
    return {
      center: Array.from(buffer.slice(center, center + 3)),
      lit,
      error: gl.getError(),
    };
  });
}
async function change(page: Page, action: () => Promise<unknown>) {
  const host = page.getByTestId("render-host"),
    before = Number(await host.getAttribute("data-frames"));
  await action();
  await expect
    .poll(async () => Number(await host.getAttribute("data-frames")))
    .toBeGreaterThan(before);
  expect((await pixels(page)).error).toBe(0);
}
async function range(page: Page, name: string, value: number) {
  await change(page, () =>
    page.getByRole("slider", { name, exact: true }).evaluate((el, value) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(el, String(value));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value),
  );
}
async function ready(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await pixels(page);
}
async function single(page: Page, model = "phong") {
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-mode",
    "single",
  );
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-selected-model",
    model,
  );
  await expect(page.locator("[data-model]")).toHaveCount(1);
}

test("teapot materials and ordinary controls preserve Single and the selected shader", async ({
  page,
}, info) => {
  test.setTimeout(300000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await ready(page);
  await expect(page.getByLabel("Base color", { exact: true })).toHaveValue(
    "#0061ff",
  );
  await change(page, () =>
    page.getByRole("button", { name: "Single", exact: true }).click(),
  );
  await change(page, () =>
    page.getByLabel("Reflection model", { exact: true }).selectOption("phong"),
  );
  await change(page, () =>
    page.getByLabel("Shape", { exact: true }).selectOption("teapot"),
  );
  for (let repeat = 0; repeat < 2; repeat++)
    for (const preset of ["Metal", "Rough", "Plastic"]) {
      await change(page, () =>
        page.getByRole("button", { name: preset, exact: true }).click(),
      );
      await single(page);
      await expect(page.getByLabel("Shape", { exact: true })).toHaveValue(
        "teapot",
      );
    }
  for (const experiment of [
    "Where highlights begin",
    "What makes a metal?",
    "Spread the reflection",
    "Background is not light",
  ]) {
    await change(page, () =>
      page.getByRole("button", { name: experiment, exact: true }).click(),
    );
    await single(page);
    await expect(page.getByLabel("Shape", { exact: true })).toHaveValue(
      "teapot",
    );
  }
  await change(page, () =>
    page.getByRole("button", { name: "Reset settings", exact: true }).click(),
  );
  await single(page);
  for (const [label, value] of [
    ["Intensity", 2],
    ["Azimuth", 20],
    ["Elevation", 30],
    ["Exposure", 0.5],
    ["Environment intensity", 0.8],
    ["Environment rotation", 40],
  ] as const) {
    await range(page, label, value);
    await single(page);
  }
  for (const [label, value] of [
    ["Lighting environment", "sky"],
    ["Background", "sunset"],
    ["Shape", "sphere"],
    ["Shape", "teapot"],
  ]) {
    await change(page, () =>
      page.getByLabel(label, { exact: true }).selectOption(value),
    );
    await single(page);
  }
  for (const label of [
    "ACES tone mapping",
    "Environment light on",
    "Link background & environment",
  ]) {
    await change(page, () => page.getByLabel(label, { exact: true }).click());
    await single(page);
  }
  for (const component of ["Diffuse", "Specular", "Combined"]) {
    await change(page, () =>
      page.getByRole("button", { name: component, exact: true }).click(),
    );
    await single(page);
  }
  await page.getByTestId("render-host").focus();
  await change(page, () => page.keyboard.press("ArrowLeft"));
  await single(page);
  await change(page, () =>
    page.getByRole("button", { name: "Reset view", exact: true }).click(),
  );
  await single(page);
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await single(page);
  await pixels(page);
  await change(page, () =>
    page.getByRole("button", { name: "Reset settings", exact: true }).click(),
  );
  await single(page);
  await change(page, () =>
    page.getByLabel("Reflection model", { exact: true }).selectOption("pbr"),
  );
  await change(page, () =>
    page.getByRole("button", { name: "Plastic", exact: true }).click(),
  );
  await single(page, "pbr");
  expect((await pixels(page)).lit).toBeGreaterThan(1000);
  await page.screenshot({
    path: info.outputPath("teapot-blue-single.png"),
    fullPage: true,
  });
  await change(page, () =>
    page.getByRole("button", { name: "Metal", exact: true }).click(),
  );
  await range(page, "Roughness · PBR", 0.12);
  await range(page, "Environment intensity", 1.2);
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("teapot-metal.png") });
  await page.getByTestId("render-host").focus();
  for (let i = 0; i < 8; i++)
    await change(page, () => page.keyboard.press("ArrowDown"));
  for (let i = 0; i < 8; i++)
    await change(page, () => page.keyboard.press("ArrowRight"));
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("teapot-spout-lid.png") });
  for (let i = 0; i < 16; i++)
    await change(page, () => page.keyboard.press("ArrowUp"));
  await page
    .getByTestId("webgl-canvas")
    .screenshot({ path: info.outputPath("teapot-underside.png") });
  await change(page, () =>
    page.getByRole("button", { name: "Reset view", exact: true }).click(),
  );
  await change(page, () =>
    page.getByRole("button", { name: "Reset settings", exact: true }).click(),
  );
  await single(page, "pbr");
  await change(page, () =>
    page.getByRole("button", { name: "Compare", exact: true }).click(),
  );
  await expect(page.locator("[data-model]")).toHaveCount(4);
  await page.screenshot({
    path: info.outputPath("teapot-blue-compare.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "日本語", exact: true }).click();
  await change(page, () => page.setViewportSize({ width: 390, height: 844 }));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await pixels(page)).lit).toBeGreaterThan(1000);
  await page.screenshot({
    path: info.outputPath("teapot-mobile-ja.png"),
    fullPage: true,
  });
  await change(page, () =>
    page.getByRole("button", { name: "単体", exact: true }).click(),
  );
  await change(page, () =>
    page.getByRole("button", { name: "金属", exact: true }).click(),
  );
  await single(page, "pbr");
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("sRGB output stays active with ACES off and exposure is applied once", async ({
  page,
}, info) => {
  await ready(page);
  await change(page, () =>
    page.getByRole("button", { name: "Single", exact: true }).click(),
  );
  await change(page, () =>
    page
      .getByLabel("Reflection model", { exact: true })
      .selectOption("lambert"),
  );
  await change(page, () =>
    page.getByLabel("Shape", { exact: true }).selectOption("cube"),
  );
  await change(page, () =>
    page.getByLabel("Environment light on", { exact: true }).uncheck(),
  );
  await range(page, "Azimuth", 0);
  await range(page, "Elevation", 0);
  await change(page, () =>
    page.getByLabel("ACES tone mapping", { exact: true }).uncheck(),
  );
  const linearGreen = ((97 / 255 + 0.055) / 1.055) ** 2.4;
  const encode = (x: number) =>
    255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  for (const exposure of [0, -1, 1]) {
    await range(page, "Exposure", exposure);
    const gain =
      ((Math.cos(0.12) * Math.cos(0.35) * 3) / Math.PI) * 2 ** exposure;
    const expected = [
      0,
      encode(Math.min(1, linearGreen * gain)),
      encode(Math.min(1, gain)),
    ];
    const actual = (await pixels(page)).center;
    for (let i = 0; i < 3; i++)
      expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(1.5);
    await expect(page.getByTestId("render-host")).toHaveAttribute(
      "data-output-color-space",
      "srgb",
    );
    await single(page, "lambert");
  }
  await range(page, "Exposure", 0);
  const noTone = (await pixels(page)).center;
  await page.screenshot({
    path: info.outputPath("blue-srgb-no-tone-map.png"),
    fullPage: true,
  });
  await change(page, () =>
    page.getByLabel("ACES tone mapping", { exact: true }).check(),
  );
  expect((await pixels(page)).center).not.toEqual(noTone);
  await expect(page.getByTestId("render-host")).toHaveAttribute(
    "data-output-color-space",
    "srgb",
  );
  await expect(page.getByLabel("Base color", { exact: true })).toHaveValue(
    "#0061ff",
  );
  await page.screenshot({
    path: info.outputPath("blue-srgb-aces.png"),
    fullPage: true,
  });
});

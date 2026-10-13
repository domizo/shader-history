import { describe, expect, it } from "vitest";
import { Color, SRGBColorSpace, LinearSRGBColorSpace } from "three";
import {
  defaults,
  applyMaterialPreset,
  applyExperiment,
  updateSetting,
  resetSettings,
  experiments,
  models,
  type Settings,
} from "../src/state";

describe("view-preserving settings and requested blue", () => {
  it("decodes #0061ff exactly once to linear and round-trips to sRGB", () => {
    expect(defaults.color).toBe("#0061ff");
    expect(defaults.toneMapping).toBe(true);
    const c = new Color(defaults.color);
    expect(c.r).toBe(0);
    expect(c.b).toBe(1);
    const green = 97 / 255;
    expect(c.g).toBeCloseTo(((green + 0.055) / 1.055) ** 2.4, 7);
    expect(c.getHexString(SRGBColorSpace)).toBe("0061ff");
    expect(c.getHexString(LinearSRGBColorSpace)).not.toBe("0061ff");
  });
  for (const mode of ["single", "compare"] as const)
    for (const model of models) {
      it(`preserves ${mode}/${model} through presets, experiments, reset and controls`, () => {
        const start: Settings = {
          ...defaults,
          mode,
          model,
          geometry: "teapot",
          background: "sky",
          lightIntensity: 1.7,
        };
        for (const preset of ["plastic", "metal", "rough"] as const) {
          const next = applyMaterialPreset(start, preset);
          expect([next.mode, next.model, next.geometry]).toEqual([
            mode,
            model,
            "teapot",
          ]);
          expect(next.background).toBe("sky");
          expect(next.lightIntensity).toBe(1.7);
          expect(next.color).toBe(preset === "metal" ? "#dca55b" : "#0061ff");
        }
        for (const experiment of experiments) {
          const next = applyExperiment(start, experiment.id);
          expect([next.mode, next.model, next.geometry]).toEqual([
            mode,
            model,
            "teapot",
          ]);
        }
        const reset = resetSettings(start);
        expect([reset.mode, reset.model, reset.geometry]).toEqual([
          mode,
          model,
          "teapot",
        ]);
        expect(reset.color).toBe("#0061ff");
        expect(reset.toneMapping).toBe(true);
        for (const key of Object.keys(defaults) as (keyof Settings)[]) {
          if (key === "mode" || key === "model") continue;
          const next = updateSetting(start, key, defaults[key]);
          expect([next.mode, next.model]).toEqual([mode, model]);
        }
      });
    }
  it("keeps background linking explicit without navigating", () => {
    const start: Settings = { ...defaults, mode: "single", model: "phong" };
    const linked = updateSetting(
      updateSetting(start, "background", "sky"),
      "linkBackground",
      true,
    );
    expect(linked.environment).toBe("sky");
    const changed = updateSetting(linked, "environment", "sunset");
    expect(changed.background).toBe("sunset");
    expect(changed.mode).toBe("single");
    expect(changed.model).toBe("phong");
  });
});

import { describe, it, expect } from "vitest";
import { Color } from "three";
import {
  classicLobe,
  dot,
  fresnel,
  ggxBRDF,
  ggxD,
  iorToF0,
  linearToSrgb,
  normalize,
  smithG1,
  srgbToLinear,
  type V3,
} from "../src/brdf";
import { defaults, experiments } from "../src/state";
import { fragment, backgroundFragment } from "../src/shaders";
const n: V3 = [0, 0, 1];
describe("linear light and Fresnel", () => {
  it("converts sRGB once and agrees with Three.js r180", () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.21404114, 7);
    expect(new Color("#808080").r).toBeCloseTo(srgbToLinear(128 / 255), 7);
  });
  it("roundtrips sRGB including piecewise boundary", () => {
    for (const v of [0, 0.02, 0.04045, 0.1, 0.5, 1])
      expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 5);
  });
  it("IOR 1.5 has normal dielectric reflectance 0.04", () => {
    expect(iorToF0(1.5)).toBeCloseTo(0.04);
    expect(iorToF0(1)).toBe(0);
  });
  it("Fresnel equals F0 at normal and one at grazing", () => {
    for (const f0 of [0, 0.04, 0.8, 1]) {
      expect(fresnel(1, f0)).toBe(f0);
      expect(fresnel(0, f0)).toBe(1);
    }
  });
  it("Fresnel remains bounded", () => {
    for (let i = 0; i <= 100; i++) {
      const f = fresnel(i / 100, 0.04);
      expect(f).toBeGreaterThanOrEqual(0.04);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
});
describe("GGX and Smith", () => {
  it("D projected integral is one", () => {
    for (const r of [0.3, 0.6, 1]) {
      let total = 0;
      const count = 100000;
      for (let i = 0; i < count; i++) {
        const c = (i + 0.5) / count;
        total += (ggxD(c, r) * c * 2 * Math.PI) / count;
      }
      expect(total).toBeCloseTo(1, 4);
    }
  });
  it("G is bounded and eliminates back-facing directions", () => {
    for (const r of [0.08, 0.3, 1])
      for (let i = 0; i <= 100; i++) {
        const g = smithG1(i / 100, r);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(1);
      }
    expect(smithG1(-1, 0.5)).toBe(0);
  });
  it("BRDF satisfies reciprocity", () => {
    for (const r of [0.08, 0.3, 0.8]) {
      const l = normalize([0.4, 0.2, 1]),
        v = normalize([-0.2, 0.5, 1]);
      expect(ggxBRDF(n, l, v, r, 0.04)).toBeCloseTo(
        ggxBRDF(n, v, l, r, 0.04),
        12,
      );
    }
  });
  it("BRDF is finite at the supported roughness extremes and grazing", () => {
    for (const r of [0.08, 0.4, 1])
      for (const z of [0.000001, 0.01, 0.5, 1]) {
        const v = normalize([1, 0, z]);
        const f = ggxBRDF(n, n, v, r, 0.04);
        expect(Number.isFinite(f)).toBe(true);
        expect(f).toBeGreaterThanOrEqual(0);
      }
  });
  it("BRDF excludes incoming or outgoing below the surface", () => {
    expect(ggxBRDF(n, [0, 0, -1], n, 0.4, 0.04)).toBe(0);
    expect(ggxBRDF(n, n, [0, 0, -1], 0.4, 0.04)).toBe(0);
  });
  it("single scattering metal does not reflect more than unit incident energy at normal view", () => {
    for (const r of [0.2, 0.5, 1]) {
      let energy = 0;
      const count = 100000;
      for (let i = 0; i < count; i++) {
        const c = (i + 0.5) / count;
        energy +=
          (ggxBRDF(n, [Math.sqrt(1 - c * c), 0, c], n, r, 1) *
            c *
            2 *
            Math.PI) /
          count;
      }
      expect(energy).toBeLessThanOrEqual(1.0002);
      expect(energy).toBeGreaterThan(0);
    }
  });
});
describe("educational invariants", () => {
  it("Lambert integrates to its albedo", () => {
    const rho = 0.4;
    let energy = 0;
    for (let i = 0; i < 1000; i++) {
      const c = (i + 0.5) / 1000;
      energy += ((rho / Math.PI) * c * 2 * Math.PI) / 1000;
    }
    expect(energy).toBeCloseTo(rho, 8);
  });
  it("classic exponents control lobe width and reject the back lobe", () => {
    expect(classicLobe(0.8, 64, "phong")).toBeLessThan(
      classicLobe(0.8, 8, "phong"),
    );
    expect(classicLobe(-0.5, 4, "blinn")).toBe(0);
  });
  it("Blinn 4× is an approximation, never presented as equality", () => {
    expect(classicLobe(Math.cos(0.8), 32, "phong")).not.toBeCloseTo(
      classicLobe(Math.cos(0.4), 128, "blinn"),
      7,
    );
  });
  it("background and light are independent by default", () => {
    expect(defaults.linkBackground).toBe(false);
    expect(defaults.background).toBe("dark");
    expect(defaults.environment).toBe("studio");
    const demo = experiments.find((e) => e.id === "environment")!;
    expect(demo.values.background).toBe("sunset");
    expect(demo.values.environmentEnabled).toBe(false);
  });
  it("half vector bisects unit light and view directions", () => {
    const l = normalize([0.2, 0.3, 1]),
      v = normalize([-0.6, 0.1, 1]);
    const h = normalize([l[0] + v[0], l[1] + v[1], l[2] + v[2]]);
    expect(dot(l, h)).toBeCloseTo(dot(v, h), 12);
  });
  it("all shader output uses one tone map and one output conversion", () => {
    for (const shader of [fragment, backgroundFragment]) {
      expect(shader.match(/#include <tonemapping_fragment>/g)).toHaveLength(1);
      expect(shader.match(/#include <colorspace_fragment>/g)).toHaveLength(1);
      expect(shader.indexOf("#include <tonemapping_fragment>")).toBeLessThan(
        shader.indexOf("#include <colorspace_fragment>"),
      );
    }
    expect(fragment).toContain("#ifdef DOUBLE_SIDED");
    expect(fragment).toContain("N *= gl_FrontFacing ? 1.0 : -1.0;");
    expect(fragment).toContain("diffuse*=(1.-F)*(1.-uMetalness)");
  });
});

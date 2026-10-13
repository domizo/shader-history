import { describe, expect, it } from "vitest";
import { dot, environmentFrames, type V3 } from "../src/brdf";
import { fragment } from "../src/shaders";
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
// Smooth colored directional radiance fixture; not a claimed converged environment.
const irradiance = (n: V3) => {
  const result = [0, 0, 0];
  for (const frame of environmentFrames(n))
    for (let i = 0; i < 24; i++) {
      const x = (i + 0.5) / 24,
        phi = 2 * Math.PI * ((i * 0.618033988749895) % 1),
        r = Math.sqrt(x);
      const local = [r * Math.cos(phi), r * Math.sin(phi), Math.sqrt(1 - x)];
      const l = n.map(
        (_, j) =>
          frame.tangent[j] * local[0] +
          frame.bitangent[j] * local[1] +
          n[j] * local[2],
      );
      const radiance = [Math.exp(2 * l[0]), Math.exp(l[1]), Math.exp(3 * l[2])];
      for (let j = 0; j < 3; j++)
        result[j] += (frame.weight * radiance[j]) / 24;
    }
  return result;
};
describe("world-fixed overlapping environment charts", () => {
  it("is finite and right-handed over the entire sphere, including all poles", () => {
    for (const z of [-1, -0.999, -0.997, -0.995, 0, 0.995, 0.997, 0.999, 1])
      for (let i = 0; i < 72; i++) {
        const phi = (i * Math.PI) / 36;
        const n: V3 = [
          Math.sqrt(1 - z * z) * Math.cos(phi),
          Math.sqrt(1 - z * z) * Math.sin(phi),
          z,
        ];
        const frames = environmentFrames(n);
        expect(frames.length).toBeLessThanOrEqual(2);
        expect(frames.reduce((sum, f) => sum + f.weight, 0)).toBeCloseTo(1, 14);
        for (const f of frames) {
          expect([...f.tangent, ...f.bitangent].every(Number.isFinite)).toBe(
            true,
          );
          expect(dot(f.tangent, n)).toBeCloseTo(0, 12);
          expect(dot(f.tangent, f.tangent)).toBeCloseTo(1, 12);
          expect(dot(cross(f.tangent, f.bitangent), n)).toBeCloseTo(1, 12);
        }
      }
  });
  it("blends integral values continuously across both cap boundaries", () => {
    for (const z of [-0.999, -0.995, 0.995, 0.999])
      for (let i = 0; i < 72; i++) {
        const phi = (i * Math.PI) / 36;
        const pair = [-1e-8, 1e-8].map((delta) => {
          const c = z + delta;
          return irradiance([
            Math.sqrt(1 - c * c) * Math.cos(phi),
            Math.sqrt(1 - c * c) * Math.sin(phi),
            c,
          ]);
        });
        expect(
          Math.max(...pair[0].map((x, j) => Math.abs(x - pair[1][j]))),
        ).toBeLessThan(0.00001);
      }
  });
  it("keeps diffuse charts world-fixed and preserves the per-chart sample counts", () => {
    expect(fragment).not.toContain("viewMatrix");
    expect(fragment).not.toContain("viewRight");
    expect(fragment).toContain("float blend=chartBlend(N)");
    expect(fragment).toContain("vec3 axis=uModel==1?reflect(-V,N):N");
    expect(fragment).toContain("i<24");
    expect(fragment).toContain("i<48");
    expect(fragment).toContain("if(uModel==3)kd*=");
  });
});

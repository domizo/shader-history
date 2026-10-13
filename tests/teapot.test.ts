import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import {
  createUtahTeapot,
  TEAPOT_SEGMENTS,
  SPHERE_RADIUS,
} from "../src/geometry";
const geometry = createUtahTeapot();
const p = geometry.getAttribute("position"),
  n = geometry.getAttribute("normal"),
  indices = geometry.index!;
describe("official Utah teapot patch mesh", () => {
  it("keeps a sphere-comparable triangle budget and centered maximum extent", () => {
    expect(TEAPOT_SEGMENTS).toBe(18);
    expect(indices.count / 3).toBe(20592);
    expect(p.count).toBe(11552);
    const size = geometry.boundingBox!.getSize(new Vector3());
    expect(Math.max(size.x, size.y, size.z)).toBeCloseTo(SPHERE_RADIUS * 2, 6);
    expect(
      geometry.boundingBox!.getCenter(new Vector3()).length(),
    ).toBeLessThan(1e-7);
  });
  it("retains finite unit analytic normals with outward nondegenerate triangles", () => {
    for (let i = 0; i < p.count; i++) {
      const v = new Vector3().fromBufferAttribute(p, i),
        normal = new Vector3().fromBufferAttribute(n, i);
      expect([...v, ...normal].every(Number.isFinite)).toBe(true);
      expect(normal.length()).toBeCloseTo(1, 6);
    }
    for (let i = 0; i < indices.count; i += 3) {
      const ids = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
      const [a, b, c] = ids.map((id) =>
        new Vector3().fromBufferAttribute(p, id),
      );
      const face = b.sub(a).cross(c.sub(a));
      expect(face.length()).toBeGreaterThan(1e-9);
      const average = ids.reduce(
        (v, id) => v.add(new Vector3().fromBufferAttribute(n, id)),
        new Vector3(),
      );
      expect(face.dot(average)).toBeGreaterThan(0);
    }
  });
});

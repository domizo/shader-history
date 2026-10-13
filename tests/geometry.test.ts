import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { createGeodesicSphere, SPHERE_RADIUS } from "../src/geometry";

const sphere = createGeodesicSphere();
const position = sphere.getAttribute("position");
const normal = sphere.getAttribute("normal");
const indices = Array.from(sphere.index!.array);
const points = Array.from({ length: position.count }, (_, i) =>
  new Vector3().fromBufferAttribute(position, i),
);

describe("shared indexed geodesic sphere", () => {
  it("has bounded five-level complexity and no UV seam", () => {
    expect(position.count).toBe(10242);
    expect(indices.length / 3).toBe(20480);
    expect(sphere.index!.array).toBeInstanceOf(Uint16Array);
    expect(sphere.getAttribute("uv")).toBeUndefined();
  });
  it("places every vertex on the sphere with a unit radial smooth normal", () => {
    for (let i = 0; i < position.count; i++) {
      const n = new Vector3().fromBufferAttribute(normal, i);
      expect(points[i].length()).toBeCloseTo(SPHERE_RADIUS, 6);
      expect(n.length()).toBeCloseTo(1, 6);
      expect(n.dot(points[i].clone().normalize())).toBeCloseTo(1, 6);
    }
  });
  it("welds vertices, closes every edge, and has no high-valence pole", () => {
    expect(
      new Set(
        points.map((p) =>
          p
            .toArray()
            .map((x) => x.toFixed(7))
            .join(","),
        ),
      ).size,
    ).toBe(position.count);
    const edges = new Map<string, number>();
    const neighbors = points.map(() => new Set<number>());
    for (let i = 0; i < indices.length; i += 3) {
      const triangle = indices.slice(i, i + 3);
      for (let j = 0; j < 3; j++) {
        const a = triangle[j],
          b = triangle[(j + 1) % 3];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
        neighbors[a].add(b);
        neighbors[b].add(a);
      }
    }
    expect([...edges.values()].every((n) => n === 2)).toBe(true);
    expect(position.count - edges.size + indices.length / 3).toBe(2);
    expect(neighbors.filter((n) => n.size === 5)).toHaveLength(12);
    expect(neighbors.filter((n) => n.size === 6)).toHaveLength(
      position.count - 12,
    );
  });
  it("has outward nondegenerate triangles with closely bounded area and aspect", () => {
    let minArea = Infinity,
      maxArea = 0,
      maxAspect = 0,
      maxSag = 0;
    for (let i = 0; i < indices.length; i += 3) {
      const [a, b, c] = indices.slice(i, i + 3).map((j) => points[j]);
      const cross = b.clone().sub(a).cross(c.clone().sub(a));
      const area = cross.length() / 2;
      expect(cross.dot(a)).toBeGreaterThan(0);
      expect(Number.isFinite(area)).toBe(true);
      minArea = Math.min(minArea, area);
      maxArea = Math.max(maxArea, area);
      const lengths = [a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)];
      maxAspect = Math.max(
        maxAspect,
        Math.max(...lengths) / Math.min(...lengths),
      );
      maxSag = Math.max(
        maxSag,
        SPHERE_RADIUS - a.clone().add(b).add(c).divideScalar(3).length(),
      );
    }
    expect(minArea).toBeGreaterThan(0);
    expect(maxArea / minArea).toBeLessThan(1.4);
    expect(maxAspect).toBeLessThan(1.3);
    expect(maxSag / SPHERE_RADIUS).toBeLessThan(0.0005);
  });
  it("has deterministic buffers and rejects excessive or invalid inputs", () => {
    const again = createGeodesicSphere();
    expect(Array.from(again.index!.array)).toEqual(indices);
    expect(Array.from(again.getAttribute("position").array)).toEqual(
      Array.from(position.array),
    );
    again.dispose();
    for (const radius of [0, -1, NaN, Infinity])
      expect(() => createGeodesicSphere(radius)).toThrow(RangeError);
    for (const levels of [-1, 1.5, 7, NaN])
      expect(() => createGeodesicSphere(1, levels)).toThrow(RangeError);
  });
});

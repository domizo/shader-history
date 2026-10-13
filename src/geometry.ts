import { TeapotGeometry } from "three/addons/geometries/TeapotGeometry.js";
import { BufferGeometry, Float32BufferAttribute } from "three";

export const SPHERE_RADIUS = 0.85;
export const SPHERE_SUBDIVISIONS = 5;

/** Indexed geodesic sphere; recursive midpoint subdivision, not Three's detail parameter. */
export function createGeodesicSphere(
  radius = SPHERE_RADIUS,
  subdivisions = SPHERE_SUBDIVISIONS,
): BufferGeometry {
  if (!Number.isFinite(radius) || radius <= 0)
    throw new RangeError("Sphere radius must be finite and positive");
  if (!Number.isInteger(subdivisions) || subdivisions < 0 || subdivisions > 6)
    throw new RangeError("Sphere subdivisions must be an integer from 0 to 6");

  const phi = (1 + Math.sqrt(5)) / 2;
  const vertices: number[][] = [];
  for (const [a, b] of [
    [-1, -phi],
    [-1, phi],
    [1, -phi],
    [1, phi],
  ]) {
    vertices.push([0, a, b], [a, b, 0], [b, 0, a]);
  }
  for (const v of vertices) {
    const length = Math.hypot(...v);
    for (let i = 0; i < 3; i++) v[i] /= length;
  }
  // Discover the twenty outward faces from the twelve mathematical vertices.
  // Every edge of a unit icosahedron has the same length.
  const edge = 2 / Math.sqrt(1 + phi * phi);
  const adjacent = (a: number, b: number) =>
    Math.abs(
      Math.hypot(...vertices[a].map((x, i) => x - vertices[b][i])) - edge,
    ) < 1e-8;
  let faces: number[] = [];
  for (let a = 0; a < 12; a++)
    for (let b = a + 1; b < 12; b++)
      for (let c = b + 1; c < 12; c++) {
        if (!adjacent(a, b) || !adjacent(b, c) || !adjacent(c, a)) continue;
        const p = vertices[a],
          q = vertices[b],
          r = vertices[c];
        const u = q.map((x, i) => x - p[i]),
          v = r.map((x, i) => x - p[i]);
        const outward =
          p[0] * (u[1] * v[2] - u[2] * v[1]) +
          p[1] * (u[2] * v[0] - u[0] * v[2]) +
          p[2] * (u[0] * v[1] - u[1] * v[0]);
        faces.push(...(outward > 0 ? [a, b, c] : [a, c, b]));
      }
  for (let level = 0; level < subdivisions; level++) {
    const shared = new Map<string, number>();
    const midpoint = (a: number, b: number) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const existing = shared.get(key);
      if (existing !== undefined) return existing;
      const v = vertices[a].map((x, i) => x + vertices[b][i]);
      const length = Math.hypot(...v);
      const index = vertices.length;
      vertices.push(v.map((x) => x / length));
      shared.set(key, index);
      return index;
    };
    const next: number[] = [];
    for (let i = 0; i < faces.length; i += 3) {
      const [a, b, c] = faces.slice(i, i + 3);
      const ab = midpoint(a, b),
        bc = midpoint(b, c),
        ca = midpoint(c, a);
      next.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
    }
    faces = next;
  }
  const normals = vertices.flat();
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      normals.map((x) => x * radius),
      3,
    ),
  );
  // Analytic radial normals avoid face averaging, UV seams, and duplicate-vertex creases.
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setIndex(faces);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

// Official Three.js Utah teapot (Martin Newell patch data). Keep analytic patch
// normals and seams: welding/recomputing normals would erase intended joins.
export const TEAPOT_SEGMENTS = 18;
export function createUtahTeapot() {
  const geometry = new TeapotGeometry(
    1,
    TEAPOT_SEGMENTS,
    true,
    true,
    true,
    true,
    true,
  );
  geometry.center();
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox!;
  const extent = Math.max(
    bounds.max.x - bounds.min.x,
    bounds.max.y - bounds.min.y,
    bounds.max.z - bounds.min.z,
  );
  // Match the sphere's 1.7-unit maximum extent without changing camera/light.
  geometry.scale(
    (2 * SPHERE_RADIUS) / extent,
    (2 * SPHERE_RADIUS) / extent,
    (2 * SPHERE_RADIUS) / extent,
  );
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

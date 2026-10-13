// CPU reference for the shader formulas and denominator guards, evaluated in JS double precision.
// GPU float precision and finite environment sampling are tested separately.
export type V3 = [number, number, number];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export function normalize(a: V3): V3 {
  const m = Math.hypot(...a);
  return m > 1e-10 ? (a.map((v) => v / m) as V3) : [0, 0, 0];
}
export function fresnel(cosine: number, f0: number) {
  return f0 + (1 - f0) * Math.pow(1 - Math.min(1, Math.max(0, cosine)), 5);
}
export function iorToF0(ior: number) {
  return Math.pow((ior - 1) / (ior + 1), 2);
}
export function ggxD(nh: number, roughness: number) {
  const a = Math.max(roughness * roughness, 0.0025);
  const a2 = a * a;
  const d = nh * nh * (a2 - 1) + 1;
  return a2 / (Math.PI * d * d);
}
export function smithG1(nx: number, roughness: number) {
  if (nx <= 0) return 0;
  const a = Math.max(roughness * roughness, 0.0025);
  return (
    (2 * nx) / Math.max(nx + Math.sqrt(a * a + (1 - a * a) * nx * nx), 0.000001)
  );
}
export function ggxBRDF(n: V3, l: V3, v: V3, roughness: number, f0: number) {
  const nl = dot(n, l),
    nv = dot(n, v);
  if (nl <= 0 || nv <= 0) return 0;
  const h = normalize([l[0] + v[0], l[1] + v[1], l[2] + v[2]]);
  const nh = Math.max(0, dot(n, h)),
    vh = Math.max(0, dot(v, h));
  return (
    (ggxD(nh, roughness) *
      smithG1(nl, roughness) *
      smithG1(nv, roughness) *
      fresnel(vh, f0)) /
    Math.max(4 * nl * nv, 0.000001)
  );
}
export function srgbToLinear(x: number) {
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
export function linearToSrgb(x: number) {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}
export function classicLobe(
  cosine: number,
  n: number,
  model: "phong" | "blinn",
  scaled = false,
) {
  const scale = scaled
    ? model === "phong"
      ? (n + 2) / (2 * Math.PI)
      : (n + 8) / (8 * Math.PI)
    : 1;
  return scale * Math.pow(Math.max(0, cosine), n);
}

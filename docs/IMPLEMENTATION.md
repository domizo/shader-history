# Implementation and comparison contract

## Shared conditions

Every comparison cell renders the same BufferGeometry with the same PerspectiveCamera orientation, distance, directional-light direction/intensity, color input, environment radiance function, exposure, and color pipeline. Each cell has its own viewport with the same aspect ratio. The material ID is the intentional difference. The renderer uses one canvas/context and scissor viewports. Camera drag, zoom, and keyboard orbit affect every cell.

The base-color input is sRGB and is converted by `THREE.Color` exactly once. All reflection arithmetic takes place in Linear-sRGB. `tonemapping_fragment` then `colorspace_fragment` run once at final output. Exposure is 2^EV. With tone mapping off, the renderer explicitly applies exposure to incoming direct/environment radiance and the backdrop; with ACES on, Three.js applies exposure during tone mapping.

## Material equations

Let N, L, V be normalized surface normal, surface-to-light, and surface-to-view vectors. H = normalize(L + V). Directions below the normal hemisphere contribute zero.

Lambert: f_d = baseColor / π.

Phong teaching variant: f_s = k_s C max(R·V, 0)^n, R = reflect(−L, N).

Blinn–Phong teaching variant: f_s = k_s C max(N·H, 0)^n.

By default C = 1 for the empirical lobes. Optional scaling sets C = (n+2)/(2π) for Phong and C = (n+8)/(8π) for Blinn–Phong. These are lobe-scaling conventions, not a guarantee of energy conservation for the diffuse-plus-specular material. In particular the Blinn factor is approximate. Both classical implementations multiply BRDF by N·L when evaluating outgoing direct-light radiance; they are not verbatim 1970s shading equations. Classical materials do not respond to the metalness, IOR, or roughness sliders. PBR does not respond to empirical shininess/specular-strength settings.

The optional n_Blinn = 4n_Phong rule is a near-peak angular heuristic. It is neither an exact equivalence nor a calibrated mapping to GGX roughness. The lobe guide chart additionally uses n_Phong = 2/r² − 2 solely to construct a visual width comparison and normalizes each curve to its own maximum. Its vertical scale is not absolute energy.

Modern PBR: alpha = roughness² (minimum 0.0025); D is isotropic GGX; G is separable Smith G1(N·L)G1(N·V), without the height-correlated modification; F is Schlick. f_s = DFG/[4(N·L)(N·V)]. f_d = (1−F)(1−metalness) baseColor / π. For dielectrics, F0 = ((IOR−1)/(IOR+1))². For a pure metal, F0 is linear base color and diffuse is zero. Intermediate metalness interpolates a simplified workflow, not a homogeneous physical material. The slider restricts roughness to [0.08,1], avoiding a delta-function mirror.

Schlick Fresnel is an approximation: at IOR = 1, its F0 is zero but the fifth-power term still produces grazing reflection, unlike the exact equal-index dielectric result. The CPU reference uses the GLSL denominator guards in double precision; GPU float precision and finite sample variance are separate concerns.

## Energy limitation of the combined PBR material

The common `(1−F(V·H))` Lambert diffuse coupling is a practical approximation, **not a strictly energy-conserving layered BSDF**. An independent white-furnace integration with 262,144 diffuse and specular directions, white base color, metalness 0, and IOR 1.5 yields total directional-hemispherical reflectance about 1.2188 at roughness 0.35 and N·V = 0.1 (about 1.5415 at roughness 0.08). The single-scattering specular term itself remains bounded, but adding this diffuse term can exceed unit energy at grazing. The Guide discloses this explicitly. A production layered model or more careful diffuse/specular compensation would be a separate extension; this lab does not claim an exact energy-conserving material.

## Environment integration

The studio, sky, and sunset environments are original analytical functions returning nonnegative linear radiance. Background uses the same function when explicitly selected, but has no causal effect on illumination unless the link option is enabled. Environment rotation rotates the directional field; it does not rotate the independent directional light.

- Diffuse: 24 deterministic cosine-weighted samples per chart, integral estimator f_d L_i π. The PBR Fresnel diffuse weight is evaluated per incoming direction
- Phong specular: 48 samples per chart of the cosine-power lobe about reflect(−V,N); PDF (n+1) cos^n/(2π)
- Blinn specular: 48 half-vector samples per chart, PDF_H = (n+2)(N·H)^(n+1)/(2π), converted to incident direction using PDF_L = PDF_H/(4 V·H)
- GGX specular: 48 half-vector samples per chart with PDF_H = D(H)(N·H), same reflection Jacobian. The resulting weight is F G (V·H)/[(N·V)(N·H)]
- Invalid hemisphere samples contribute zero; the estimator is divided by the original sample count, not just accepted samples

Finite deterministic sampling can show structured variance/banding. It is a transparent educational integration, not PMREM, a measured HDR photograph, a production path tracer, or a claim of converged lighting. No texture stands in for the material computation.

## Scope limits

No cast shadows, indirect interreflection, multiple-scattering compensation, anisotropy, transmission, subsurface scattering, spatial material textures, spectral optics, measured metal IOR, or recreation of full Disney materials. Metal colors are illustrative. All meshes have interpolated vertex normals. Phong normal interpolation and the Phong reflection model are explicitly distinguished.

## Original visuals and privacy

All shipped visuals are GPU output, procedural geometry, mathematical SVG diagrams, or CSS interface primitives. Design-concept images were used only as design references and are not shipped as evidence or runtime assets. Fonts and packages are locally bundled with complete notices. The language preference is stored locally; no user inputs are sent to a backend.

## Sphere tessellation and reflection-frame continuity

The visible sphere is an indexed midpoint-subdivided icosahedron, with five recursive levels: 10,242 unique vertices and 20,480 triangles. Each edge midpoint is reused by its neighboring faces. Positions are projected onto radius 0.85; normals are analytic unit radial directions. The geometry has no UV attribute or texture seam and is shared unchanged by all four materials. Its triangles are roughly uniform, not mathematically equal-area: measured maximum/minimum triangle area is about 1.3001, versus about 15.3016 for the previous 80×48 latitude/longitude sphere. Vertex valence is 5 at twelve vertices and 6 everywhere else, with no valence-80 poles.

The old sphere already had smooth radial normals. Topology improves surface/silhouette approximation and sample-position accuracy; it does not by itself explain every reflection artifact. The environment integrator also previously switched its tangent frame abruptly at |axis.z| = 0.999. A finite sample pattern changes orientation at that boundary even though the ideal integral is rotation-invariant.

The integrator now uses two world-fixed sampling charts. It smoothly blends their integral estimates across 0.995 < |axis.z| < 0.999, rather than switching frames abruptly or interpolating tangent vectors. The axis is N for diffuse, Blinn, and GGX, and R for Phong specular. Each chart is evaluated only where its basis is nonsingular. Smoothstep weights sum to one; both estimates use the original matching PDFs and BRDF weights. A diffuse chart uses 24 directions and a specular chart 48. Both charts are evaluated only in the narrow overlap, so a lobe uses at most twice its usual samples there. The overlap covers 0.4% of uniformly distributed axis directions, which is not a hardware performance guarantee.

Lambert and classic diffuse samples remain independent of camera position. PBR diffuse retains the view dependence of its existing Fresnel weight, and specular retains its BRDF's view dependence. No camera-anchored sample frame is used. The BRDF equations, PDFs, procedural radiance, and color pipeline are unchanged. This removes the artificial frame switch, not finite-sample approximation error; visible patterns can still occur, especially for narrow bright sources.

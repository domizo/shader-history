# Verification

Checked 13 October 2026. This is an educational renderer; the checks below establish its implemented behavior, not universal physical accuracy.

## Automated checks

The [verification workflow](https://github.com/domizo/shader-history/actions/workflows/verify.yml) lists runs for the latest branch, including documentation-only follow-ups. The exact application capture run is recorded below.

The production-preview Chromium run at [03440fec](https://github.com/domizo/shader-history/actions/runs/38373191661) passed:

- Clean `npm ci`, strict TypeScript checks, formatting, and Vite production build
- 38 numerical/reference tests, including state-preserving presets/reset, requested-blue conversion, and teapot geometry, plus: sRGB conversion, Fresnel bounds, GGX projected normalization, Smith bounds, reciprocity, supported roughness/grazing finiteness, hemisphere rejection, normal-view metal specular energy, Lambert energy, classic lobe width, half-vector geometry, and shared output conversion
- Six browser scenarios using real WebGL2/SwiftShader, not generated material images
- Nonblank four-model rendering and visible response to roughness and moving light
- Unlinked background changes leave sampled object pixels identical; enabling environment illumination changes them
- Pure-metal PBR diffuse is black; Lambert specular is black
- Single-model metallic knot, camera keyboard orbit, and actual exported canvas PNG
- English/Japanese Guide, repeated Guide/Lab switching, diagram controls, background/environment link, reset, and phone layout

Shader pixel checks synchronize submitted GPU work. State changes, an updated DOM, and a fixed delay alone are insufficient evidence that an asynchronous WebGL frame has completed. Screenshot capture waits for the tested rendered state; the phone capture additionally checks all four objects after resizing.

The packaged deployment's 19 built files were compared byte-for-byte with the successful CI build artifact. Browser artifacts include desktop comparison, diffuse isolation, single metal knot, exported knot PNG, both Guide languages, and a 390-pixel-wide Japanese layout. Selected actual screenshots are preserved in [docs/images](images/README.md), with source commits, run links, original artifact paths, and SHA-256 hashes. The remaining CI artifacts are retained for 14 days; the workflow reproduces them.

## Blue, Utah teapot, and view-state regression

- Initial, Plastic, Rough, and Reset settings base color is the requested sRGB `#0061ff`; the illustrative metal remains gold
- The pinned official teapot has 11,552 vertices / 20,592 triangles, finite unit analytic patch normals, positive triangle areas, matching winding, and centered maximum extent 1.7. Teapot-only double-sided shading flips the custom fragment normal on exposed backs
- Actual captures cover blue Plastic Single, metallic low roughness, spout/lid from above, underside, synchronized four-model comparison, and Japanese 390-pixel layout
- Repeated Plastic/Metal/Rough presets, all experiments, shape, environment/background linking, lighting, components, exposure, tone mapping, camera controls, Guide/Lab navigation, language, and Reset settings preserve Single and the selected shader. Compare is changed explicitly
- Material presets now modify material properties only; experiments and Reset settings also preserve shape and camera
- A known flat Lambert face with environment off checks rendered RGB against the analytic direct-light response and one sRGB transfer at exposure −1, 0, and +1 (tolerance 1.5 display levels). ACES changes the rendered response while sRGB output and the input hex remain unchanged
- Both surface and background shaders include one optional tone map before one output conversion. ACES remains the HDR-friendly default, with its role and approximation explained in both Guide languages

The pre-existing Lambert camera-invariance fixture now supplies its original brown color explicitly, rather than inheriting the newly requested blue and its lower output under the sunset environment. Its brightness and one-level invariance assertions are unchanged. The slider helper also avoids awaiting a new frame for an unchanged value; these are test-fixture corrections, not renderer changes.

## Sphere and sampling-frame regression

- The sphere now has 10,242 shared vertices and 20,480 outward-wound triangles, with all edges shared by two faces and Euler characteristic 2
- Exactly twelve vertices have valence 5; all others have valence 6. The old latitude/longitude mesh had two valence-80 poles
- Maximum/minimum triangle area improved from about 15.3016 to 1.3001. The new triangles are roughly uniform, not exactly equal-area
- Radial normals and sphere radii are verified; both old and new meshes already used smooth radial normals. No flat-normal defect is claimed
- World-fixed ±Z hemisphere sampling charts remove the old abrupt frame switch and front-center frame winding. Both active denominators stay at least 0.9; the shader's BRDF equations and PDF weights are unchanged
- Unit tests cover topology, winding, triangle shape, radius, unit normals, frame continuity, and tangent alignment near both poles
- A browser regression views the same flat Lambert surface under studio, sky, and sunset environment lighting while orbiting the camera. Sampled output remains within one displayed RGB level; independent fixed-normal CPU sweeps also found zero diffuse variation
- Controlled before/after WebGL captures use the same metal preset, roughness, camera, environment, rotation, exposure, and output pipeline. Cases include roughness 0.08 and 0.35, environment rotation, polar and oblique views, direct-only polar light, and a 390-pixel viewport

The chart fix targets artificial seams and sample-frame winding. It does not guarantee a more accurate integral at every pixel: finite deterministic sampling error remains, especially with narrow bright sources. The overlap may evaluate two charts per lobe (up to 48 diffuse and 96 specular directions), and actual performance is hardware-dependent.

## Mathematical and historical review

The custom GLSL and CPU reference were independently reviewed against the cited primary sources. The environment estimators include their sampling PDFs and half-vector reflection Jacobians. High-sample independent quadrature confirmed the disclosed combined-PBR energy caveat: white dielectric, IOR 1.5, roughness 0.35, and N·V 0.1 yield approximately 1.21882552 total reflectance. The common Fresnel-weighted Lambert coupling is therefore not described as an exact energy-conserving layered material.

The Guide distinguishes Phong normal interpolation from its reflection model, selected publication milestones from invention dates, GGX/Trowbridge–Reitz history, and this modern GGX/Smith/Schlick combination from the original Cook–Torrance and full Disney models. Schlick's equal-index limitation and the demo-specific white classic specular convention are explicit.

## Visual review and design fidelity

The desktop concept uses graphite surfaces, amber accents, restrained framing, a dominant two-by-two shader viewport, a compact right inspector, and a fine publication rail. The Guide uses a narrow contents rail and editorial technical content. Actual browser screenshots were reviewed against these references:

- **Palette and typography:** graphite/ivory/amber hierarchy, bundled DM Sans and IBM Plex Mono, readable model names and compact parameter labels
- **Desktop composition:** large four-model canvas, aligned two-by-two cells, shared camera, restrained separators, right-side parameter inspector, and publication rail
- **Single view and export:** the selected metallic knot fills one viewport; the exported PNG contains the same actual geometry and lighting
- **Model distinction:** the Lambert cell has no specular lobe; classic and GGX highlights are computed, and component-isolation captures match the teaching claims
- **Guide:** legible English/Japanese content, interactive vector diagram and lobe plot, model sections, historical context, limitations, and primary-source links
- **Responsive layout:** no horizontal document overflow at 390 pixels; the timeline reflows and the full inspector follows the viewport

Intentional adjustments from the concept:

- The approved brand **Shader History** replaces the neutral concept title
- Actual GPU-computed BRDFs replace concept spheres; no generated shader screenshots ship in the app
- Decorative ground contact shadows are omitted because the lab does not simulate cast shadows
- Historically accurate captions replace concept shorthand: the 2007 milestone is Walter et al.'s GGX treatment, 2012 is Disney, and PBR has no single invention date
- Independent background/illumination controls, component isolation, presets, numerical caveats, and technical Guide content are functional additions
- The inspector scrolls on desktop and flows below the viewport on phones

## Verification limits

Automated browser checks serve the production build in Chromium with the SwiftShader WebGL2 renderer. They do not certify physical mobile GPUs, Safari, every browser/driver combination, or real-device frame rates. WebGL2 is required. The checks establish functional and visual behavior in the recorded CI environment.

Finite environment samples can produce structured variance. Single scattering, illustrative metal colors, approximate Fresnel/diffuse coupling, and omitted production effects are documented in [IMPLEMENTATION.md](IMPLEMENTATION.md) and in both Guide languages. The comparisons keep geometry, camera, direct/environment illumination, and the linear-light display pipeline shared; material parameters with different mathematical meanings are not claimed to be exactly equivalent.

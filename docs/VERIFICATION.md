# Verification

Checked 13 October 2026. This is an educational renderer; the checks below establish its implemented behavior, not universal physical accuracy.

## Automated checks

The production-preview Chromium run at [3403d53d](https://github.com/domizo/shader-history/actions/runs/38348949732) passed:

- Clean `npm ci`, strict TypeScript checks, formatting, and Vite production build
- 17 numerical/reference tests: sRGB conversion, Fresnel bounds, GGX projected normalization, Smith bounds, reciprocity, supported roughness/grazing finiteness, hemisphere rejection, normal-view metal specular energy, Lambert energy, classic lobe width, half-vector geometry, and shared output conversion
- Two browser scenarios using real WebGL2/SwiftShader, not generated material images
- Nonblank four-model rendering and visible response to roughness and moving light
- Unlinked background changes leave sampled object pixels identical; enabling environment illumination changes them
- Pure-metal PBR diffuse is black; Lambert specular is black
- Single-model metallic knot, camera keyboard orbit, and actual exported canvas PNG
- English/Japanese Guide, repeated Guide/Lab switching, diagram controls, background/environment link, reset, and phone layout

Shader pixel checks synchronize submitted GPU work. State changes, an updated DOM, and a fixed delay alone are insufficient evidence that an asynchronous WebGL frame has completed. Screenshot capture waits for the tested rendered state; the phone capture additionally checks all four objects after resizing.

The packaged deployment's 18 built files were compared byte-for-byte with the successful CI build artifact. Browser artifacts include desktop comparison, diffuse isolation, single metal knot, exported knot PNG, both Guide languages, and a 390-pixel-wide Japanese layout. CI artifacts are retained for 14 days; the workflow reproduces them.

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

Automated browser checks use Chromium with a software WebGL2 renderer. They do not certify every physical GPU, browser, or phone; WebGL2 is required. The original cloud workspace could not launch a local browser because its socket policy blocked Chromium, so the repository's production-preview CI supplied the actual rendering evidence. No security setting was changed for that fallback.

Finite environment samples can produce structured variance. Single scattering, illustrative metal colors, approximate Fresnel/diffuse coupling, and omitted production effects are documented in [IMPLEMENTATION.md](IMPLEMENTATION.md) and in both Guide languages. The comparisons keep geometry, camera, direct/environment illumination, and the linear-light display pipeline shared; material parameters with different mathematical meanings are not claimed to be exactly equivalent.

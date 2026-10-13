# Verification

## Local checks

- TypeScript strict type check: passed
- Numerical reference tests: 17 passed
- Production Vite build: passed
- Formatting: checked before source freeze

## Browser checks

The dot cloud browser could not connect to the execution workspace's localhost server. A local Playwright Chromium fallback was attempted but process startup is blocked by the workspace's socket permission policy (`socket() failed: Operation not permitted`). No security setting was changed or authentication grant created.

The repository CI is configured to install Chromium, serve the production build, run real-WebGL browser tests, and upload screenshots/traces. Its outcome must be verified for the exact source commit before the site is described as visually verified. This file deliberately does not claim a pending run has passed.

## Design reference and intentional adjustments

The desktop lab concept uses graphite surfaces, amber accents, minimal framing, a dominant two-by-two shader viewport, compact right inspector, and a fine publication rail. The guide concept uses a narrow contents rail and editorial technical content.

Intentional implementation adjustments:

- Final user-selected brand is **Shader History**, replacing the neutral pre-approval concept title
- Concept spheres are replaced by actual GPU-computed BRDFs; there are no generated shader screenshots in the shipped app
- Concept ground contact shadows are omitted because the lab does not simulate cast shadows; this avoids presenting a decorative shadow as physical simulation
- Correct historical labels replace inaccurate concept captions: 2007 is GGX, 2012 is Disney, modern PBR has no single invention date
- Independent background/lighting controls, component isolation, presets, numerical caveats, and Guide content are functional additions explicitly requested in the project scope
- The inspector scrolls on desktop and flows below the viewport on phones so all meaningful parameters remain accessible

Final screenshot review must cover typography, copy, layout, palette, real shader appearance, controls, mobile fit, and the Guide. Passing type checks alone is not visual verification.

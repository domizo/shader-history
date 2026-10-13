# Shader History

An English/Japanese, browser-based study of how surface reflection models evolved and why their images differ. The project and its initial hosted demo are private.

## Explore

- Four real GLSL reflection models: Lambert, a BRDF-style Phong teaching variant, Blinn–Phong, and a modern GGX/Smith/Schlick microfacet material
- Synchronized camera, geometry, lighting, and output pipeline in comparison mode; inspect each model individually
- Sphere, knot, and rounded-cube geometry
- Material parameters and plastic, metal, and rough-surface presets
- Moving directional light, independent procedural environment illumination and visible background, optional explicit linking
- Diffuse/specular decomposition, exposure, ACES on/off, and PNG render export
- Bilingual Guide: direction diagrams, interactive lobe plot, publication timeline, historical context, equations, caveats, and primary sources

The classical models are teaching variants rather than exact reproductions of historical rendering pipelines. Cook–Torrance (1982), GGX (2007), and Disney’s practical material work (2012) are explained as different contributions. PBR is not a single shader or a single invention date.

## Run locally

Requires Node.js 24 and a WebGL2-capable browser.

```sh
npm ci
npm run dev
```

Production preview:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Controls: drag to orbit, scroll to zoom; focus the viewer and use arrow keys to rotate. All parameter controls and navigation work with a keyboard. Light motion is off initially, including for reduced-motion users. The Guide remains available if WebGL is unavailable. The language preference is the only persisted user data; there is no backend, telemetry, account system, CDN asset request, or third-party material asset.

## Verification

```sh
npm run format:check
npm run check
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

The CI workflow serves the **production build** and checks actual WebGL pixels, independent background/lighting behavior, parameter response, zero diffuse for the metallic PBR material, zero specular for Lambert, light motion, single-model selection, geometry, PNG export, bilingual Guide navigation, and phone overflow. Screenshots are attached as CI artifacts. Unit tests cover linear/sRGB conversion, Fresnel endpoints, GGX projected normalization and reciprocity, Smith bounds, single-scattering specular energy, and Lambert integration.

## Technical boundaries

See [implementation notes](docs/IMPLEMENTATION.md), [sources](docs/SOURCES.md), and [verification record](docs/VERIFICATION.md). Full bundled dependency licenses are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Original project code is currently `UNLICENSED`; no open-source license grant is implied.

---

## 日本語

Lambert、Phong、Blinn–Phong から現代の微小面 PBR まで、反射の考え方を歴史と実験の両方から学ぶプロジェクトです。同じ形状・視点・照明・色処理で比較し、単体表示、パラメータ変更、直接光の移動、背景と環境照明の分離、拡散/鏡面の分離を試せます。

Guide は初学者向けの方向ベクトルの説明から、BRDF の式、実装上の近似、一次資料までを日英で収録しています。歴史を単純な新旧の優劣として扱わず、それぞれが答えようとした問題を説明します。

描画は実際の WebGL2 シェーダーです。古典モデルは BRDF 形式の教育用実装、PBR は GGX・Smith・Schlick と Lambert 拡散の組み合わせです。パストレーシング、透過、異方性、表面下散乱、多重散乱補償などは含みません。

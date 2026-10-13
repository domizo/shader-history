# Screenshot provenance / スクリーンショットの記録

These PNGs are unmodified actual browser captures from the production-preview Playwright suite. They are committed here so the README images remain available after CI artifacts expire. No generated concept image, synthetic material render, or retouching is used.

- Current source: [`cac5e299`](https://github.com/domizo/shader-history/commit/cac5e299b9e537282eafe577d651cd113201d786)
- Passing current CI: [38365752746](https://github.com/domizo/shader-history/actions/runs/38365752746), 13 October 2026
- `compare.png`: four models with the new shared geodesic sphere
- `single.png`: new sphere, PBR metal, roughness 0.35, studio environment only
- `guide.png`: English Guide, actual initial viewport
- `mobile.png`: Japanese comparison and controls at 390 × 844 viewport
- `sphere-before.png`: the identical rough-metal scenario before the sphere/frame fix, from [`823855d5`](https://github.com/domizo/shader-history/commit/823855d570a462c5ea6bcad04ee0020e5c6fc2f4), [passing baseline CI 38362777552](https://github.com/domizo/shader-history/actions/runs/38362777552)

The before/after material uses sRGB #dca55b, metalness 1, roughness 0.35, direct intensity 0, studio intensity 1.2, environment rotation 0°, default camera (0, 0.08, 4.3), exposure 0 EV, and ACES tone mapping. Both images have the same viewport and output pipeline. The change addresses the concentrated sphere topology and the central sample-frame pinwheel; finite quadrature error still exists.

Full source paths, byte counts, and SHA-256 checksums are recorded in [provenance.json](provenance.json). Documentation-only commits may follow without changing the pictured application. Tests for the latest main are linked from [verification](../VERIFICATION.md).

## 日本語

これらは本番用ビルドを Playwright の Chromium / SwiftShader で実際に描画して撮影した、未加工の PNG です。CI の一時保存期限後も README から見られるよう、リポジトリへ保存しています。生成画像や描画結果の加工は使っていません。

比較、単体の金属球、Guide、スマートフォン幅の日本語画面を収録しています。`sphere-before.png` と `single.png` は材質・環境・視点・露出・表示処理を揃えた変更前後です。極への三角形集中と中央のサンプル座標系に由来する渦模様を改善していますが、有限サンプルの誤差がすべてなくなるわけではありません。撮影元のコミット、CI、ファイルの検証値は上記と JSON を参照してください。

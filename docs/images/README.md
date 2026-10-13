# Screenshot provenance / スクリーンショットの記録

These PNGs are unmodified actual browser captures from the production-preview Playwright suite. They are committed here so the README images remain available after CI artifacts expire. No generated concept image, synthetic material render, or retouching is used.

- Current blue/teapot source: [`03440fec`](https://github.com/domizo/shader-history/commit/03440fec0057753b6fe9537c1b21df767acb4211)
- Passing current CI: [38373191661](https://github.com/domizo/shader-history/actions/runs/38373191661), 13 October 2026
- `compare.png`: the requested sRGB #0061ff default, four models and the shared geodesic sphere
- `teapot.png`: blue Plastic preset, Single PBR view of the Utah teapot
- `teapot-metal.png`: metal teapot, roughness 0.12, studio lighting
- `mobile.png`: Japanese teapot comparison and controls at 390 × 844 viewport
- `guide.png`: English Guide initial viewport, retained from the [prior passing capture](https://github.com/domizo/shader-history/actions/runs/38365752746); later color-management guidance is below this viewport
- `single.png`: the previous sphere-fix capture, PBR metal, roughness 0.35 and studio environment only, also from the prior passing run above
- `sphere-before.png`: the identical rough-metal scenario before the sphere/frame fix, from [`823855d5`](https://github.com/domizo/shader-history/commit/823855d570a462c5ea6bcad04ee0020e5c6fc2f4), [passing baseline CI 38362777552](https://github.com/domizo/shader-history/actions/runs/38362777552)

The before/after material uses sRGB #dca55b, metalness 1, roughness 0.35, direct intensity 0, studio intensity 1.2, environment rotation 0°, default camera (0, 0.08, 4.3), exposure 0 EV, and ACES tone mapping. Both images have the same viewport and output pipeline. The change addresses the concentrated sphere topology and the central sample-frame pinwheel; finite quadrature error still exists.

Full source paths, byte counts, and SHA-256 checksums are recorded in [provenance.json](provenance.json). Documentation-only commits may follow without changing the pictured application. Tests for the latest main are linked from [verification](../VERIFICATION.md).

## 日本語

これらは本番用ビルドを Playwright の Chromium / SwiftShader で実際に描画して撮影した、未加工の PNG です。CI の一時保存期限後も README から見られるよう、リポジトリへ保存しています。生成画像や描画結果の加工は使っていません。

指定された青の比較画面、Utah ティーポットの単体・金属表示、日本語のスマートフォン幅の画面を更新しました。過去の Guide 初期画面と球体修正の比較画像も、撮影元を区別して保持しています。`sphere-before.png` と `single.png` は材質・環境・視点・露出・表示処理を揃えた変更前後です。極への三角形集中と中央のサンプル座標系に由来する渦模様を改善していますが、有限サンプルの誤差がすべてなくなるわけではありません。撮影元のコミット、CI、ファイルの検証値は上記と JSON を参照してください。

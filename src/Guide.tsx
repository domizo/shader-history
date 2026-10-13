import { useState } from "react";
import { classicLobe, ggxBRDF, type V3 } from "./brdf";
import { lessons, sources, timeline } from "./content";
import type { Language, Model } from "./state";
export function Directions({ lang }: { lang: Language }) {
  const [angle, setAngle] = useState(40);
  const a = (angle * Math.PI) / 180;
  const lx = 170 - Math.sin(a) * 130,
    ly = 190 - Math.cos(a) * 130;
  const hx = 170 + Math.sin((((35 - angle) / 2) * Math.PI) / 180) * 125,
    hy = 190 - Math.cos((((35 - angle) / 2) * Math.PI) / 180) * 125;
  return (
    <div className="direction-demo">
      <svg
        viewBox="0 0 360 245"
        role="img"
        aria-label={
          lang === "ja"
            ? "法線 N、光 L、視線 V、ハーフベクトル H の図"
            : "Normal N, light L, view V and halfway vector H"
        }
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L6,3 L0,6" fill="context-stroke" />
          </marker>
        </defs>
        <path d="M32 192 H326" stroke="#75808b" />
        <path
          d="M40 192 l-10 14 M66 192 l-10 14 M92 192 l-10 14 M118 192 l-10 14 M144 192 l-10 14 M170 192 l-10 14 M196 192 l-10 14 M222 192 l-10 14 M248 192 l-10 14 M274 192 l-10 14 M300 192 l-10 14"
          stroke="#3a424b"
        />
        <path d="M170 190 L170 40" stroke="#eae7df" markerEnd="url(#arrow)" />
        <path
          d={`M170 190 L${lx} ${ly}`}
          stroke="#e9af62"
          markerEnd="url(#arrow)"
        />
        <path d="M170 190 L248 77" stroke="#90b9dc" markerEnd="url(#arrow)" />
        <path
          d={`M170 190 L${hx} ${hy}`}
          stroke="#abd5b0"
          strokeDasharray="4 4"
          markerEnd="url(#arrow)"
        />
        <text x="177" y="35" fill="#eae7df">
          N
        </text>
        <text x={lx - 20} y={ly - 6} fill="#e9af62">
          L
        </text>
        <text x="256" y="76" fill="#90b9dc">
          V
        </text>
        <text x={hx + 9} y={hy + 10} fill="#abd5b0">
          H
        </text>
        <text x="140" y="226" fill="#9ca4af">
          surface
        </text>
      </svg>
      <label className="range-label">
        {lang === "ja" ? "入射方向を動かす" : "Move the light direction"}
        <output>{angle}°</output>
        <input
          aria-label={lang === "ja" ? "図解の光の角度" : "Diagram light angle"}
          type="range"
          min="-65"
          max="75"
          value={angle}
          onChange={(e) => setAngle(+e.target.value)}
        />
      </label>
    </div>
  );
}
export function LobePlot({ lang }: { lang: Language }) {
  const [rough, setRough] = useState(0.35);
  const n = 2 / (rough * rough) - 2;
  const samples = 121;
  const angles = Array.from(
    { length: samples },
    (_, i) => (i / (samples - 1) - 0.5) * Math.PI * 0.98,
  );
  const data = [
    angles.map((a) => classicLobe(Math.cos(a), n, "phong")),
    angles.map((a) => classicLobe(Math.cos(a / 2), n * 4, "blinn")),
    angles.map((a) =>
      ggxBRDF(
        [0, 0, 1],
        [0, 0, 1],
        [Math.sin(a), 0, Math.cos(a)] as V3,
        rough,
        0.04,
      ),
    ),
  ];
  const colors = ["#e9af62", "#90b9dc", "#abd5b0"];
  return (
    <div className="lobe-demo">
      <svg
        viewBox="0 0 370 245"
        role="img"
        aria-label={
          lang === "ja"
            ? "ピークを1に揃えた鏡面ローブ"
            : "Specular lobes normalized to their own peak"
        }
      >
        <path d="M30 20 V195 H350 M190 20 V195" stroke="#39424c" fill="none" />
        {data.map((values, index) => {
          const peak = Math.max(...values);
          return (
            <path
              key={index}
              fill="none"
              strokeWidth="2"
              stroke={colors[index]}
              d={values
                .map(
                  (v, i) =>
                    `${i === 0 ? "M" : "L"}${30 + (i * 320) / (samples - 1)},${195 - (v / peak) * 165}`,
                )
                .join(" ")}
            />
          );
        })}
        <text x="18" y="215">
          −90°
        </text>
        <text x="184" y="215">
          0
        </text>
        <text x="326" y="215">
          90°
        </text>
      </svg>
      <div className="plot-legend">
        <span>Phong</span>
        <span>Blinn–Phong</span>
        <span>GGX</span>
      </div>
      <label className="range-label">
        {lang === "ja" ? "幅を比べる" : "Compare lobe width"}
        <output>{rough.toFixed(2)}</output>
        <input
          aria-label={lang === "ja" ? "図解の粗さ" : "Diagram roughness"}
          type="range"
          min=".15"
          max=".9"
          step=".01"
          value={rough}
          onChange={(e) => setRough(+e.target.value)}
        />
      </label>
      <p className="muted small">
        {lang === "ja"
          ? "各ピークを1に揃えた断面図。光源は法線方向。nₚ = 2/r² − 2、nᵦ = 4nₚ は比較用の目安で、材質の等価変換ではありません。"
          : "Each peak is scaled to 1. Light is normal to the surface. nₚ = 2/r² − 2 and nᵦ = 4nₚ are display heuristics, not equivalent materials."}
      </p>
    </div>
  );
}
export default function Guide({
  lang,
  onTry,
}: {
  lang: Language;
  onTry: (model: Model) => void;
}) {
  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);
  return (
    <div className="guide-layout">
      <aside
        className="guide-nav"
        aria-label={t("Guide contents", "ガイドの目次")}
      >
        <a href="#start">{t("Start here", "ここから始める")}</a>
        <a href="#timeline">{t("The timeline", "歴史の流れ")}</a>
        <a href="#models">{t("Reflection models", "反射モデル")}</a>
        <a href="#light-color">{t("Light & color", "光と色")}</a>
        <a href="#implementation">{t("Implementation notes", "実装と限界")}</a>
        <a href="#sources">{t("Sources", "参考資料")}</a>
      </aside>
      <article className="guide-content">
        <header className="guide-hero">
          <h1>
            {t(
              "A history of better questions.",
              "光の表現を、問いからたどる。",
            )}
          </h1>
          <p>
            {t(
              "From a matte surface to a material that responds to its world.",
              "マットな表面から、周囲の世界に応える材質へ。",
            )}
          </p>
        </header>
        <section id="start">
          <h2>{t("Start with four directions", "4つの方向から始める")}</h2>
          <p>
            {t(
              "A shader is a program. A reflection model is one of the ideas that program can evaluate. Here we focus on how a surface reflects incoming light toward a viewer.",
              "シェーダーはプログラムです。反射モデルは、そのプログラムで計算する考え方の一つ。ここでは、面に届いた光が視点へどのように返るかに注目します。",
            )}
          </p>
          <div className="diagram-pair">
            <Directions lang={lang} />
            <LobePlot lang={lang} />
          </div>
          <p>
            {t(
              "N is the surface normal. L points toward the light, V toward the viewer. H is the normalized halfway direction between L and V. R is the mirror reflection of the incoming light. All directions in the formulas are unit vectors.",
              "N は面の法線、L は光源への方向、V は視点への方向です。H は L と V の中間を正規化した方向。R は入射光を完全反射させた方向です。式の方向ベクトルはすべて長さ1です。",
            )}
          </p>
        </section>
        <section id="timeline">
          <h2>
            {t(
              "Connected ideas, not a replacement ladder",
              "置き換えの一本道ではない歴史",
            )}
          </h2>
          <p>
            {t(
              "These dates mark selected publications, not the invention of all shading. Lambertian diffuse remains useful today; empirical highlights still serve stylized and constrained rendering. Microfacet theory and practical workflows developed through overlapping research.",
              "年は代表的な出版物を示し、シェーディング全体の発明年ではありません。Lambert の拡散反射は今も使われ、経験的なハイライトも様式化や計算制約のある描画で役立ちます。微小面理論と制作向けワークフローは、重なり合う研究から発展しました。",
            )}
          </p>
          <ol className="vertical-timeline">
            {timeline.map((item) => (
              <li key={item.id}>
                <span>{item.year}</span>
                <div>
                  <h3>{item.name}</h3>
                  <p>{lang === "ja" ? item.ja : item.en}</p>
                  <a
                    href={sources.find((s) => s.id === item.id)!.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("Primary source", "一次資料")} ↗
                  </a>
                </div>
              </li>
            ))}
          </ol>
          <p>
            {t(
              "GGX is also called Trowbridge–Reitz; the distribution has an earlier 1975 antecedent. The 2007 milestone refers to Walter et al.’s GGX treatment. Disney’s 2012 model emphasizes a practical artist-facing parameter set, informed by measured materials. PBR is a family of approaches and workflows, not one shader introduced in 2012.",
              "GGX は Trowbridge–Reitz とも呼ばれ、分布には1975年の先行研究があります。2007年の節目は Walter らの GGX の扱いを指します。Disney の2012年のモデルは、実測材質から学びながら、制作で扱いやすいパラメータを重視しています。PBR は考え方とワークフローの集合であり、2012年に登場した単一のシェーダーではありません。",
            )}
          </p>
        </section>
        <section id="models">
          <h2>
            {t(
              "Four ways to answer the same light",
              "同じ光に答える、4つの方法",
            )}
          </h2>
          {lessons.map((lesson, index) => (
            <div
              className="model-lesson"
              key={lesson.model}
              id={`model-${lesson.model}`}
            >
              <div className="model-index">0{index + 1}</div>
              <div>
                <h3>
                  {lesson.model === "pbr"
                    ? "Microfacet PBR"
                    : lesson.model === "blinn"
                      ? "Blinn–Phong"
                      : lesson.model === "phong"
                        ? "Phong"
                        : "Lambert"}
                </h3>
                <h4>{lang === "ja" ? lesson.jaTitle : lesson.enTitle}</h4>
                <div className="formula">{lesson.formula}</div>
                {(lang === "ja" ? lesson.ja : lesson.en).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className="try-note">
                  {lang === "ja" ? lesson.jaTry : lesson.enTry}
                </p>
                <button
                  className="text-button"
                  onClick={() => onTry(lesson.model)}
                >
                  {t("Try in the lab", "Lab で試す")}{" "}
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          ))}
        </section>
        <section id="light-color">
          <h2>
            {t(
              "The material is only part of the image",
              "画像を決めるのは、材質だけではない",
            )}
          </h2>
          <div className="explain-row">
            <h3>{t("Background ≠ illumination", "背景と照明を分ける")}</h3>
            <p>
              {t(
                "A visible sky can be scenery without lighting anything. Environment lighting integrates incoming radiance over directions. The two settings are independent here; the link switch explicitly uses the selected backdrop as the lighting environment.",
                "見えている空が、物体を照らしているとは限りません。環境照明はさまざまな方向から届く光を積分します。この Lab の背景と環境照明は独立し、連動スイッチを入れたときに同じ環境を使います。",
              )}
            </p>
          </div>
          <div className="explain-row">
            <h3>{t("Diffuse + specular", "拡散反射 ＋ 鏡面反射")}</h3>
            <p>
              {t(
                "Diffuse spreads light broadly; specular depends strongly on direction. The component switch shows each contribution before their sum is tone mapped. Adding two displayed screenshots does not reconstruct the combined image because tone mapping is nonlinear.",
                "拡散反射は広い方向へ光を返し、鏡面反射は方向に強く依存します。成分切り替えは、トーンマッピングする前の寄与を分離します。トーンマッピングは非線形なので、表示後の画像を足しても合成画像にはなりません。",
              )}
            </p>
          </div>
          <div className="pipeline">
            <span>sRGB {t("input", "入力")}</span>
            <b>→</b>
            <span>Linear {t("light", "光計算")}</span>
            <b>→</b>
            <span>{t("Exposure / tone map", "露出・トーンマップ")}</span>
            <b>→</b>
            <span>sRGB {t("display", "表示")}</span>
          </div>
          <p>
            {t(
              "The color picker supplies sRGB values, converted once to Linear-sRGB. Direct and environment light are summed in linear space. Exposure and optional ACES tone mapping happen before one final sRGB output conversion. Use the same pipeline for every model.",
              "カラーピッカーの sRGB 値を一度だけ Linear-sRGB に変換します。直接光と環境光は線形空間で加算し、露出と任意の ACES トーンマッピングの後、最後に一度だけ sRGB に変換します。4方式とも同じパイプラインです。",
            )}
          </p>
          <div className="explain-row">
            <h3>
              {t(
                "ACES and sRGB do different jobs",
                "ACES と sRGB は役割が違う",
              )}
            </h3>
            <p>
              {t(
                "sRGB defines the display color encoding. ACES Filmic is the optional Three.js tone mapper that compresses bright HDR lighting before sRGB output. This lab defaults to ACES because its lights can exceed display range; this is a viewing choice, not a guarantee of physical truth. Turn ACES off for an uncompressed linear-light response, followed by sRGB encoding and display-range clipping. The requested #0061ff is an sRGB base-color input, not a promise that every lit pixel equals that blue.",
                "sRGB は表示色の符号化方式です。Three.js の ACES Filmic は、その前段で HDR の明るい光を表示範囲へ圧縮するトーンマッパーです。この Lab の光は表示範囲を超えるため初期設定は ACES にしていますが、これは見せ方の選択で、物理的な正しさを保証するものではありません。オフにすると線形の明るさを圧縮せず比較でき、表示範囲外の値はクリップされます。指定された #0061ff は sRGB のベースカラーであり、照明後の全画素が同じ青になるわけではありません。",
              )}
            </p>
          </div>
          <p>
            <a
              href="https://threejs.org/manual/pages/color-management.html"
              target="_blank"
              rel="noreferrer"
            >
              {t("Three.js: color management", "Three.js: カラーマネジメント")}{" "}
              ↗
            </a>
            {" · "}
            <a
              href="https://threejs.org/docs/pages/WebGLRenderer.html#toneMapping"
              target="_blank"
              rel="noreferrer"
            >
              {t("Renderer tone mapping", "レンダラーのトーンマッピング")} ↗
            </a>
          </p>
        </section>
        <section id="implementation">
          <h2>{t("What this lab computes", "この Lab の計算と限界")}</h2>
          <ul className="technical-list">
            <li>
              {t(
                "All models are custom GLSL on the same Three.js geometry and camera, with a shared directional light. No texture or photograph stands in for a shader.",
                "すべて同じ Three.js の形状・カメラ・平行光源を使う独自 GLSL です。写真やテクスチャ画像でシェーダーの代用はしていません。",
              )}
            </li>
            <li>
              {t(
                "Classic models are BRDF-style teaching variants: baseColor/π plus a white empirical lobe, multiplied by N·L. They are not verbatim historical implementations. The optional lobe factors are (n+2)/(2π) for Phong and (n+8)/(8π) for Blinn–Phong. The latter is approximate; neither switch guarantees energy conservation for the combined material.",
                "古典モデルは教育用の BRDF 形式です。baseColor/π と白色の経験的ローブを足し、N·L を掛けます。歴史的な実装そのものの再現ではありません。ローブ補正係数は Phong が (n+2)/(2π)、Blinn–Phong が (n+8)/(8π)。後者は近似であり、どちらも材質全体のエネルギー保存を保証するスイッチではありません。",
              )}
            </li>
            <li>
              {t(
                "The modern model uses α = roughness², GGX D, separable Smith G1(L)G1(V), Schlick Fresnel, and (1−F)(1−metalness) weighted Lambert diffuse. Dielectric F₀ = ((IOR−1)/(IOR+1))²; metal F₀ uses linear base color. Roughness is clamped away from an ideal delta mirror. Schlick is approximate: at IOR = 1 it still produces oblique reflection, unlike the exact equal-index Fresnel result.",
                "現代モデルは α = roughness²、GGX の D、分離形 Smith G1(L)G1(V)、Schlick Fresnel、(1−F)(1−metalness) で重み付けした Lambert 拡散です。非金属の F₀ = ((IOR−1)/(IOR+1))²、金属の F₀ は線形 Base color。完全鏡面のデルタ分布を避けるため粗さに下限を設けます。Schlick は近似です。IOR = 1 でも斜め方向に反射が残り、同じ屈折率の厳密な Fresnel の結果とは異なります。",
              )}
            </li>
            <li>
              {t(
                "Original procedural studio, sky, and sunset fields supply linear radiance. Environment integration uses 24 cosine-weighted diffuse and 48 importance-sampled specular directions per chart. Two world-fixed charts are blended only in a narrow overlap to avoid a frame seam. This is a finite-sample educational approximation; sampling patterns can remain. It is not a path tracer.",
                "独自の Studio・Sky・Sunset 関数が線形の入射光を作ります。環境光は座標系ごとに拡散24方向、鏡面48方向の重点サンプリングで積分します。世界座標に固定した2つの座標系を狭い重複範囲で混ぜ、切り替えの境界を避けています。有限サンプルの教育用近似なので、サンプル模様が残る場合があります。パストレーサーではありません。",
              )}
            </li>
            <li>
              {t(
                "Energy caveat: this common Fresnel-weighted Lambert coupling is an approximation, not an energy-conserving layered material. A white dielectric at roughness 0.35 and N·V = 0.1 reflects about 1.22 times the incident white-furnace energy in an independent high-sample test. PBR does not mean every approximation is physically exact.",
                "エネルギーの注意点：この一般的な Fresnel 重み付き Lambert 結合は近似であり、エネルギーを保存する層状材質モデルではありません。白い非金属、粗さ0.35、N·V = 0.1 を均一な白い環境で独立に高サンプル検証すると、入射エネルギーの約1.22倍を返します。PBR という名前が、すべての近似の物理的な正確さを保証するわけではありません。",
              )}
            </li>
            <li>
              {t(
                "Single-scattering only. No interreflection, cast shadows, multiple-scattering energy compensation, anisotropy, transmission, subsurface scattering, or spectral conductor optics. Metallic colors are illustrative, not measured optical constants.",
                "単一散乱のみです。相互反射、投影される影、多重散乱のエネルギー補償、異方性、透過、表面下散乱、分光的な金属の光学モデルは含みません。金属の色は観察用で、実測した光学定数ではありません。",
              )}
            </li>
          </ul>
        </section>
        <section id="sources">
          <h2>{t("Read the original ideas", "元の研究を読む")}</h2>
          <ol className="source-list">
            {sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title} ↗
                </a>
                <p>{s.note}</p>
              </li>
            ))}
          </ol>
          <p>
            <a
              href="./THIRD_PARTY_NOTICES.txt"
              target="_blank"
              rel="noreferrer"
            >
              {t("Bundled dependency licenses", "同梱ライブラリのライセンス")}{" "}
              ↗
            </a>
          </p>
          <p className="muted small">
            {t(
              "Research links checked 13 October 2026. Publication dates label selected milestones; the demo intentionally mixes later techniques where stated.",
              "参照リンクは2026年10月13日に確認。年は代表的な節目を表し、明記した箇所では後年の技法を組み合わせています。",
            )}
          </p>
        </section>
      </article>
    </div>
  );
}

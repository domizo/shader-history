import type { Model } from "./state";
export const sources = [
  {
    id: "lambert",
    title: "Lambert · Photometria (1760)",
    url: "https://www.e-rara.ch/zut/content/titleinfo/2814923",
    note: "Original book, digitized by ETH-Bibliothek / e-rara",
  },
  {
    id: "phong",
    title:
      "Bui Tuong Phong · Illumination for Computer Generated Pictures (1975)",
    url: "https://users.cs.northwestern.edu/~ago820/cs395/Papers/Phong_1975.pdf",
    note: "Original CACM paper, university-hosted copy",
  },
  {
    id: "blinn",
    title:
      "Jim Blinn · Models of Light Reflection for Computer Synthesized Pictures (1977)",
    url: "https://www.jimblinn.com/publications/",
    note: "Author’s bibliography and publisher links",
  },
  {
    id: "cook",
    title: "Cook & Torrance · A Reflectance Model for Computer Graphics (1982)",
    url: "https://www.graphics.cornell.edu/~westin/consortium-home/cook-tog.pdf",
    note: "Original TOG paper, Cornell-hosted copy",
  },
  {
    id: "ggx",
    title:
      "Walter et al. · Microfacet Models for Refraction through Rough Surfaces (2007)",
    url: "https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf",
    note: "Original paper introducing the GGX name and distribution in this context",
  },
  {
    id: "disney",
    title: "Brent Burley · Physically-Based Shading at Disney (2012)",
    url: "https://media.disneyanimation.com/uploads/production/publication_asset/48/asset/s2012_pbs_disney_brdf_notes_v3.pdf",
    note: "Author’s SIGGRAPH course notes",
  },
  {
    id: "color",
    title: "Three.js · Color management",
    url: "https://threejs.org/manual/pages/color-management.html",
    note: "Official documentation; implementation pins Three.js r180",
  },
];
export const timeline = [
  {
    year: "1760",
    name: "Lambert",
    en: "Diffuse reflection",
    ja: "拡散反射",
    id: "lambert",
  },
  {
    year: "1975",
    name: "Phong",
    en: "View-dependent highlights",
    ja: "視線で動くハイライト",
    id: "phong",
  },
  {
    year: "1977",
    name: "Blinn",
    en: "Half-vector models",
    ja: "ハーフベクトル",
    id: "blinn",
  },
  {
    year: "1982",
    name: "Cook–Torrance",
    en: "Microfacet reflectance",
    ja: "微小面の反射モデル",
    id: "cook",
  },
  {
    year: "2007",
    name: "GGX",
    en: "Long-tailed distribution",
    ja: "裾の長い分布",
    id: "ggx",
  },
  {
    year: "2012",
    name: "Disney",
    en: "Artist-friendly parameters",
    ja: "制作向けのパラメータ",
    id: "disney",
  },
];
export const lessons: {
  model: Model;
  enTitle: string;
  jaTitle: string;
  formula: string;
  en: string[];
  ja: string[];
  enTry: string;
  jaTry: string;
  source: string;
}[] = [
  {
    model: "lambert",
    enTitle: "A matte surface, from any viewpoint.",
    jaTitle: "どこから見ても、同じ拡散反射。",
    formula: "fᵈ = base color / π",
    en: [
      "A Lambertian BRDF is independent of viewing direction. The cosine N·L comes from how much light reaches a tilted patch, not from the BRDF itself.",
      "This is an ideal diffuse model, not a synonym for every rough material. It still appears inside modern PBR. It cannot make a mirror-like highlight by itself.",
    ],
    ja: [
      "Lambert の BRDF は視線方向に依存しません。明るさに掛かる N·L は、傾いた面に届く光の量から生まれます。BRDF 自体の方向依存性ではありません。",
      "理想的な拡散反射であり、あらゆる粗い材質を表すわけではありません。現代の PBR の一部にも使われますが、単独では鏡面ハイライトを作れません。",
    ],
    enTry:
      "Turn off environment lighting and orbit. The lit side stays tied to the light, not the camera.",
    jaTry:
      "環境照明をオフにしてカメラを回す。明るい面はカメラではなく、光の方向に対応します。",
    source: "lambert",
  },
  {
    model: "phong",
    enTitle: "Give the surface a highlight.",
    jaTitle: "表面に、ハイライトを加える。",
    formula: "fˢ ∝ max(R·V, 0)ⁿ",
    en: [
      "Compare the perfect reflection direction R with the view V. Raising their alignment to an exponent n shapes the highlight; larger n produces a narrower lobe.",
      "Phong’s 1975 paper also describes interpolating normals. That interpolation technique, “Phong shading,” is a different concept from the reflection model. All four demos here use interpolated normals.",
    ],
    ja: [
      "完全反射の方向 R と視線 V がどれだけ揃うかを比べます。その値の n 乗でハイライトを形づくり、n が大きいほど細くなります。",
      "1975年の論文は法線の補間も扱います。「Phong shading」という補間手法と、Phong の反射モデルは別の概念です。このデモの4方式はすべて補間した法線を使います。",
    ],
    enTry:
      "Move the light, then raise shininess. Notice that changing the width also changes total reflected energy in the raw lobe.",
    jaTry:
      "ライトを動かし、Shininess を上げる。未補正のローブでは幅だけでなく、反射する光の総量も変わります。",
    source: "phong",
  },
  {
    model: "blinn",
    enTitle: "Look halfway between light and eye.",
    jaTitle: "光と視線の、中間を見る。",
    formula: "H = normalize(L + V)     fˢ ∝ max(N·H, 0)ⁿ",
    en: [
      "Blinn’s 1977 work connects highlights to half-vector and microfacet ideas. The familiar Blinn–Phong lobe uses N·H instead of R·V.",
      "The exponent has a different meaning. This lab can use nᵦ = 4nₚ as a near-peak matching heuristic; the lobes are never identical at every angle. A half-vector alone does not make a complete physically based BRDF.",
    ],
    ja: [
      "Blinn の1977年の研究はハーフベクトルや微小面の考え方とハイライトを結びつけます。よく使われる Blinn–Phong のローブは R·V の代わりに N·H を使います。",
      "指数の意味も変わります。この Lab の nᵦ = 4nₚ はピーク近傍を合わせる目安であり、全方向で一致する変換ではありません。ハーフベクトルだけで完全な物理ベース BRDF になるわけでもありません。",
    ],
    enTry:
      "Disable the 4× exponent link to compare the same number. Then re-enable it and inspect the broad tails.",
    jaTry:
      "4倍の指数連動を外し、同じ数値で比較する。連動を戻したら、ハイライトの裾の違いに注目します。",
    source: "blinn",
  },
  {
    model: "pbr",
    enTitle: "Describe what a surface is made of.",
    jaTitle: "表面の性質から、反射を組み立てる。",
    formula: "fˢ = D · F · G / (4(N·L)(N·V))",
    en: [
      "Microfacet models describe a surface statistically: D distributes tiny normals, F sets Fresnel reflectance, and G accounts for masking and shadowing between those facets.",
      "Cook–Torrance is a foundational microfacet model. This demo uses a later combination: GGX D, separable Smith G, Schlick F, and a metalness workflow. It is not a recreation of the 1982 paper or the full Disney BRDF.",
    ],
    ja: [
      "微小面モデルは表面を統計的に表します。D は小さな面の法線の分布、F は Fresnel 反射、G は微小面同士の遮蔽と影を受け持ちます。",
      "Cook–Torrance は基礎となる微小面モデルです。このデモは後年の GGX の D、分離形 Smith の G、Schlick の F と Metalness ワークフローを組み合わせています。1982年の式の再現でも、Disney BRDF の完全実装でもありません。",
    ],
    enTry:
      "Use the metal preset and isolate diffuse. The PBR sphere goes black because this simple conductor model has no diffuse term.",
    jaTry:
      "金属プリセットで拡散反射だけを表示する。この単純な導体モデルには拡散成分がないため、PBR の球は黒くなります。",
    source: "cook",
  },
];

export type Model = "lambert" | "phong" | "blinn" | "pbr";
export type Environment = "studio" | "sky" | "sunset";
export type Language = "en" | "ja";
export interface Settings {
  mode: "compare" | "single";
  model: Model;
  geometry: "sphere" | "knot" | "cube";
  color: string;
  roughness: number;
  metalness: number;
  ior: number;
  shininess: number;
  specular: number;
  scaledLobes: boolean;
  linkExponents: boolean;
  lightIntensity: number;
  lightAzimuth: number;
  lightElevation: number;
  environment: Environment;
  environmentEnabled: boolean;
  environmentIntensity: number;
  environmentRotation: number;
  background: "dark" | Environment;
  linkBackground: boolean;
  exposure: number;
  toneMapping: boolean;
  component: "combined" | "diffuse" | "specular";
  animate: boolean;
}
export const defaults: Settings = {
  mode: "compare",
  model: "pbr",
  geometry: "sphere",
  color: "#ce9458",
  roughness: 0.32,
  metalness: 0,
  ior: 1.5,
  shininess: 48,
  specular: 0.5,
  scaledLobes: false,
  linkExponents: true,
  lightIntensity: 3,
  lightAzimuth: -35,
  lightElevation: 40,
  environment: "studio",
  environmentEnabled: true,
  environmentIntensity: 0.5,
  environmentRotation: 0,
  background: "dark",
  linkBackground: false,
  exposure: 0,
  toneMapping: true,
  component: "combined",
  animate: false,
};
export const models: Model[] = ["lambert", "phong", "blinn", "pbr"];
export const modelNames: Record<Model, string> = {
  lambert: "Lambert",
  phong: "Phong",
  blinn: "Blinn–Phong",
  pbr: "Microfacet PBR",
};
export const envIndex = (value: Environment) =>
  ["studio", "sky", "sunset"].indexOf(value);
export const experiments: {
  id: string;
  en: string;
  ja: string;
  enNote: string;
  jaNote: string;
  values: Partial<Settings>;
}[] = [
  {
    id: "highlight",
    en: "Where highlights begin",
    ja: "ハイライトの始まり",
    enNote:
      "Orbit the camera. Lambert stays view-independent; the three specular models respond to the view.",
    jaNote:
      "カメラを回してください。Lambert の反射は視線に依存せず、鏡面反射を持つ3方式ではハイライトが動きます。",
    values: { ...defaults, environmentEnabled: false },
  },
  {
    id: "metal",
    en: "What makes a metal?",
    ja: "金属らしさはどこから？",
    enNote:
      "At metalness 1, the PBR implementation removes diffuse and colors the reflection. This lab’s classic variants keep white specular plus diffuse; other classic implementations can use different colors and weights.",
    jaNote:
      "Metalness = 1 で、この PBR 実装は拡散反射を消し、反射を色づけます。この Lab の古典モデルは白い鏡面＋拡散のままです。他の古典的な実装では、色や重みを変えることもできます。",
    values: {
      ...defaults,
      color: "#dca55b",
      metalness: 1,
      roughness: 0.22,
      lightIntensity: 1.5,
      environmentIntensity: 1.2,
    },
  },
  {
    id: "rough",
    en: "Spread the reflection",
    ja: "反射を広げる",
    enNote:
      "Change roughness and classic shininess separately. These controls are not interchangeable material measurements.",
    jaNote:
      "Roughness と古典モデルの Shininess を別々に動かします。同じ材質を測る、互換性のある数値ではありません。",
    values: {
      ...defaults,
      roughness: 0.65,
      shininess: 8,
      environmentIntensity: 0.8,
    },
  },
  {
    id: "environment",
    en: "Background is not light",
    ja: "背景と照明は別のもの",
    enNote:
      "The background is sunset, but environment lighting is off. Switch it on, then link the background to see what actually illuminates the surface.",
    jaNote:
      "背景は夕空ですが、環境照明はオフです。環境照明をオンにしてから背景と連動し、表面を実際に照らすものを確かめましょう。",
    values: {
      ...defaults,
      background: "sunset",
      environment: "studio",
      environmentEnabled: false,
      lightIntensity: 1.8,
    },
  },
];
export function safeLanguage(): Language {
  try {
    return localStorage.getItem("shading-lab-language") === "en" ? "en" : "ja";
  } catch {
    return "ja";
  }
}

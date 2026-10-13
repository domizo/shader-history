import { useEffect, useRef, useState, type ReactNode } from "react";
import Guide from "./Guide";
import { LabRenderer } from "./renderer";
import {
  defaults,
  experiments,
  modelNames,
  models,
  safeLanguage,
  type Language,
  type Model,
  type Settings,
  type Environment,
} from "./state";
import { timeline } from "./content";

function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  unit = "",
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: string;
  unit?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`range-label ${disabled ? "disabled" : ""}`}>
      <span>{label}</span>
      <output>
        {step < 1 ? value.toFixed(2) : value}
        {unit}
      </output>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        disabled={disabled}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Select({
  label,
  value,
  children,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  children: ReactNode;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="select-label">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
    </label>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="check-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
function PlayIcon({ playing }: { playing: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
    >
      {playing ? (
        <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="3" />
      ) : (
        <path d="M5 3l8 5-8 5V3Z" fill="currentColor" />
      )}
    </svg>
  );
}

export default function App() {
  const [lang, setLang] = useState<Language>(safeLanguage),
    [page, setPage] = useState<"lab" | "guide">("lab");
  const [settings, setSettings] = useState<Settings>({ ...defaults }),
    [activeExperiment, setActiveExperiment] = useState<string | null>(null),
    [error, setError] = useState("");
  const host = useRef<HTMLDivElement>(null),
    lab = useRef<LabRenderer | null>(null);
  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((old) => {
      const next = { ...old, [key]: value };
      if (key === "background" && old.linkBackground && value !== "dark")
        next.environment = value as Environment;
      if (key === "environment" && old.linkBackground)
        next.background = value as Environment;
      if (key === "linkBackground" && value) {
        if (old.background === "dark") next.background = old.environment;
        else next.environment = old.background;
      }
      return next;
    });
  };
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("shading-lab-language", lang);
    } catch {
      /* Storage is optional. */
    }
  }, [lang]);
  useEffect(() => {
    if (page !== "lab" || !host.current) return;
    try {
      lab.current = new LabRenderer(
        host.current,
        () =>
          Array.from(
            host.current?.querySelectorAll<HTMLElement>("[data-model]") ?? [],
          ),
        setError,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    return () => {
      lab.current?.dispose();
      lab.current = null;
    };
  }, [page]);
  useEffect(() => {
    lab.current?.update(settings);
  }, [settings, page]);
  const tryModel = (model: Model) => {
    setSettings((s) => ({ ...s, model, mode: "single" }));
    setPage("lab");
    window.scrollTo({ top: 0 });
  };
  const chooseExperiment = (id: string) => {
    const x = experiments.find((e) => e.id === id)!;
    setSettings({ ...defaults, ...x.values });
    setActiveExperiment(id);
    lab.current?.resetCamera();
  };
  const reset = () => {
    setSettings({ ...defaults });
    setActiveExperiment(null);
    lab.current?.resetCamera();
  };
  const visibleModels = settings.mode === "compare" ? models : [settings.model];
  const hasClassic =
    settings.mode === "compare" ||
    settings.model === "phong" ||
    settings.model === "blinn";
  const hasPbr = settings.mode === "compare" || settings.model === "pbr";
  const experiment = experiments.find((e) => e.id === activeExperiment);
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Skip to content", "本文へ")}
      </a>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setPage("lab")}
          aria-label="Shader History home"
        >
          <span className="brand-symbol" aria-hidden="true" />
          Shader History
        </button>
        <nav aria-label={t("Main navigation", "メインナビゲーション")}>
          <button
            className={page === "lab" ? "active" : ""}
            onClick={() => setPage("lab")}
          >
            Lab
          </button>
          <button
            className={page === "guide" ? "active" : ""}
            onClick={() => setPage("guide")}
          >
            Guide
          </button>
        </nav>
        <div className="language-switch" aria-label={t("Language", "言語")}>
          <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            EN
          </button>
          <button aria-pressed={lang === "ja"} onClick={() => setLang("ja")}>
            日本語
          </button>
        </div>
      </header>
      <main id="main">
        {page === "guide" ? (
          <Guide lang={lang} onTry={tryModel} />
        ) : (
          <div className="lab-page">
            <div className="page-heading">
              <h1>
                {t("How surfaces answer light.", "光に、表面はどう応える？")}
              </h1>
              <p>
                {t(
                  "One scene. Four models. A history of reflection.",
                  "同じシーン、4つのモデル。反射の歴史を触って学ぶ。",
                )}
              </p>
            </div>
            <div className="lab-layout">
              <div className="lab-main">
                <div className="viewport-shell">
                  <div className="viewport-toolbar">
                    <div
                      className="segmented"
                      aria-label={t("View mode", "表示モード")}
                    >
                      <button
                        aria-pressed={settings.mode === "compare"}
                        onClick={() => set("mode", "compare")}
                      >
                        {t("Compare", "比較")}
                      </button>
                      <button
                        aria-pressed={settings.mode === "single"}
                        onClick={() => set("mode", "single")}
                      >
                        {t("Single", "単体")}
                      </button>
                    </div>
                    {settings.mode === "single" && (
                      <select
                        aria-label={t("Reflection model", "反射モデル")}
                        value={settings.model}
                        onChange={(e) => set("model", e.target.value as Model)}
                      >
                        {models.map((m) => (
                          <option key={m} value={m}>
                            {modelNames[m]}
                          </option>
                        ))}
                      </select>
                    )}
                    <Select
                      label={t("Shape", "形状")}
                      value={settings.geometry}
                      onChange={(v) =>
                        set("geometry", v as Settings["geometry"])
                      }
                    >
                      <option value="sphere">{t("Sphere", "球")}</option>
                      <option value="knot">{t("Knot", "結び目")}</option>
                      <option value="cube">
                        {t("Rounded cube", "角丸キューブ")}
                      </option>
                    </Select>
                  </div>
                  <div
                    ref={host}
                    className={`render-host ${settings.mode}`}
                    data-testid="render-host"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (
                        [
                          "ArrowLeft",
                          "ArrowRight",
                          "ArrowUp",
                          "ArrowDown",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                        lab.current?.orbit(
                          e.key === "ArrowLeft"
                            ? 0.12
                            : e.key === "ArrowRight"
                              ? -0.12
                              : 0,
                          e.key === "ArrowUp"
                            ? 0.1
                            : e.key === "ArrowDown"
                              ? -0.1
                              : 0,
                        );
                      }
                    }}
                    aria-label={t(
                      "3D viewer. Drag to orbit; arrow keys also rotate the view.",
                      "3D ビュー。ドラッグまたは矢印キーで視点を回転。",
                    )}
                  >
                    <div className="model-grid">
                      {visibleModels.map((m) => (
                        <div className="model-cell" data-model={m} key={m}>
                          <div className="model-caption">
                            <button onClick={() => tryModel(m)}>
                              {modelNames[m]}
                            </button>
                            <span>
                              {m === "lambert"
                                ? t("1760 · Diffuse", "1760 · 拡散反射")
                                : m === "phong"
                                  ? t(
                                      "1975 · Reflection vector",
                                      "1975 · 反射ベクトル",
                                    )
                                  : m === "blinn"
                                    ? t(
                                        "1977 · Half-vector",
                                        "1977 · ハーフベクトル",
                                      )
                                    : t(
                                        "Modern · GGX / Smith / Schlick",
                                        "現代 · GGX / Smith / Schlick",
                                      )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {error && (
                      <div className="render-error" role="alert">
                        <h2>
                          {t(
                            "The 3D view needs WebGL2",
                            "3D 表示には WebGL2 が必要です",
                          )}
                        </h2>
                        <p>{error}</p>
                        <p>
                          {t(
                            "The full Guide is still available. Try an updated browser with graphics acceleration enabled.",
                            "Guide は引き続き読めます。グラフィックアクセラレーション対応の新しいブラウザをお試しください。",
                          )}
                        </p>
                        <button onClick={() => setPage("guide")}>
                          {t("Open the guide", "Guide を開く")}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="viewport-bottom">
                    <span>
                      {t(
                        "Drag to orbit · Scroll to zoom · Arrow keys to rotate",
                        "ドラッグで回転 · スクロールで拡大 · 矢印キー対応",
                      )}
                    </span>
                    <button onClick={() => lab.current?.resetCamera()}>
                      {t("Reset view", "視点を戻す")}
                    </button>
                  </div>
                </div>
                <div className="component-bar">
                  <span>{t("Show", "成分")}</span>
                  <div className="segmented">
                    {(["combined", "diffuse", "specular"] as const).map((c) => (
                      <button
                        key={c}
                        aria-pressed={settings.component === c}
                        onClick={() => set("component", c)}
                      >
                        {c === "combined"
                          ? t("Combined", "合成")
                          : c === "diffuse"
                            ? t("Diffuse", "拡散反射")
                            : t("Specular", "鏡面反射")}
                      </button>
                    ))}
                  </div>
                  <button
                    className="motion-button"
                    aria-pressed={settings.animate}
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        animate: !s.animate,
                        lightAzimuth: s.animate
                          ? Math.round(
                              lab.current?.currentLightAzimuth() ??
                                s.lightAzimuth,
                            )
                          : s.lightAzimuth,
                      }))
                    }
                  >
                    <PlayIcon playing={settings.animate} />
                    {settings.animate
                      ? t("Pause light", "ライトを停止")
                      : t("Move light", "ライトを動かす")}
                  </button>
                </div>
                <div
                  className="history-rail"
                  aria-label={t("Publication timeline", "出版年のタイムライン")}
                >
                  {timeline.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPage("guide");
                        setTimeout(
                          () =>
                            document
                              .getElementById("timeline")
                              ?.scrollIntoView(),
                          0,
                        );
                      }}
                    >
                      <span className="year">{item.year}</span>
                      <i />
                      <strong>{item.name}</strong>
                      <small>{lang === "ja" ? item.ja : item.en}</small>
                    </button>
                  ))}
                </div>
                <section className="experiments">
                  <h2>{t("Try a question", "問いから試す")}</h2>
                  <div className="experiment-options">
                    {experiments.map((e) => (
                      <button
                        key={e.id}
                        aria-pressed={e.id === activeExperiment}
                        onClick={() => chooseExperiment(e.id)}
                      >
                        {lang === "ja" ? e.ja : e.en}
                        <svg
                          aria-hidden="true"
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                        >
                          <path
                            d="M3 13L13 3M4 3h9v9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <p className="experiment-note" aria-live="polite">
                    {experiment
                      ? lang === "ja"
                        ? experiment.jaNote
                        : experiment.enNote
                      : t(
                          "Choose an experiment, then change one thing at a time. Every model uses the same shape, view, light, and display pipeline.",
                          "実験を選び、一つずつ条件を変えてみましょう。全モデルで形状・視点・光・表示処理を揃えています。",
                        )}
                  </p>
                </section>
              </div>
              <aside
                className="inspector"
                aria-label={t("Render settings", "描画設定")}
              >
                <section>
                  <h2>{t("Material", "材質")}</h2>
                  <div className="preset-row">
                    <button
                      onClick={() => {
                        setSettings((s) => ({
                          ...s,
                          color: "#ce9458",
                          metalness: 0,
                          roughness: 0.25,
                          shininess: 64,
                          ior: 1.5,
                        }));
                        setActiveExperiment(null);
                      }}
                    >
                      {t("Plastic", "プラスチック")}
                    </button>
                    <button onClick={() => chooseExperiment("metal")}>
                      {t("Metal", "金属")}
                    </button>
                    <button onClick={() => chooseExperiment("rough")}>
                      {t("Rough", "粗い表面")}
                    </button>
                  </div>
                  <label className="color-label">
                    <span>{t("Base color", "ベースカラー")}</span>
                    <input
                      aria-label={t("Base color", "ベースカラー")}
                      type="color"
                      value={settings.color}
                      onChange={(e) => set("color", e.target.value)}
                    />
                    <code>{settings.color}</code>
                  </label>
                  {hasPbr && (
                    <>
                      <Range
                        label={t("Roughness · PBR", "Roughness · PBR")}
                        value={settings.roughness}
                        min={0.08}
                        max={1}
                        step={0.01}
                        onChange={(v) => set("roughness", v)}
                      />
                      <Range
                        label={t("Metalness · PBR", "Metalness · PBR")}
                        value={settings.metalness}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(v) => set("metalness", v)}
                      />
                      <Range
                        label={t("IOR · dielectric PBR", "IOR · PBR 非金属")}
                        value={settings.ior}
                        min={1}
                        max={2.5}
                        step={0.01}
                        disabled={settings.metalness === 1}
                        onChange={(v) => set("ior", v)}
                      />
                    </>
                  )}
                  {hasClassic && (
                    <>
                      <Range
                        label={t(
                          "Shininess · classic",
                          "Shininess · 古典モデル",
                        )}
                        value={settings.shininess}
                        min={1}
                        max={128}
                        onChange={(v) => set("shininess", v)}
                      />
                      <Range
                        label={t(
                          "Specular strength · classic",
                          "鏡面の強さ · 古典モデル",
                        )}
                        value={settings.specular}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(v) => set("specular", v)}
                      />
                      <Check
                        label={t(
                          "Blinn exponent = 4 × Phong",
                          "Blinn の指数 = Phong の4倍",
                        )}
                        checked={settings.linkExponents}
                        onChange={(v) => set("linkExponents", v)}
                      />
                      <Check
                        label={t("Scale classic lobes", "古典ローブの係数補正")}
                        checked={settings.scaledLobes}
                        onChange={(v) => set("scaledLobes", v)}
                      />
                      <p className="small muted">
                        {t(
                          "4× is a width heuristic. Lobe scaling is not a full energy-conservation fix.",
                          "4倍は幅を合わせる目安です。係数補正だけでエネルギー保存が保証されるわけではありません。",
                        )}
                      </p>
                    </>
                  )}
                  {settings.mode === "single" &&
                    settings.model === "lambert" && (
                      <p className="small muted">
                        {t(
                          "Lambert has no specular, roughness, or metalness controls.",
                          "Lambert には鏡面反射・粗さ・Metalness の設定はありません。",
                        )}
                      </p>
                    )}
                </section>
                <section>
                  <h2>{t("Direct light", "直接光")}</h2>
                  <Range
                    label={t("Intensity", "強度")}
                    value={settings.lightIntensity}
                    min={0}
                    max={6}
                    step={0.05}
                    onChange={(v) => set("lightIntensity", v)}
                  />
                  <Range
                    label={t("Azimuth", "方位角")}
                    value={settings.lightAzimuth}
                    min={-180}
                    max={180}
                    unit="°"
                    onChange={(v) => set("lightAzimuth", v)}
                  />
                  <Range
                    label={t("Elevation", "仰角")}
                    value={settings.lightElevation}
                    min={-80}
                    max={85}
                    unit="°"
                    onChange={(v) => set("lightElevation", v)}
                  />
                </section>
                <section>
                  <h2>{t("Environment light", "環境照明")}</h2>
                  <Check
                    label={t("Environment light on", "環境照明を使う")}
                    checked={settings.environmentEnabled}
                    onChange={(v) => set("environmentEnabled", v)}
                  />
                  <Select
                    label={t("Lighting environment", "照明環境")}
                    value={settings.environment}
                    onChange={(v) => set("environment", v as Environment)}
                  >
                    <option value="studio">Studio</option>
                    <option value="sky">Sky</option>
                    <option value="sunset">Sunset</option>
                  </Select>
                  <Range
                    label={t("Environment intensity", "環境照明の強度")}
                    value={settings.environmentIntensity}
                    min={0}
                    max={2}
                    step={0.05}
                    onChange={(v) => set("environmentIntensity", v)}
                  />
                  <Range
                    label={t("Environment rotation", "環境の回転")}
                    value={settings.environmentRotation}
                    min={-180}
                    max={180}
                    unit="°"
                    onChange={(v) => set("environmentRotation", v)}
                  />
                  <p className="small muted">
                    {t(
                      "Original procedural light fields. 24 diffuse + 48 specular samples.",
                      "独自の手続き的な光環境。拡散24＋鏡面48サンプル。",
                    )}
                  </p>
                </section>
                <section>
                  <h2>{t("Display", "表示")}</h2>
                  <Select
                    label={t("Background", "背景")}
                    value={settings.background}
                    onChange={(v) =>
                      set("background", v as Settings["background"])
                    }
                  >
                    <option value="dark">{t("Dark", "暗い背景")}</option>
                    <option value="studio">Studio</option>
                    <option value="sky">Sky</option>
                    <option value="sunset">Sunset</option>
                  </Select>
                  <Check
                    label={t(
                      "Link background & environment",
                      "背景と照明環境を連動",
                    )}
                    checked={settings.linkBackground}
                    onChange={(v) => set("linkBackground", v)}
                  />
                  <Range
                    label={t("Exposure", "露出")}
                    value={settings.exposure}
                    min={-3}
                    max={3}
                    step={0.1}
                    unit=" EV"
                    onChange={(v) => set("exposure", v)}
                  />
                  <Check
                    label={t("ACES tone mapping", "ACES トーンマッピング")}
                    checked={settings.toneMapping}
                    onChange={(v) => set("toneMapping", v)}
                  />
                  <p className="pipeline-caption">
                    Linear light → {settings.toneMapping ? "ACES → " : ""}sRGB
                  </p>
                </section>
                <div className="inspector-actions">
                  <button onClick={reset}>
                    {t("Reset all", "すべてリセット")}
                  </button>
                  <button onClick={() => lab.current?.download()}>
                    {t("Save render PNG", "描画を PNG 保存")}
                  </button>
                </div>
              </aside>
            </div>
            <footer className="app-footer">
              <span>Shader History · 0.1.0</span>
              <button onClick={() => setPage("guide")}>
                {t("How it works, limits & sources", "仕組み・限界・参考資料")}{" "}
                ↗
              </button>
              <span>{t("Custom GLSL · WebGL2", "独自 GLSL · WebGL2")}</span>
            </footer>
          </div>
        )}
      </main>
    </>
  );
}

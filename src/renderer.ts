import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { backgroundFragment, fragment, vertex } from "./shaders";
import { createGeodesicSphere } from "./geometry";
import { defaults, envIndex, models, type Settings, type Model } from "./state";

export class LabRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  readonly controls: OrbitControls;
  readonly scene = new THREE.Scene();
  readonly materials: THREE.ShaderMaterial[];
  readonly mesh: THREE.Mesh;
  readonly sky: THREE.Mesh;
  private settings: Settings = { ...defaults };
  private geometries: Record<Settings["geometry"], THREE.BufferGeometry>;
  private raf = 0;
  private dirty = true;
  private disposed = false;
  private previous = 0;
  private rotation = 0;
  private frames = 0;
  private fence: WebGLSync | null = null;
  private resizeObserver: ResizeObserver;
  constructor(
    private host: HTMLElement,
    private cells: () => HTMLElement[],
    private onError: (error: string) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setClearColor("#11151b");
    this.renderer.debug.onShaderError = (_gl, _p, _v, _f) =>
      this.onError(
        "The GPU could not compile the shaders. Try another up-to-date WebGL2 browser.",
      );
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive comparison of four surface reflection models",
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.dataset.testid = "webgl-canvas";
    host.prepend(this.renderer.domElement);
    this.camera.position.set(0, 0.08, 4.3);
    this.controls = new OrbitControls(this.camera, host);
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.minDistance = 2.7;
    this.controls.maxDistance = 7;
    this.controls.addEventListener("change", () => {
      this.dirty = true;
    });
    this.materials = models.map(
      (_, i) =>
        new THREE.ShaderMaterial({
          vertexShader: vertex,
          fragmentShader: fragment,
          uniforms: {
            uModel: { value: i },
            uBaseColor: { value: new THREE.Color() },
            uRoughness: { value: 0.32 },
            uMetalness: { value: 0 },
            uIor: { value: 1.5 },
            uShininess: { value: 48 },
            uSpecular: { value: 0.5 },
            uScaledLobes: { value: false },
            uLightDirection: { value: new THREE.Vector3() },
            uLightIntensity: { value: 3 },
            uEnvironment: { value: 0 },
            uEnvironmentRotation: { value: 0 },
            uEnvironmentEnabled: { value: true },
            uEnvironmentIntensity: { value: 0.5 },
            uComponent: { value: 0 },
          },
        }),
    );
    this.geometries = {
      sphere: createGeodesicSphere(),
      knot: new THREE.TorusKnotGeometry(0.52, 0.19, 160, 32),
      cube: new RoundedBoxGeometry(1.28, 1.28, 1.28, 6, 0.12),
    };
    this.mesh = new THREE.Mesh(this.geometries.sphere, this.materials[0]);
    this.scene.add(this.mesh);
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(30, 32, 20),
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: backgroundFragment,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uEnvironment: { value: 0 },
          uEnvironmentRotation: { value: 0 },
          uSkyExposure: { value: 1 },
        },
      }),
    );
    this.scene.add(this.sky);
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(host);
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.renderer.domElement.addEventListener(
      "webglcontextrestored",
      this.contextRestored,
    );
    this.resize();
    this.update(this.settings);
    this.loop(0);
  }
  private contextLost = (event: Event) => {
    event.preventDefault();
    this.onError("The WebGL context was lost. Reload to restart the renderer.");
  };
  private contextRestored = () => {
    this.dirty = true;
  };
  private resize() {
    const r = this.host.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      this.renderer.setSize(r.width, r.height, false);
      this.dirty = true;
    }
  }
  update(settings: Settings) {
    this.settings = settings;
    const az = (settings.lightAzimuth * Math.PI) / 180,
      el = (settings.lightElevation * Math.PI) / 180;
    const direction = new THREE.Vector3(
      Math.sin(az) * Math.cos(el),
      Math.sin(el),
      Math.cos(az) * Math.cos(el),
    );
    this.materials.forEach((material, i) => {
      const u = material.uniforms;
      u.uBaseColor.value.set(settings.color);
      u.uRoughness.value = settings.roughness;
      u.uMetalness.value = settings.metalness;
      u.uIor.value = settings.ior;
      u.uShininess.value =
        settings.shininess * (i === 2 && settings.linkExponents ? 4 : 1);
      u.uSpecular.value = settings.specular;
      u.uScaledLobes.value = settings.scaledLobes;
      u.uLightDirection.value.copy(direction);
      u.uLightIntensity.value = settings.lightIntensity;
      u.uEnvironment.value = envIndex(settings.environment);
      u.uEnvironmentRotation.value =
        (settings.environmentRotation * Math.PI) / 180;
      u.uEnvironmentEnabled.value = settings.environmentEnabled;
      u.uEnvironmentIntensity.value = settings.environmentIntensity;
      u.uComponent.value = ["combined", "diffuse", "specular"].indexOf(
        settings.component,
      );
    });
    this.mesh.geometry = this.geometries[settings.geometry];
    this.sky.visible = settings.background !== "dark";
    const su = (this.sky.material as THREE.ShaderMaterial).uniforms;
    su.uEnvironment.value =
      settings.background === "dark" ? 0 : envIndex(settings.background);
    su.uEnvironmentRotation.value =
      (settings.environmentRotation * Math.PI) / 180;
    su.uSkyExposure.value = settings.toneMapping ? 1 : 2 ** settings.exposure;
    this.renderer.toneMapping = settings.toneMapping
      ? THREE.ACESFilmicToneMapping
      : THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 2 ** settings.exposure;
    // With no tone mapping, exposure still belongs before the sRGB conversion.
    for (const material of this.materials) {
      material.uniforms.uLightIntensity.value =
        settings.lightIntensity *
        (settings.toneMapping ? 1 : 2 ** settings.exposure);
      material.uniforms.uEnvironmentIntensity.value =
        settings.environmentIntensity *
        (settings.toneMapping ? 1 : 2 ** settings.exposure);
    }
    this.dirty = true;
  }
  orbit(azimuth: number, elevation: number) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += azimuth;
    spherical.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, spherical.phi + elevation),
    );
    this.camera.position
      .copy(this.controls.target)
      .add(new THREE.Vector3().setFromSpherical(spherical));
    this.controls.update();
    this.dirty = true;
  }
  currentLightAzimuth() {
    const direction = this.materials[0].uniforms.uLightDirection
      .value as THREE.Vector3;
    return (Math.atan2(direction.x, direction.z) * 180) / Math.PI;
  }
  resetCamera() {
    this.camera.position.set(0, 0.08, 4.3);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.dirty = true;
  }
  private loop = (time: number) => {
    if (this.disposed) return;
    const dt = Math.min((time - this.previous) / 1000, 0.05);
    this.previous = time;
    if (this.settings.animate) {
      this.rotation += dt * 0.32;
      const az = (this.settings.lightAzimuth * Math.PI) / 180 + this.rotation,
        el = (this.settings.lightElevation * Math.PI) / 180;
      for (const m of this.materials)
        m.uniforms.uLightDirection.value.set(
          Math.sin(az) * Math.cos(el),
          Math.sin(el),
          Math.cos(az) * Math.cos(el),
        );
      this.dirty = true;
    } else this.rotation = 0;
    if (this.dirty) {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      // Keep at most one frame in flight, especially on software/mobile GPUs.
      // New control values coalesce while the previous frame finishes.
      if (this.fence) {
        const status = gl.clientWaitSync(this.fence, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED) {
          this.raf = requestAnimationFrame(this.loop);
          return;
        }
        gl.deleteSync(this.fence);
        this.fence = null;
      }
      this.render();
      this.dirty = false;
      this.fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
    }
    this.raf = requestAnimationFrame(this.loop);
  };
  private render() {
    const rect = this.host.getBoundingClientRect(),
      w = rect.width,
      h = rect.height;
    if (!w || !h) return;
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, w, h);
    this.renderer.clear();
    this.renderer.setScissorTest(true);
    for (const cell of this.cells()) {
      const c = cell.getBoundingClientRect();
      const cw = c.width,
        ch = c.height;
      const model = cell.dataset.model as Model;
      const idx = models.indexOf(model);
      if (idx < 0 || cw <= 0 || ch <= 0) continue;
      const x = c.left - rect.left,
        y = h - (c.bottom - rect.top);
      this.renderer.setViewport(x, y, cw, ch);
      this.renderer.setScissor(x, y, cw, ch);
      this.camera.aspect = cw / ch;
      this.camera.updateProjectionMatrix();
      this.mesh.material = this.materials[idx];
      this.mesh.rotation.set(
        this.settings.geometry === "sphere" ? 0 : 0.12,
        this.settings.geometry === "sphere" ? 0 : 0.35,
        0,
      );
      this.renderer.render(this.scene, this.camera);
    }
    this.renderer.setScissorTest(false);
    this.frames++;
    this.host.dataset.frames = String(this.frames);
    this.host.dataset.ready = "true";
    this.host.dataset.component = this.settings.component;
    this.host.dataset.metalness = String(this.settings.metalness);
    this.host.dataset.background = this.settings.background;
    this.host.dataset.environmentEnabled = String(
      this.settings.environmentEnabled,
    );
    this.host.dataset.geometry = this.settings.geometry;
    this.host.dataset.mode = this.settings.mode;
    this.host.dataset.selectedModel = this.settings.model;
  }
  download() {
    this.dirty = true;
    this.render();
    const a = document.createElement("a");
    a.download = "shader-history-render.png";
    a.href = this.renderer.domElement.toDataURL("image/png");
    a.click();
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    if (this.fence)
      (this.renderer.getContext() as WebGL2RenderingContext).deleteSync(
        this.fence,
      );
    this.fence = null;
    this.controls.dispose();
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.renderer.domElement.removeEventListener(
      "webglcontextrestored",
      this.contextRestored,
    );
    Object.values(this.geometries).forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.sky.geometry.dispose();
    (this.sky.material as THREE.ShaderMaterial).dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

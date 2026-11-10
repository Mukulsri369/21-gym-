import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Volume2, VolumeX, ChevronDown, ChevronUp, RotateCcw, ArrowUpRight } from 'lucide-react';
import {
  buildGymRig,
  GymRigController,
  HOTSPOT_SPECS,
  HotspotId,
} from './three/buildGymRig';
import { FINISH_THEMES, FinishPresetId } from './three/gymMaterials';
import { soundEngine } from '../utils/sound';

const _v1 = new THREE.Vector3();

export type LoadTier = 1 | 2 | 3 | 4;

const LOAD_TIER_INFO: Record<LoadTier, { totalKg: number; label: string }> = {
  1: { totalKg: 75, label: '75 kg' },
  2: { totalKg: 115, label: '115 kg' },
  3: { totalKg: 145, label: '145 kg' },
  4: { totalKg: 165, label: '165 kg' },
};

const OVERVIEW_CAM: { pos: [number, number, number]; target: [number, number, number] } = {
  pos: [3.2, 2.0, 4.15],
  target: [0.0, 1.15, 0.0],
};

interface GymScene3DProps {
  onOpenMembershipModal: (defaultTier?: string) => void;
}

export const GymScene3D: React.FC<GymScene3DProps> = ({ onOpenMembershipModal }) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [selectedHotspot, setSelectedHotspot] = useState<HotspotId | null>(null);
  const [explodedPct, setExplodedPct] = useState<number>(0);
  const [loadTier, setLoadTier] = useState<LoadTier>(4);
  const [finishId, setFinishId] = useState<FinishPresetId>('obsidian-brass');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [webglLost, setWebglLost] = useState<boolean>(false);

  const simStateRef = useRef({
    targetExplode: 0,
    currentExplode: 0,
    loadTier: 4 as LoadTier,
    camTransitionActive: false,
    targetCamPos: new THREE.Vector3(...OVERVIEW_CAM.pos),
    targetCamLook: new THREE.Vector3(...OVERVIEW_CAM.target),
    requestRenderFn: () => {},
    rigController: null as GymRigController | null,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mountEl.clientWidth || window.innerWidth;
    const height = mountEl.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.042);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(...OVERVIEW_CAM.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...OVERVIEW_CAM.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minPolarAngle = 0.2;
    controls.minDistance = 1.6;
    controls.maxDistance = 8.5;
    controls.enablePan = false;
    controls.update();

    const onControlStart = () => {
      simStateRef.current.camTransitionActive = false;
    };
    controls.addEventListener('start', onControlStart);

    const hemiLight = new THREE.HemisphereLight(0x90a4ae, 0x151519, 0.55);
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    keyLight.position.set(4.5, 6.8, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    const d = 4.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 1.35);
    rimLight.position.set(-4.2, 4.5, -3.8);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxTop = new THREE.RectAreaLight(0xfff6e5, 4.2, 3.2, 1.4);
      softboxTop.position.set(0, 4.1, 1.5);
      softboxTop.lookAt(0, 1.2, 0);
      scene.add(softboxTop);
    }

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const rig = buildGymRig(maxAnisotropy);
    scene.add(rig.rootGroup);
    simStateRef.current.rigController = rig;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function stepKinematics(dt: number): boolean {
      const st = simStateRef.current;
      let stillMoving = false;

      const expDiff = Math.abs(st.targetExplode - st.currentExplode);
      if (expDiff > 0.0008) {
        st.currentExplode = THREE.MathUtils.damp(st.currentExplode, st.targetExplode, 7.5, dt);
        stillMoving = true;
      } else {
        st.currentExplode = st.targetExplode;
      }

      const exp = st.currentExplode;

      for (let i = 0; i < rig.explodableParts.length; i++) {
        const part = rig.explodableParts[i];
        _v1.copy(part.basePos).addScaledVector(part.explodeDelta, exp);
        part.obj.position.copy(_v1);
      }

      for (let i = 0; i < rig.plateEntries.length; i++) {
        const pe = rig.plateEntries[i];
        const targetX = THREE.MathUtils.lerp(pe.baseX, pe.explodedX, exp);
        if (Math.abs(pe.mesh.position.x - targetX) > 0.0005) {
          pe.mesh.position.x = THREE.MathUtils.damp(pe.mesh.position.x, targetX, 9.0, dt);
          stillMoving = true;
        } else {
          pe.mesh.position.x = targetX;
        }

        const shouldShow = pe.indexOnSleeve < st.loadTier;
        const targetScale = shouldShow ? 1 : 0.001;
        if (Math.abs(pe.currentScale - targetScale) > 0.002) {
          pe.currentScale = THREE.MathUtils.damp(pe.currentScale, targetScale, 10.0, dt);
          stillMoving = true;
        } else {
          pe.currentScale = targetScale;
        }
        pe.mesh.visible = pe.currentScale > 0.01;
        pe.mesh.scale.setScalar(pe.currentScale);
      }

      const collarBaseOffset = 0.755 + st.loadTier * 0.028;
      for (let i = 0; i < rig.collarEntries.length; i++) {
        const ce = rig.collarEntries[i];
        const side = ce.basePos.x < 0 ? -1 : 1;
        const targetCollarX = side * collarBaseOffset + ce.explodeDelta.x * exp;
        if (Math.abs(ce.obj.position.x - targetCollarX) > 0.0005) {
          ce.obj.position.x = THREE.MathUtils.damp(ce.obj.position.x, targetCollarX, 9.0, dt);
          stillMoving = true;
        } else {
          ce.obj.position.x = targetCollarX;
        }
      }

      if (st.camTransitionActive) {
        const distPos = camera.position.distanceTo(st.targetCamPos);
        const distLook = controls.target.distanceTo(st.targetCamLook);
        if (distPos > 0.015 || distLook > 0.015) {
          camera.position.x = THREE.MathUtils.damp(camera.position.x, st.targetCamPos.x, 5.5, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, st.targetCamPos.y, 5.5, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, st.targetCamPos.z, 5.5, dt);

          controls.target.x = THREE.MathUtils.damp(controls.target.x, st.targetCamLook.x, 6.0, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, st.targetCamLook.y, 6.0, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, st.targetCamLook.z, 6.0, dt);
          stillMoving = true;
        } else {
          st.camTransitionActive = false;
        }
      }

      return stillMoving;
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        renderDirty = false;
        const dt = Math.min((now - lastTime) / 1000, 0.1) || 0.016;
        lastTime = now;

        const kinematicsActive = stepKinematics(dt);
        const controlsMoved = controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || kinematicsActive || (!isSoftwareGl && controlsMoved)) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    simStateRef.current.requestRenderFn = requestRender;
    controls.addEventListener('change', requestRender);

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let lastHoverTime = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverTime < 60) return;
      lastHoverTime = now;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rig.raycastTargets, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      const moveDist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moveDist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rig.raycastTargets, false);

      if (hits.length > 0) {
        const hitId = hits[0].object.userData.hotspotId as HotspotId;
        if (hitId && HOTSPOT_SPECS[hitId]) {
          soundEngine.playMechanicalTick(1.15);
          setSelectedHotspot(hitId);
          const spec = HOTSPOT_SPECS[hitId];
          simStateRef.current.targetCamPos.set(...spec.cameraPos);
          simStateRef.current.targetCamLook.set(...spec.cameraTarget);
          simStateRef.current.camTransitionActive = true;
          requestRender();
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', onPointerUp);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const handleContextRestored = () => {
      setWebglLost(false);
      requestRender();
    };
    domEl.addEventListener('webglcontextlost', handleContextLost);
    domEl.addEventListener('webglcontextrestored', handleContextRestored);

    const handleResize = () => {
      if (!mountEl) return;
      const w = mountEl.clientWidth || window.innerWidth;
      const h = mountEl.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('change', requestRender);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('webglcontextlost', handleContextLost);
      domEl.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      rig.dispose();
      renderer.dispose();
    };
  }, []);

  const handleSelectHotspot = (id: HotspotId | null) => {
    soundEngine.playMechanicalTick(id ? 1.1 : 0.9);
    setSelectedHotspot(id);
    const st = simStateRef.current;
    if (id && HOTSPOT_SPECS[id]) {
      st.targetCamPos.set(...HOTSPOT_SPECS[id].cameraPos);
      st.targetCamLook.set(...HOTSPOT_SPECS[id].cameraTarget);
    } else {
      st.targetCamPos.set(...OVERVIEW_CAM.pos);
      st.targetCamLook.set(...OVERVIEW_CAM.target);
    }
    st.camTransitionActive = true;
    st.requestRenderFn();
  };

  const handleExplodeChange = (val: number) => {
    setExplodedPct(val);
    simStateRef.current.targetExplode = val / 100;
    simStateRef.current.requestRenderFn();
  };

  const handleLoadTierChange = (tier: LoadTier) => {
    setLoadTier(tier);
    simStateRef.current.loadTier = tier;
    soundEngine.playPlateLock(LOAD_TIER_INFO[tier].totalKg);
    simStateRef.current.requestRenderFn();
  };

  const handleFinishChange = (preset: FinishPresetId) => {
    setFinishId(preset);
    soundEngine.playMechanicalTick(1.25);
    if (simStateRef.current.rigController) {
      simStateRef.current.rigController.applyFinishTheme(preset);
      simStateRef.current.requestRenderFn();
    }
  };

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundEngine.enabled = next;
    if (next) soundEngine.playMechanicalTick(1.0);
  };

  const activeSpec = selectedHotspot ? HOTSPOT_SPECS[selectedHotspot] : null;

  return (
    <section
      id="studio-3d"
      className="relative w-full h-[calc(100vh-64px)] min-h-[640px] max-h-[960px] bg-[#09090B] overflow-hidden select-none border-b border-white/[0.07]"
    >
      <div
        ref={canvasMountRef}
        className="w-full h-full"
        aria-label="Interactive 3D 21 Fitness Gym Floor with Power Rack, Barbell, and 45-Degree Leg Press Machine"
      />

      {webglLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#09090B] z-20 p-6">
          <div className="max-w-md text-center border border-white/10 bg-[#111114] p-8 rounded-lg">
            <p className="font-display text-2xl font-medium text-white mb-2">
              21 Fitness 3D Studio
            </p>
            <p className="text-sm text-neutral-400">
              Restoring interactive 3D graphics context.
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090B] via-[#09090B]/50 to-transparent" />

      {/* Top-Left Brand Hero Overlay */}
      <div className="pointer-events-none absolute top-8 left-6 md:left-12 z-10 max-w-md flex flex-col gap-5">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
            <span className="text-[#D4AF37] font-medium">21 Fitness</span>
            <span aria-hidden="true">·</span>
            <span>Bodybuilding, Strength &amp; Conditioning</span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-mono">From ₹1,200/mo</span>
          </div>
          <h1
            className="font-display font-semibold text-white leading-[1.06]"
            style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.5rem)', textWrap: 'balance' }}
          >
            21 Fitness. Build Real Muscle &amp; Strength.
          </h1>
          <p className="mt-3.5 text-sm md:text-[15px] leading-relaxed text-neutral-400 max-w-[44ch]">
            Explore our 21 Fitness training floor in interactive 3D—featuring our Monolith Power
            Rack, 45° Linear Leg Press, and calibrated Olympic barbell. Click any machine to learn
            its biomechanics.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenMembershipModal('6 Months Transformation')}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e0bc42] text-[#09090B] font-medium text-xs rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Join 21 Fitness · ₹1,200/mo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="#fitness-guide"
              className="px-4 py-2.5 border border-white/10 hover:border-white/25 bg-[#111114]/90 text-neutral-200 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Fitness &amp; Diet Guide
            </a>
          </div>
        </div>

        {/* Educational Machine / Equipment Spec Card */}
        {activeSpec && !dockCollapsed && (
          <div className="pointer-events-auto border border-white/10 bg-[#111114]/95 p-4 rounded-lg max-w-xs transition-opacity duration-150">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-[11px] text-[#D4AF37]">{activeSpec.subtitle}</p>
                <h2 className="font-display text-base font-medium text-white mt-0.5">
                  {activeSpec.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleSelectHotspot(null)}
                title="Reset View"
                className="p-1 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              {activeSpec.description}
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.07]">
              {activeSpec.metrics.map((m) => (
                <div key={m.label}>
                  <div className="text-[10px] text-neutral-500">{m.label}</div>
                  <div className="text-xs font-mono text-white tabular-nums mt-0.5">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Unified Collapsible Bottom Control Dock */}
      <div
        className="pointer-events-auto absolute z-20 transition-transform duration-200 ease-out"
        style={{
          bottom: '20px',
          left: '50%',
          transform: `translateX(-50%) translateY(${dockCollapsed ? 'calc(100% - 32px)' : '0px'})`,
          width: 'min(900px, 94vw)',
        }}
      >
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="px-3.5 py-1 bg-[#111114] border border-b-0 border-white/10 rounded-t-md text-[11px] text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3 text-[#D4AF37]" />
                <span>Show 3D Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-[#111114] border border-white/10 rounded-lg px-4 py-3 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
            {/* Camera Focus */}
            <div className="lg:col-span-5 flex items-center gap-1 bg-[#09090B] p-1 rounded-md border border-white/[0.06] overflow-x-auto">
              <button
                type="button"
                onClick={() => handleSelectHotspot(null)}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedHotspot === null
                    ? 'bg-white text-[#09090B] font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              {(
                [
                  { id: 'barbell', label: 'Barbell' },
                  { id: 'rack', label: 'Power Rack' },
                  { id: 'legpress', label: 'Leg Press' },
                  { id: 'kettlebells', label: 'Kettlebells' },
                ] as { id: HotspotId; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectHotspot(item.id)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedHotspot === item.id
                      ? 'bg-white text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Barbell Load */}
            <div className="lg:col-span-3 flex items-center gap-1 bg-[#09090B] p-1 rounded-md border border-white/[0.06]">
              {([1, 2, 3, 4] as LoadTier[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleLoadTierChange(tier)}
                  className={`flex-1 py-1 text-xs font-mono tabular-nums rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    loadTier === tier
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {LOAD_TIER_INFO[tier].totalKg}kg
                </button>
              ))}
            </div>

            {/* Exploded View Slider */}
            <div className="lg:col-span-2 flex items-center gap-2.5 px-1">
              <label
                htmlFor="explode-slider"
                className="text-[11px] text-neutral-400 whitespace-nowrap shrink-0"
              >
                Explode
              </label>
              <input
                id="explode-slider"
                type="range"
                min={0}
                max={100}
                value={explodedPct}
                onChange={(e) => handleExplodeChange(Number(e.target.value))}
                className="dock-slider w-full"
              />
            </div>

            {/* Finishes & Audio */}
            <div className="lg:col-span-2 flex items-center justify-end gap-2">
              <div className="flex items-center gap-1.5">
                {(Object.keys(FINISH_THEMES) as FinishPresetId[]).map((presetKey) => {
                  const theme = FINISH_THEMES[presetKey];
                  const isSelected = finishId === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => handleFinishChange(presetKey)}
                      title={theme.name}
                      aria-label={`Select ${theme.name} finish`}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                        isSelected
                          ? 'border-[#D4AF37] scale-110'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${theme.plateBodyHex} 50%, ${theme.plateRingHex} 50%)`,
                      }}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={toggleAudio}
                title={audioEnabled ? 'Mute Sound' : 'Unmute Sound'}
                aria-label="Toggle sound effects"
                className="p-1.5 rounded-md bg-[#09090B] border border-white/[0.06] text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {audioEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-neutral-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

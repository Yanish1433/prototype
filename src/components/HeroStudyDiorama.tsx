import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Moon, RotateCw, Sun, Sunset } from 'lucide-react';
import { createTextureLibrary } from '../scene/textures';
import { createMaterialLibrary } from '../scene/materials';
import { createQuietStudyStation, type LampLightHandle } from '../scene/furniture';
import type { LightingMode, StudyChairMetadata } from '../types/space';

interface HeroStudyDioramaProps {
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  onReserveFromHero: () => void;
}

const HERO_CHAIR_META: StudyChairMetadata = {
  id: 'HERO-Q5',
  label: 'Quiet Desk Q5',
  roomName: 'Quiet Study Studio',
  positionLabel: 'Signature Acoustic Carrel',
  targetKind: 'chair',
  rates: {
    hourly: 100,
    daily: 500,
    weekly: 2200,
    'monthly-flex': 3800,
    'monthly-unlimited': 6500,
    'monthly-dedicated': 10000,
  },
  features: ['Acoustic Carrel', 'Brass Task Lamp', 'Upper Book Hutch'],
  worldPosition: [0, 0, 0.08],
  cameraViewPosition: [0, 1.48, 1.8],
  cameraLookTarget: [0, 0.85, 0],
  previewImage: '/assets/aistudio/Modern_Quiet_Study_Studio_627be306.png',
};

export const HeroStudyDiorama: React.FC<HeroStudyDioramaProps> = ({
  lightingMode,
  onLightingChange,
  onReserveFromHero,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lightingModeRef = useRef<LightingMode>(lightingMode);
  lightingModeRef.current = lightingMode;

  const [chairHovered, setChairHovered] = useState(false);
  const [chairPulledOut, setChairPulledOut] = useState(false);
  const chairPulledRef = useRef(false);

  const onReserveRef = useRef(onReserveFromHero);
  onReserveRef.current = onReserveFromHero;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const dayBg = new THREE.Color(0xdce5da);
    const eveBg = new THREE.Color(0x28313d);
    const nightBg = new THREE.Color(0x111923);
    scene.background = dayBg.clone();

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      40
    );

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures = createTextureLibrary(maxAniso);
    const mats = createMaterialLibrary(textures, isSoftwareGl);

    // Stage group so user can rotate the architectural desk + chair diorama smoothly
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Architectural Herringbone Pedestal Floor
    const floorDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.82, 0.08, 48),
      mats.herringboneFloor
    );
    floorDisc.position.y = -0.04;
    floorDisc.receiveShadow = true;
    stageGroup.add(floorDisc);

    const plinthTrim = new THREE.Mesh(
      new THREE.CylinderGeometry(1.83, 1.83, 0.045, 48),
      mats.brushedBrass
    );
    plinthTrim.position.y = -0.062;
    stageGroup.add(plinthTrim);

    // Subtle soft-sage backdrop wall curve behind the carrel
    const backdropWall = new THREE.Mesh(
      new THREE.BoxGeometry(1.96, 1.95, 0.09),
      mats.wallSoftGreen
    );
    backdropWall.position.set(0, 0.975, -0.92);
    backdropWall.receiveShadow = true;
    backdropWall.castShadow = true;
    stageGroup.add(backdropWall);

    const wallCap = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.05, 0.12),
      mats.wallDarkCap
    );
    wallCap.position.set(0, 1.97, -0.92);
    stageGroup.add(wallCap);

    // Build full detailed Quiet Study Carrel Table + Chair + Lamp + Books + Laptop
    const lamps: LampLightHandle[] = [];
    const station = createQuietStudyStation(mats, lamps, HERO_CHAIR_META);
    // Flip station north-facing towards viewer (+Z)
    station.group.rotation.y = 0;
    stageGroup.add(station.group);

    // Warm Lighting Rig (Day / Evening / Night)
    const hemi = new THREE.HemisphereLight(0xd9e8ec, 0x8d7d69, 1.15);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.25);
    keyLight.position.set(3.2, 4.8, 3.6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 14;
    keyLight.shadow.camera.left = -2.2;
    keyLight.shadow.camera.right = 2.2;
    keyLight.shadow.camera.top = 2.4;
    keyLight.shadow.camera.bottom = -1.6;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xc2d8e8, 0.85);
    rimLight.position.set(-3.4, 2.6, -2.2);
    scene.add(rimLight);

    // Orbit & Interactive Pointer state
    let orbitYaw = 0.54;
    let targetYaw = 0.54;
    let orbitPitch = 0.28;
    let isDragging = false;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let idlePauseUntil = 0;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const updateHitCheck = (clientX: number, clientY: number): boolean => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObject(station.hitTarget, false).length > 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      downX = e.clientX;
      downY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        targetYaw += dx * 0.008;
        orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.005, 0.14, 0.62);
        idlePauseUntil = performance.now() + 3500;
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      const hit = updateHitCheck(e.clientX, e.clientY);
      setChairHovered(hit);
      station.isHovered = hit;
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      isDragging = false;
      if (moved < 8 && updateHitCheck(e.clientX, e.clientY)) {
        chairPulledRef.current = !chairPulledRef.current;
        setChairPulledOut(chairPulledRef.current);
        station.isSelected = chairPulledRef.current;
        idlePauseUntil = performance.now() + 3000;
        if (chairPulledRef.current) {
          window.setTimeout(() => {
            onReserveRef.current();
          }, 520);
        }
      }
      renderer.domElement.style.cursor = 'grab';
    };

    const onPointerLeave = () => {
      isDragging = false;
      setChairHovered(false);
      station.isHovered = false;
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let rafId = 0;
    let disposed = false;

    const animate = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const mode = lightingModeRef.current;

      // Gentle auto turntable orbit + periodic realistic chair glide demo
      if (!prefersReducedMotion && !isDragging && performance.now() > idlePauseUntil) {
        targetYaw = 0.54 + Math.sin(elapsed * 0.34) * 0.42;
        const demoCycle = Math.sin(elapsed * 0.85);
        station.targetSlide =
          chairPulledRef.current || station.isHovered
            ? 0.36
            : demoCycle > 0.32
              ? 0.24
              : 0;
      } else {
        station.targetSlide = chairPulledRef.current ? 0.38 : station.isHovered ? 0.28 : 0;
      }

      orbitYaw = THREE.MathUtils.damp(orbitYaw, targetYaw, 5, dt);

      const radius = 3.25;
      const camX = Math.sin(orbitYaw) * Math.cos(orbitPitch) * radius;
      const camY = 0.72 + Math.sin(orbitPitch) * radius;
      const camZ = Math.cos(orbitYaw) * Math.cos(orbitPitch) * radius;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, 0.76, -0.15);

      // Spring chair slide & gentle inviting swivel
      const slideForce = (station.targetSlide - station.currentSlide) * 46 - station.slideVelocity * 9.5;
      station.slideVelocity += slideForce * dt;
      station.currentSlide += station.slideVelocity * dt;
      station.chairBody.position.z = station.restLocalPos.z + station.currentSlide;

      const desiredSwivel =
        station.isHovered || chairPulledRef.current
          ? Math.sin(elapsed * 2.2) * 0.14
          : Math.sin(elapsed * 0.9) * 0.08 * Math.max(0, station.currentSlide * 3);
      station.chairBody.rotation.y = THREE.MathUtils.damp(
        station.chairBody.rotation.y,
        desiredSwivel,
        6,
        dt
      );

      // Status ring subtle visibility
      station.statusRingMat.opacity = THREE.MathUtils.damp(
        station.statusRingMat.opacity,
        station.isHovered || chairPulledRef.current ? 0.82 : 0.38,
        8,
        dt
      );

      // Lighting mode interpolation
      const targetBg = mode === 'day' ? dayBg : mode === 'evening' ? eveBg : nightBg;
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(targetBg, 1 - Math.exp(-4 * dt));
      }

      const targetKeyInt = mode === 'day' ? 2.25 : mode === 'evening' ? 1.15 : 0.38;
      const targetHemiInt = mode === 'day' ? 1.15 : mode === 'evening' ? 0.62 : 0.34;
      keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, targetKeyInt, 4, dt);
      hemi.intensity = THREE.MathUtils.damp(hemi.intensity, targetHemiInt, 4, dt);

      const pulse = mode === 'evening' ? Math.sin(elapsed * 1.7) * 0.18 : 0;
      mats.lampBulbEmissive.emissiveIntensity = THREE.MathUtils.damp(
        mats.lampBulbEmissive.emissiveIntensity,
        (mode === 'day' ? 0.25 : mode === 'evening' ? 2.2 : 3.2) + pulse,
        4,
        dt
      );
      mats.ledStripEmissive.emissiveIntensity = THREE.MathUtils.damp(
        mats.ledStripEmissive.emissiveIntensity,
        (mode === 'day' ? 0.35 : mode === 'evening' ? 1.45 : 2.1) + pulse * 0.6,
        4,
        dt
      );
      mats.laptopScreenEmissive.emissiveIntensity = THREE.MathUtils.damp(
        mats.laptopScreenEmissive.emissiveIntensity,
        mode === 'day' ? 0.3 : mode === 'evening' ? 0.65 : 0.95,
        4,
        dt
      );
      mats.lampLightPoolMat.opacity = THREE.MathUtils.damp(
        mats.lampLightPoolMat.opacity,
        mode === 'day' ? 0.08 : mode === 'evening' ? 0.3 : 0.45,
        4,
        dt
      );
      mats.lampLightConeMat.opacity = THREE.MathUtils.damp(
        mats.lampLightConeMat.opacity,
        mode === 'day' ? 0.02 : mode === 'evening' ? 0.18 : 0.28,
        4,
        dt
      );

      for (let i = 0; i < lamps.length; i++) {
        const l = lamps[i];
        const targetInt =
          mode === 'day'
            ? l.baseIntensity
            : mode === 'evening'
              ? l.eveningIntensity + pulse
              : l.nightIntensity;
        l.light.intensity = THREE.MathUtils.damp(l.light.intensity, targetInt, 4, dt);
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
      mats.dispose();
      textures.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const isDay = lightingMode === 'day';

  return (
    <div className="relative h-[340px] sm:h-[420px] lg:h-full lg:min-h-[490px] rounded-2xl overflow-hidden border border-[#ccd7c9] dark:border-slate-700/80 bg-[#dce5da] dark:bg-[#151d26]">
      {/* Live Interactive 3D Table & Chair Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full touch-pan-y"
        aria-label="Interactive 3D walnut study desk and swivel chair model"
      />

      {/* Top Interactive Lighting Switcher inside 3D Showcase */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
        <div
          className={`pointer-events-auto flex items-center gap-1 p-1 rounded-xl border backdrop-blur-md transition-colors ${
            isDay
              ? 'bg-[#f4f1ea]/90 border-stone-300/80 text-stone-800'
              : 'bg-[#14191f]/85 border-slate-700/80 text-stone-100'
          }`}
          role="group"
          aria-label="Preview lighting mode on 3D study desk"
        >
          {(
            [
              { id: 'day', label: 'Day', Icon: Sun },
              { id: 'evening', label: 'Evening', Icon: Sunset },
              { id: 'night', label: 'Night', Icon: Moon },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = lightingMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onLightingChange(id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#2e473b] text-white dark:bg-[#8fb09c] dark:text-[#111914]'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <span
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md ${
            isDay
              ? 'bg-[#f4f1ea]/88 border-stone-300/80 text-stone-700'
              : 'bg-[#14191f]/82 border-slate-700/80 text-stone-200'
          }`}
        >
          <RotateCw className="w-3 h-3 shrink-0" />
          <span>Drag to inspect</span>
        </span>
      </div>

      {/* Bottom Action Strip anchored cleanly on the 3D Desk Showcase */}
      <div
        className={`absolute bottom-3.5 left-3.5 right-3.5 px-4 py-3 rounded-xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
          isDay
            ? 'bg-[#f4f1ea]/92 border-stone-300/90 text-stone-900'
            : 'bg-[#14191f]/90 border-slate-700/80 text-stone-100'
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#4a6352] dark:text-[#98b8a2]">
            {chairHovered
              ? 'Chair Ready · Click to Glide & Reserve'
              : chairPulledOut
                ? 'Opening Quiet Study Studio in 3D...'
                : 'Quiet Desk Carrel · Brass Lamp · Upper Book Hutch'}
          </p>
          <p className="font-display text-sm sm:text-base font-semibold truncate">
            Live 3D Chair Animation · NPR 100/hr to NPR 10,000/mo
          </p>
        </div>

        <button
          type="button"
          onClick={onReserveFromHero}
          className="px-4 py-2 rounded-lg bg-[#2e473b] hover:bg-[#23382e] dark:bg-[#8fb09c] dark:hover:bg-[#a2c2ae] text-white dark:text-[#111914] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          Book This Desk in 3D
        </button>
      </div>
    </div>
  );
};

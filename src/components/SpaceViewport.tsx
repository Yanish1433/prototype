import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createTextureLibrary } from '../scene/textures';
import { createMaterialLibrary } from '../scene/materials';
import { buildArchitecturalFloorplan, type ColliderBox } from '../scene/floorplan';
import { createLightingRig } from '../scene/lighting';
import type { BookableChairHandle, InteractiveNoticeTarget } from '../scene/furniture';
import {
  formatNpr,
  type BookingRecord,
  type CameraPresetId,
  type HoveredTargetState,
  type LightingMode,
  type MapNavigateRequest,
  type MovementInputState,
  type PlayerPose,
  type StudyChairMetadata,
} from '../types/space';

interface SpaceViewportProps {
  isActive?: boolean;
  lightingMode: LightingMode;
  activePreset: CameraPresetId;
  presetTrigger: number;
  selectedChairId: string | null;
  focusChairRequest: { chairId: string; seq: number } | null;
  mapNavigateRequest: MapNavigateRequest | null;
  isGuideOpen: boolean;
  bookings: BookingRecord[];
  movementInputRef: React.MutableRefObject<MovementInputState>;
  onSelectChair: (chair: StudyChairMetadata) => void;
  onOpenGuide: () => void;
  onNoticeMessage: (msg: string) => void;
  onCatalogReady: (catalog: Record<string, StudyChairMetadata>) => void;
  onRoomChange: (roomName: string) => void;
  onPoseChange: (pose: PlayerPose) => void;
  onUserCameraOverride: () => void;
}

interface CameraGoal {
  active: boolean;
  pos: THREE.Vector3;
  yaw: number;
  pitch: number;
  isOverview: boolean;
}

const PRESET_VIEWS: Record<
  CameraPresetId,
  { pos: [number, number, number]; look: [number, number, number]; isOverview?: boolean }
> = {
  entrance: {
    pos: [2.85, 1.62, -4.25],
    look: [1.9, 1.25, -0.5],
  },
  reception: {
    pos: [1.25, 1.62, 0.85],
    look: [1.3, 1.15, -1.2],
  },
  'quiet-studio': {
    pos: [3.85, 1.62, -0.7],
    look: [6.7, 1.05, -0.95],
  },
  'reading-hall': {
    pos: [-1.35, 1.65, 0.0],
    look: [-5.6, 1.05, 0.0],
  },
  'innovation-hub': {
    pos: [4.05, 1.62, 3.8],
    look: [6.6, 1.15, 3.8],
  },
  overview: {
    pos: [0.2, 14.5, 11.8],
    look: [0.0, 0.0, 0.0],
    isOverview: true,
  },
};

function computeYawPitch(from: THREE.Vector3, to: THREE.Vector3) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const horiz = Math.hypot(dx, dz) || 0.0001;
  const yaw = Math.atan2(-dx, -dz);
  const pitch = THREE.MathUtils.clamp(Math.atan2(dy, horiz), -1.15, 1.15);
  return { yaw, pitch };
}

function resolveRoomName(x: number, y: number, z: number): string {
  if (y > 4.2) return 'Architectural 3D Overview';
  if (x < -0.6) return 'Main Reading Hall & Lounge';
  if (x >= 3.4 && z >= -3.3 && z < 1.3) return 'Quiet Study Studio';
  if (x >= 3.4 && z >= 1.3) return 'Innovation Hub';
  if (x >= 2.1 && z < -3.3) return 'Main Entrance · Corridor';
  if (x < 2.1 && z < -2.9) return 'Upper Pantry / Break Room';
  if (x < 1.6 && z >= 2.85) return 'Lower Pantry / Break Room';
  if (x >= 1.6 && x < 3.4 && z >= 2.85) return 'Bathroom / W.C.';
  return 'Reception / Lobby';
}

function checkColliders(x: number, z: number, colliders: ColliderBox[], radius = 0.28): boolean {
  if (x < -8.65 || x > 8.65 || z < -5.9 || z > 5.9) return true;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (
      x + radius > c.minX &&
      x - radius < c.maxX &&
      z + radius > c.minZ &&
      z - radius < c.maxZ
    ) {
      return true;
    }
  }
  return false;
}

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _proj = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _mouseNdc = new THREE.Vector2();
const _targetColor = new THREE.Color();

type PickResult =
  | { kind: 'chair'; chair: BookableChairHandle }
  | { kind: 'innovation-chair'; notice: InteractiveNoticeTarget }
  | { kind: 'sofa'; notice: InteractiveNoticeTarget }
  | { kind: 'receptionist' }
  | null;

export const SpaceViewport: React.FC<SpaceViewportProps> = ({
  isActive = true,
  lightingMode,
  activePreset,
  presetTrigger,
  selectedChairId,
  focusChairRequest,
  mapNavigateRequest,
  isGuideOpen,
  bookings,
  movementInputRef,
  onSelectChair,
  onOpenGuide,
  onNoticeMessage,
  onCatalogReady,
  onRoomChange,
  onPoseChange,
  onUserCameraOverride,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredTarget, setHoveredTarget] = useState<HoveredTargetState | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webglError, setWebglError] = useState<string | null>(null);

  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;
  const resumeLoopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isActive && resumeLoopRef.current) {
      resumeLoopRef.current();
    }
  }, [isActive]);

  const lightingModeRef = useRef<LightingMode>(lightingMode);
  lightingModeRef.current = lightingMode;

  const selectedChairIdRef = useRef<string | null>(selectedChairId);
  selectedChairIdRef.current = selectedChairId;

  const isGuideOpenRef = useRef<boolean>(isGuideOpen);
  isGuideOpenRef.current = isGuideOpen;

  const bookingsRef = useRef<BookingRecord[]>(bookings);
  bookingsRef.current = bookings;

  const activePresetRef = useRef<CameraPresetId>(activePreset);
  activePresetRef.current = activePreset;

  const onSelectChairRef = useRef(onSelectChair);
  onSelectChairRef.current = onSelectChair;

  const onOpenGuideRef = useRef(onOpenGuide);
  onOpenGuideRef.current = onOpenGuide;

  const onNoticeMessageRef = useRef(onNoticeMessage);
  onNoticeMessageRef.current = onNoticeMessage;

  const onCatalogReadyRef = useRef(onCatalogReady);
  onCatalogReadyRef.current = onCatalogReady;

  const onRoomChangeRef = useRef(onRoomChange);
  onRoomChangeRef.current = onRoomChange;

  const onPoseChangeRef = useRef(onPoseChange);
  onPoseChangeRef.current = onPoseChange;

  const onUserCameraOverrideRef = useRef(onUserCameraOverride);
  onUserCameraOverrideRef.current = onUserCameraOverride;

  const cameraGoalRef = useRef<CameraGoal>({
    active: false,
    pos: new THREE.Vector3(...PRESET_VIEWS.entrance.pos),
    yaw: 0,
    pitch: 0,
    isOverview: false,
  });

  const allTargetsRef = useRef<StudyChairMetadata[]>([]);

  useEffect(() => {
    if (presetTrigger === 0) return;
    const spec = PRESET_VIEWS[activePresetRef.current];
    const from = new THREE.Vector3(...spec.pos);
    const to = new THREE.Vector3(...spec.look);
    const { yaw, pitch } = computeYawPitch(from, to);
    cameraGoalRef.current = {
      active: true,
      pos: from,
      yaw,
      pitch,
      isOverview: Boolean(spec.isOverview),
    };
  }, [presetTrigger]);

  useEffect(() => {
    if (!focusChairRequest) return;
    const target = allTargetsRef.current.find((c) => c.id === focusChairRequest.chairId);
    if (!target) return;
    const viewPos = new THREE.Vector3(...target.cameraViewPosition);
    const lookAt = new THREE.Vector3(...target.cameraLookTarget);
    const { yaw, pitch } = computeYawPitch(viewPos, lookAt);
    cameraGoalRef.current = {
      active: true,
      pos: viewPos,
      yaw,
      pitch,
      isOverview: false,
    };
  }, [focusChairRequest]);

  useEffect(() => {
    if (!mapNavigateRequest) return;
    const pos = new THREE.Vector3(mapNavigateRequest.x, 1.62, mapNavigateRequest.z);
    const look = new THREE.Vector3(
      mapNavigateRequest.lookX ?? mapNavigateRequest.x,
      1.22,
      mapNavigateRequest.lookZ ?? mapNavigateRequest.z - 1.5
    );
    const { yaw, pitch } = computeYawPitch(pos, look);
    cameraGoalRef.current = {
      active: true,
      pos,
      yaw,
      pitch,
      isOverview: false,
    };
  }, [mapNavigateRequest]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')) as WebGLRenderingContext | null;
        if (!gl) return false;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      console.error('Failed to initialize WebGLRenderer', err);
      setWebglError(
        'Unable to initialize 3D graphics in your browser. Please check that hardware acceleration is enabled.'
      );
      setLoading(false);
      return;
    }

    const initW = container.clientWidth || window.innerWidth || 1280;
    const initH = container.clientHeight || window.innerHeight || 800;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(58, initW / initH, 0.1, 120);

    const initSpec = PRESET_VIEWS[activePresetRef.current] ?? PRESET_VIEWS.entrance;
    const initPos = new THREE.Vector3(...initSpec.pos);
    const initLook = new THREE.Vector3(...initSpec.look);
    const initAngles = computeYawPitch(initPos, initLook);
    let camYaw = initAngles.yaw;
    let camPitch = initAngles.pitch;
    camera.position.copy(initPos);
    _euler.set(camPitch, camYaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(_euler);

    const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const textures = createTextureLibrary(maxAniso);
    const materials = createMaterialLibrary(textures, isSoftwareGl);
    const floorplan = buildArchitecturalFloorplan(materials);
    scene.add(floorplan.root);

    // Expose complete catalog of bookable chairs + Innovation Hub full room to App
    const catalogMap: Record<string, StudyChairMetadata> = {};
    const list: StudyChairMetadata[] = [];
    for (const ch of floorplan.bookableChairs) {
      catalogMap[ch.metadata.id] = ch.metadata;
      list.push(ch.metadata);
    }
    catalogMap[floorplan.roomBookingMeta.id] = floorplan.roomBookingMeta;
    list.push(floorplan.roomBookingMeta);
    allTargetsRef.current = list;
    onCatalogReadyRef.current(catalogMap);

    const lighting = createLightingRig(scene, renderer, materials, floorplan, isSoftwareGl);

    // Raycaster checks walls (for occlusion) + all bookable chairs + sofa/Innovation proxies + Receptionist Maya
    const raycaster = new THREE.Raycaster();
    const chairById = new Map<string, BookableChairHandle>();
    const pickTargets: THREE.Object3D[] = [...floorplan.wallMeshes, floorplan.receptionist.hitTarget];

    for (const ch of floorplan.bookableChairs) {
      chairById.set(ch.metadata.id, ch);
      pickTargets.push(ch.hitTarget);
    }
    const noticeById = new Map<string, InteractiveNoticeTarget>();
    for (const n of floorplan.noticeTargets) {
      noticeById.set(n.id, n);
      pickTargets.push(n.hitTarget);
    }

    const keysPressed: Record<string, boolean> = {};
    let isPointerDown = false;
    let downX = 0;
    let downY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastHoverCheck = 0;
    let currentHoveredId: string | null = null;
    let lastReportedRoom = '';
    let lastPoseReportTime = 0;
    let lastPoseX = 999;
    let lastPoseZ = 999;
    let lastPoseYaw = 999;
    let lastPoseY = 999;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      keysPressed[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.code] = false;
    };

    const updateMouseNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouseNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _mouseNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pickUnderPointer = (clientX: number, clientY: number): PickResult => {
      updateMouseNdc(clientX, clientY);
      raycaster.setFromCamera(_mouseNdc, camera);
      const intersects = raycaster.intersectObjects(pickTargets, false);
      if (intersects.length === 0) return null;

      const first = intersects[0].object;
      const kind = first.userData.interactiveKind as string | undefined;
      if (!kind) {
        // Wall blocked the ray
        return null;
      }

      if (kind === 'chair') {
        const chair = chairById.get(first.userData.bookableChairId as string);
        return chair ? { kind: 'chair', chair } : null;
      }

      if (kind === 'receptionist') {
        return { kind: 'receptionist' };
      }

      if (kind === 'innovation-chair' || kind === 'sofa') {
        const notice = noticeById.get(first.userData.interactiveId as string);
        return notice ? { kind, notice } : null;
      }

      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.target !== renderer.domElement) return;
      isPointerDown = true;
      downX = e.clientX;
      downY = e.clientY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isPointerDown) {
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        const totalDist = Math.hypot(e.clientX - downX, e.clientY - downY);
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;

        if (totalDist > 5) {
          cameraGoalRef.current.active = false;
          onUserCameraOverrideRef.current();
          camYaw += dx * 0.0038;
          camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.0032, -1.18, 0.95);
          if (currentHoveredId !== null) {
            currentHoveredId = null;
            setHoveredTarget(null);
          }
        }
      }

      const now = performance.now();
      if (now - lastHoverCheck > 40) {
        lastHoverCheck = now;
        const pick = pickUnderPointer(e.clientX, e.clientY);
        const rect = renderer.domElement.getBoundingClientRect();

        if (pick?.kind === 'chair') {
          const chair = pick.chair;
          currentHoveredId = chair.metadata.id;
          renderer.domElement.style.cursor = 'pointer';
          _proj.set(chair.metadata.worldPosition[0], 1.1, chair.metadata.worldPosition[2]);
          _proj.project(camera);
          const booked = bookingsRef.current.find((b) => b.chairId === chair.metadata.id);
          setHoveredTarget({
            id: chair.metadata.id,
            title: chair.metadata.label,
            subtitle: booked
              ? `Reserved · ${booked.referenceCode}`
              : `${formatNpr(chair.metadata.rates.hourly)}/hr · Click chair to book`,
            screenX: ((_proj.x + 1) / 2) * rect.width,
            screenY: ((-_proj.y + 1) / 2) * rect.height,
            kind: 'chair',
          });
        } else if (pick?.kind === 'innovation-chair') {
          currentHoveredId = pick.notice.id;
          renderer.domElement.style.cursor = 'pointer';
          _proj.set(pick.notice.worldPosition[0], 1.1, pick.notice.worldPosition[2]);
          _proj.project(camera);
          const hubBooked = bookingsRef.current.find(
            (b) => b.chairId === floorplan.roomBookingMeta.id
          );
          setHoveredTarget({
            id: pick.notice.id,
            title: pick.notice.title,
            subtitle: hubBooked
              ? `Room Reserved · ${hubBooked.referenceCode}`
              : `${formatNpr(floorplan.roomBookingMeta.rates.hourly)}/hr · Book whole room`,
            screenX: ((_proj.x + 1) / 2) * rect.width,
            screenY: ((-_proj.y + 1) / 2) * rect.height,
            kind: 'innovation-chair',
          });
        } else if (pick?.kind === 'receptionist') {
          currentHoveredId = 'RECEPTIONIST-MAYA';
          renderer.domElement.style.cursor = 'pointer';
          const rPos = floorplan.receptionist.worldPosition;
          _proj.set(rPos[0], 1.72, rPos[2]);
          _proj.project(camera);
          setHoveredTarget({
            id: 'RECEPTIONIST-MAYA',
            title: 'Maya · Receptionist Guide',
            subtitle: 'Click for personalized seat & room guidance',
            screenX: ((_proj.x + 1) / 2) * rect.width,
            screenY: ((-_proj.y + 1) / 2) * rect.height,
            kind: 'receptionist',
          });
        } else if (pick?.kind === 'sofa') {
          currentHoveredId = pick.notice.id;
          renderer.domElement.style.cursor = 'not-allowed';
          _proj.set(pick.notice.worldPosition[0], 0.95, pick.notice.worldPosition[2]);
          _proj.project(camera);
          setHoveredTarget({
            id: pick.notice.id,
            title: pick.notice.title,
            subtitle: pick.notice.subtitle,
            screenX: ((_proj.x + 1) / 2) * rect.width,
            screenY: ((-_proj.y + 1) / 2) * rect.height,
            kind: 'sofa',
          });
        } else {
          if (currentHoveredId !== null) {
            currentHoveredId = null;
            setHoveredTarget(null);
          }
          renderer.domElement.style.cursor = isPointerDown ? 'grabbing' : 'grab';
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const tapDist = Math.hypot(e.clientX - downX, e.clientY - downY);
      isPointerDown = false;
      if (tapDist > 14) return;

      currentHoveredId = null;
      setHoveredTarget(null);

      const pick = pickUnderPointer(e.clientX, e.clientY);
      if (pick?.kind === 'chair') {
        const chair = pick.chair;
        const viewPos = new THREE.Vector3(...chair.metadata.cameraViewPosition);
        const lookAt = new THREE.Vector3(...chair.metadata.cameraLookTarget);
        const { yaw, pitch } = computeYawPitch(viewPos, lookAt);
        cameraGoalRef.current = {
          active: true,
          pos: viewPos,
          yaw,
          pitch,
          isOverview: false,
        };
        onSelectChairRef.current(chair.metadata);
      } else if (pick?.kind === 'receptionist') {
        const rPos = floorplan.receptionist.worldPosition;
        const viewPos = new THREE.Vector3(1.62, 1.56, 0.08);
        const lookAt = new THREE.Vector3(rPos[0], 1.28, rPos[2]);
        const { yaw, pitch } = computeYawPitch(viewPos, lookAt);
        cameraGoalRef.current = {
          active: true,
          pos: viewPos,
          yaw,
          pitch,
          isOverview: false,
        };
        onOpenGuideRef.current();
      } else if (pick?.kind === 'innovation-chair') {
        const roomMeta = floorplan.roomBookingMeta;
        const viewPos = new THREE.Vector3(...roomMeta.cameraViewPosition);
        const lookAt = new THREE.Vector3(...roomMeta.cameraLookTarget);
        const { yaw, pitch } = computeYawPitch(viewPos, lookAt);
        cameraGoalRef.current = {
          active: true,
          pos: viewPos,
          yaw,
          pitch,
          isOverview: false,
        };
        onNoticeMessageRef.current(
          'Individual Innovation Hub chairs cannot be sold separately — opened full-room booking.'
        );
        onSelectChairRef.current(roomMeta);
      } else if (pick?.kind === 'sofa') {
        onNoticeMessageRef.current(
          'Sofas and window benches are shared lounge seating and cannot be booked individually.'
        );
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraGoalRef.current.active = false;
      onUserCameraOverrideRef.current();

      const step = -Math.sign(e.deltaY) * 0.65;
      if (camera.position.y > 3.5) {
        _forward.set(0, 0, -1).applyEuler(_euler).normalize();
        const nextPos = camera.position.clone().addScaledVector(_forward, step * 1.6);
        if (nextPos.y >= 1.62 && nextPos.y <= 22) {
          camera.position.copy(nextPos);
        }
      } else {
        _forward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw)).normalize();
        const nx = camera.position.x + _forward.x * step * 0.7;
        const nz = camera.position.z + _forward.z * step * 0.7;
        if (!checkColliders(nx, camera.position.z, floorplan.colliders)) {
          camera.position.x = nx;
        }
        if (!checkColliders(camera.position.x, nz, floorplan.colliders)) {
          camera.position.z = nz;
        }
      }
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let initialFrameRendered = false;

    function resumeLoop() {
      if (disposed) return;
      onResize();
      if (frameId === 0) {
        clock.start();
        frameId = requestAnimationFrame(tick);
      }
    }
    resumeLoopRef.current = resumeLoop;

    function tick() {
      if (disposed) return;

      // When inactive and initial pre-warm frame is rendered, pause loop to save 100% CPU/GPU
      if (!isActiveRef.current && initialFrameRendered) {
        frameId = 0;
        return;
      }
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.08);
      const elapsed = clock.elapsedTime;

      const mov = movementInputRef.current;
      const moveFwd =
        (keysPressed['KeyW'] || keysPressed['ArrowUp'] || mov.forward ? 1 : 0) -
        (keysPressed['KeyS'] || keysPressed['ArrowDown'] || mov.backward ? 1 : 0);
      const moveSide =
        (keysPressed['KeyD'] || keysPressed['ArrowRight'] || mov.right ? 1 : 0) -
        (keysPressed['KeyA'] || keysPressed['ArrowLeft'] || mov.left ? 1 : 0);
      const turnDir =
        (keysPressed['KeyQ'] || mov.turnLeft ? 1 : 0) -
        (keysPressed['KeyE'] || mov.turnRight ? 1 : 0);

      if (moveFwd !== 0 || moveSide !== 0 || turnDir !== 0) {
        cameraGoalRef.current.active = false;
        onUserCameraOverrideRef.current();

        if (camera.position.y > 2.2) {
          camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.62, 5.0, dt);
          camPitch = THREE.MathUtils.damp(camPitch, -0.06, 5.0, dt);
        }

        if (turnDir !== 0) {
          camYaw += turnDir * 1.65 * dt;
        }

        const speed = keysPressed['ShiftLeft'] || keysPressed['ShiftRight'] ? 4.8 : 3.2;
        _forward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw)).normalize();
        _right.set(Math.cos(camYaw), 0, -Math.sin(camYaw)).normalize();

        const vx = (_forward.x * moveFwd + _right.x * moveSide) * speed * dt;
        const vz = (_forward.z * moveFwd + _right.z * moveSide) * speed * dt;

        if (!checkColliders(camera.position.x + vx, camera.position.z, floorplan.colliders)) {
          camera.position.x += vx;
        }
        if (!checkColliders(camera.position.x, camera.position.z + vz, floorplan.colliders)) {
          camera.position.z += vz;
        }
      }

      const goal = cameraGoalRef.current;
      if (goal.active) {
        const k = 4.8;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.pos.x, k, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.pos.y, k, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.pos.z, k, dt);

        let yawDiff = ((goal.yaw - camYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
        if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        camYaw += yawDiff * (1 - Math.exp(-k * dt));
        camPitch = THREE.MathUtils.damp(camPitch, goal.pitch, k, dt);

        if (
          camera.position.distanceTo(goal.pos) < 0.015 &&
          Math.abs(yawDiff) < 0.008 &&
          Math.abs(goal.pitch - camPitch) < 0.008
        ) {
          goal.active = false;
        }
      }

      _euler.set(camPitch, camYaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(_euler);

      const ceilingTargetOpacity = THREE.MathUtils.clamp(
        1 - (camera.position.y - 2.65) / 1.15,
        0,
        1
      );
      materials.ceilingPanel.opacity = THREE.MathUtils.damp(
        materials.ceilingPanel.opacity,
        ceilingTargetOpacity,
        6.0,
        dt
      );
      floorplan.ceilingGroup.visible = materials.ceilingPanel.opacity > 0.03;

      // Spring-animated pull-out, welcoming swivel, and subtle rolling lift for every bookable chair
      const bookedSet = new Set(bookingsRef.current.map((b) => b.chairId));
      const activeSel = selectedChairIdRef.current;
      const subDt = Math.min(dt, 0.04);

      for (let i = 0; i < floorplan.bookableChairs.length; i++) {
        const ch = floorplan.bookableChairs[i];
        ch.isSelected = ch.metadata.id === activeSel;
        ch.isBooked = bookedSet.has(ch.metadata.id);
        ch.isHovered = ch.metadata.id === currentHoveredId;

        ch.targetSlide = ch.isSelected ? 1.0 : ch.isHovered ? 0.32 : 0.0;
        const slideForce = (ch.targetSlide - ch.currentSlide) * 145 - ch.slideVelocity * 15.5;
        ch.slideVelocity += slideForce * subDt;
        ch.currentSlide += ch.slideVelocity * subDt;

        const targetSwivel = ch.isSelected ? 0.38 : ch.isHovered ? 0.14 : 0.0;
        const swivelForce = (targetSwivel - ch.currentSwivel) * 120 - ch.swivelVelocity * 13.5;
        ch.swivelVelocity += swivelForce * subDt;
        ch.currentSwivel += ch.swivelVelocity * subDt;

        const rollLift = Math.min(0.016, Math.abs(ch.slideVelocity) * 0.005);
        ch.chairBody.position.set(
          ch.restLocalPos.x + ch.pullOutOffset.x * ch.currentSlide,
          rollLift,
          ch.restLocalPos.z + ch.pullOutOffset.z * ch.currentSlide
        );
        ch.chairBody.rotation.y = ch.baseRotationY + ch.currentSwivel;

        if (ch.isSelected) {
          _targetColor.setHex(0xf59e0b);
          ch.statusRingMat.emissiveIntensity = THREE.MathUtils.damp(
            ch.statusRingMat.emissiveIntensity,
            1.15,
            8,
            dt
          );
          ch.statusRingMat.opacity = THREE.MathUtils.damp(ch.statusRingMat.opacity, 0.94, 8, dt);
        } else if (ch.isBooked) {
          _targetColor.setHex(0xc2410c);
          ch.statusRingMat.emissiveIntensity = THREE.MathUtils.damp(
            ch.statusRingMat.emissiveIntensity,
            0.48,
            8,
            dt
          );
          ch.statusRingMat.opacity = THREE.MathUtils.damp(ch.statusRingMat.opacity, 0.72, 8, dt);
        } else if (ch.isHovered) {
          _targetColor.setHex(0x10b981);
          ch.statusRingMat.emissiveIntensity = THREE.MathUtils.damp(
            ch.statusRingMat.emissiveIntensity,
            0.9,
            8,
            dt
          );
          ch.statusRingMat.opacity = THREE.MathUtils.damp(ch.statusRingMat.opacity, 0.88, 8, dt);
        } else {
          _targetColor.setHex(0x4b7a62);
          ch.statusRingMat.emissiveIntensity = THREE.MathUtils.damp(
            ch.statusRingMat.emissiveIntensity,
            0.18,
            8,
            dt
          );
          ch.statusRingMat.opacity = THREE.MathUtils.damp(ch.statusRingMat.opacity, 0.42, 8, dt);
        }
        ch.statusRingMat.color.lerp(_targetColor, 1 - Math.exp(-8 * dt));
        ch.statusRingMat.emissive.lerp(_targetColor, 1 - Math.exp(-8 * dt));
      }

      floorplan.receptionist.update(
        elapsed,
        isGuideOpenRef.current || currentHoveredId === 'RECEPTIONIST-MAYA',
        camera.position.x,
        camera.position.z
      );

      lighting.update(lightingModeRef.current, dt, elapsed, activeSel || currentHoveredId);

      const roomNow = resolveRoomName(
        camera.position.x,
        camera.position.y,
        camera.position.z
      );
      if (roomNow !== lastReportedRoom) {
        lastReportedRoom = roomNow;
        onRoomChangeRef.current(roomNow);
      }

      const nowMs = performance.now();
      if (
        nowMs - lastPoseReportTime > 65 &&
        (Math.abs(camera.position.x - lastPoseX) > 0.04 ||
          Math.abs(camera.position.z - lastPoseZ) > 0.04 ||
          Math.abs(camera.position.y - lastPoseY) > 0.08 ||
          Math.abs(camYaw - lastPoseYaw) > 0.03)
      ) {
        lastPoseReportTime = nowMs;
        lastPoseX = camera.position.x;
        lastPoseY = camera.position.y;
        lastPoseZ = camera.position.z;
        lastPoseYaw = camYaw;
        onPoseChangeRef.current({
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
          yaw: camYaw,
        });
      }

      renderer.render(scene, camera);

      if (!initialFrameRendered) {
        initialFrameRendered = true;
        setLoading(false);
      }

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      resumeLoopRef.current = null;
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      lighting.dispose();
      materials.dispose();
      textures.dispose();
      envTex.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [movementInputRef]);

  return (
    <div className="relative w-screen h-dvh overflow-hidden">
      <div ref={mountRef} className="w-full h-full touch-none" />

      {loading && !webglError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-950/95 text-stone-100 transition-opacity duration-300">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
            <div className="space-y-1">
              <h3 className="font-serif text-lg tracking-wide text-amber-100">Entering 3D Sanctuary</h3>
              <p className="text-xs text-stone-400 font-mono">Initializing architectural floorplan...</p>
            </div>
          </div>
        </div>
      )}

      {webglError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-stone-950 p-6 text-stone-100">
          <div className="max-w-md text-center space-y-4">
            <h2 className="font-display text-xl font-semibold text-amber-400">WebGL Acceleration Needed</h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              {webglError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-amber-500 text-stone-950 font-semibold text-xs tracking-wider uppercase hover:bg-amber-400 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/90 text-stone-100 p-6">
          <div className="max-w-md text-center space-y-2">
            <h2 className="font-display text-xl font-semibold">3D Graphics Context Paused</h2>
            <p className="text-sm text-stone-300">
              Your browser paused WebGL rendering. Reload or switch back to this tab to resume
              the interactive 3D walkthrough.
            </p>
          </div>
        </div>
      )}

      {hoveredTarget && !selectedChairId && (
        <div
          className={`pointer-events-none absolute z-20 -translate-x-1/2 transition-opacity duration-150 ${
            hoveredTarget.screenY < 138 ? 'translate-y-3' : '-translate-y-full pb-2.5'
          }`}
          style={{
            left: `${Math.min(window.innerWidth - 126, Math.max(126, hoveredTarget.screenX))}px`,
            top: `${
              hoveredTarget.screenY < 138
                ? Math.max(66, hoveredTarget.screenY)
                : Math.min(window.innerHeight - 135, hoveredTarget.screenY)
            }px`,
          }}
        >
          <div
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border shadow-lg text-left max-w-[235px] sm:max-w-[280px] ${
              lightingMode === 'day'
                ? 'bg-stone-50/95 border-stone-300 text-stone-900'
                : 'bg-stone-900/95 border-stone-700 text-stone-100'
            }`}
          >
            <div className="text-xs font-semibold tracking-tight truncate">
              {hoveredTarget.title}
            </div>
            <div className="text-[11px] font-mono-tabular opacity-85 truncate">
              {hoveredTarget.subtitle}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

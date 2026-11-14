import * as THREE from 'three';
import type { MaterialLibrary } from './materials';
import {
  createBookshelfUnit,
  createBrassDomeLamp,
  createDoorwayDoor,
  createDoorwayPlaque,
  createEspressoStation,
  createFloorLamp,
  createKitchenAppliances,
  createLinearPendantLight,
  createLoungeArmchair,
  createLoungeSofa,
  createMarbleTable,
  createNonBookableProxy,
  createPottedPlant,
  createQuietStudyStation,
  createReceptionDesk,
  createReceptionistHelper,
  createSwivelChairGroup,
  createTrailingShelfPlant,
  createWallArtFrame,
  createWallSconce,
  createWoodStudyTable,
  makeBookableChairInstance,
  type BookableChairHandle,
  type InteractiveNoticeTarget,
  type LampLightHandle,
  type ReceptionistHandle,
} from './furniture';
import type { BookingPlan, StudyChairMetadata } from '../types/space';

const STANDARD_SEAT_RATES: Record<BookingPlan, number> = {
  hourly: 100,
  daily: 500,
  weekly: 2200,
  'monthly-flex': 3800,
  'monthly-unlimited': 6500,
  'monthly-dedicated': 10000,
};

const INNOVATION_HUB_RATES: Record<BookingPlan, number> = {
  hourly: 1200,
  daily: 6000,
  weekly: 26000,
  'monthly-flex': 45000,
  'monthly-unlimited': 75000,
  'monthly-dedicated': 110000,
};

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface FloorplanSceneData {
  root: THREE.Group;
  ceilingGroup: THREE.Group;
  bookableChairs: BookableChairHandle[];
  roomBookingMeta: StudyChairMetadata;
  noticeTargets: InteractiveNoticeTarget[];
  receptionist: ReceptionistHandle;
  wallMeshes: THREE.Mesh[];
  lamps: LampLightHandle[];
  colliders: ColliderBox[];
  windowGlassMeshes: THREE.Mesh[];
  exteriorSkyBackdrop: THREE.Mesh;
  exteriorSkyMat: THREE.MeshBasicMaterial;
}

const WALL_H = 3.15;
const WALL_T = 0.2;

function computeChairCameraView(
  x: number,
  z: number,
  facingRotY: number,
  dist = 1.65
): { camPos: [number, number, number]; lookAt: [number, number, number] } {
  // Chair backrest is at local -Z, front is local +Z.
  // Camera frames from behind/beside the chair looking towards chair & table!
  const backX = -Math.sin(facingRotY);
  const backZ = -Math.cos(facingRotY);
  const sideX = Math.cos(facingRotY);
  const sideZ = -Math.sin(facingRotY);
  const cx = THREE.MathUtils.clamp(x + backX * dist + sideX * 0.45, -8.4, 8.4);
  const cz = THREE.MathUtils.clamp(z + backZ * dist + sideZ * 0.45, -5.6, 5.6);
  return {
    camPos: [cx, 1.52, cz],
    lookAt: [x, 0.72, z],
  };
}

function addWallSegment(
  parent: THREE.Group,
  colliders: ColliderBox[],
  wallMeshes: THREE.Mesh[],
  mats: MaterialLibrary,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  height = WALL_H,
  thickness = WALL_T,
  baseY = 0,
  wallMat: THREE.Material = mats.wallPlaster
) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  if (length < 0.01) return;

  const angle = Math.atan2(dx, dz);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;

  const group = new THREE.Group();
  group.position.set(cx, baseY, cz);
  group.rotation.y = angle;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, height, length),
    wallMat
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  wallMeshes.push(body);

  if (baseY === 0 && height >= WALL_H - 0.1) {
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(thickness + 0.04, 0.07, length + 0.04),
      mats.wallDarkCap
    );
    cap.position.y = height + 0.035;
    group.add(cap);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(thickness + 0.018, 0.09, length),
      mats.darkAnodized
    );
    trim.position.y = 0.045;
    group.add(trim);
  }

  parent.add(group);

  if (baseY < 1.2) {
    const minX = Math.min(x1, x2) - thickness / 2;
    const maxX = Math.max(x1, x2) + thickness / 2;
    const minZ = Math.min(z1, z2) - thickness / 2;
    const maxZ = Math.max(z1, z2) + thickness / 2;
    colliders.push({ minX, maxX, minZ, maxZ });
  }
}

function addWindowWallSegment(
  parent: THREE.Group,
  colliders: ColliderBox[],
  wallMeshes: THREE.Mesh[],
  mats: MaterialLibrary,
  glassOut: THREE.Mesh[],
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  sillH = 0.72,
  headH = 2.48
) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;

  addWallSegment(parent, colliders, wallMeshes, mats, x1, z1, x2, z2, sillH, WALL_T, 0);
  addWallSegment(
    parent,
    colliders,
    wallMeshes,
    mats,
    x1,
    z1,
    x2,
    z2,
    WALL_H - headH,
    WALL_T,
    headH
  );

  const capGroup = new THREE.Group();
  capGroup.position.set(cx, WALL_H + 0.035, cz);
  capGroup.rotation.y = angle;
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_T + 0.04, 0.07, length + 0.04),
    mats.wallDarkCap
  );
  capGroup.add(cap);

  const frameH = headH - sillH;
  const frameGroup = new THREE.Group();
  frameGroup.position.set(cx, sillH + frameH / 2, cz);
  frameGroup.rotation.y = angle;

  const sillBoard = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_T + 0.04, 0.04, length),
    mats.walnutWood
  );
  sillBoard.position.y = -frameH / 2 + 0.02;
  frameGroup.add(sillBoard);

  for (const mPos of [-length / 2 + 0.03, 0, length / 2 - 0.03]) {
    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, frameH, 0.045),
      mats.darkAnodized
    );
    mullion.position.z = mPos;
    frameGroup.add(mullion);
  }

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(length - 0.06, frameH - 0.05),
    mats.glassWindow
  );
  glass.rotation.y = Math.PI / 2;
  glass.renderOrder = 3;
  frameGroup.add(glass);
  glassOut.push(glass);

  parent.add(capGroup);
  parent.add(frameGroup);
}

function addWallWithDoorway(
  parent: THREE.Group,
  colliders: ColliderBox[],
  wallMeshes: THREE.Mesh[],
  mats: MaterialLibrary,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  doorOffsetFraction: number,
  doorWidth: number,
  doorHeight = 2.28,
  addDoorLeaf = true,
  openAngle = 0.78,
  wallMat: THREE.Material = mats.wallPlaster
) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const totalLen = Math.hypot(dx, dz);
  const ux = dx / totalLen;
  const uz = dz / totalLen;

  const doorCenter = totalLen * doorOffsetFraction;
  const dStart = Math.max(0.05, doorCenter - doorWidth / 2);
  const dEnd = Math.min(totalLen - 0.05, doorCenter + doorWidth / 2);

  if (dStart > 0.08) {
    addWallSegment(
      parent,
      colliders,
      wallMeshes,
      mats,
      x1,
      z1,
      x1 + ux * dStart,
      z1 + uz * dStart,
      WALL_H,
      WALL_T,
      0,
      wallMat
    );
  }
  if (totalLen - dEnd > 0.08) {
    addWallSegment(
      parent,
      colliders,
      wallMeshes,
      mats,
      x1 + ux * dEnd,
      z1 + uz * dEnd,
      x2,
      z2,
      WALL_H,
      WALL_T,
      0,
      wallMat
    );
  }

  addWallSegment(
    parent,
    colliders,
    wallMeshes,
    mats,
    x1 + ux * dStart,
    z1 + uz * dStart,
    x1 + ux * dEnd,
    z1 + uz * dEnd,
    WALL_H - doorHeight,
    WALL_T,
    doorHeight,
    wallMat
  );

  const capGroup = new THREE.Group();
  capGroup.position.set(x1 + ux * doorCenter, WALL_H + 0.035, z1 + uz * doorCenter);
  capGroup.rotation.y = Math.atan2(dx, dz);
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_T + 0.04, 0.07, doorWidth + 0.04),
    mats.wallDarkCap
  );
  capGroup.add(cap);
  parent.add(capGroup);

  if (addDoorLeaf) {
    const door = createDoorwayDoor(mats, openAngle, doorWidth - 0.04, doorHeight);
    door.position.set(x1 + ux * doorCenter, 0, z1 + uz * doorCenter);
    door.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    parent.add(door);
  }
}

export function buildArchitecturalFloorplan(mats: MaterialLibrary): FloorplanSceneData {
  const root = new THREE.Group();
  const ceilingGroup = new THREE.Group();
  const colliders: ColliderBox[] = [];
  const wallMeshes: THREE.Mesh[] = [];
  const bookableChairs: BookableChairHandle[] = [];
  const noticeTargets: InteractiveNoticeTarget[] = [];
  const lamps: LampLightHandle[] = [];
  const windowGlassMeshes: THREE.Mesh[] = [];

  // --- Exterior Terrace & Ground Plinth ---
  const groundPlinth = new THREE.Mesh(new THREE.BoxGeometry(36, 0.3, 28), mats.terraceFloor);
  groundPlinth.position.y = -0.16;
  groundPlinth.receiveShadow = true;
  root.add(groundPlinth);

  const gardenMat = new THREE.MeshStandardMaterial({ color: 0x6f846b, roughness: 0.92 });
  const gardenPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), gardenMat);
  gardenPlane.rotation.x = -Math.PI / 2;
  gardenPlane.position.y = -0.31;
  gardenPlane.receiveShadow = true;
  root.add(gardenPlane);

  // Exterior courtyard planters visible outside windows
  for (const [ex, ez] of [
    [-10.4, -3.8],
    [-10.4, 3.8],
    [10.4, -1.0],
    [10.4, 3.8],
    [-4.5, -7.6],
    [6.2, 7.6],
  ]) {
    const extPlant = createPottedPlant(mats, 1.4, ex + ez);
    extPlant.position.set(ex, -0.01, ez);
    root.add(extPlant);
  }

  const exteriorSkyMat = new THREE.MeshBasicMaterial({ color: 0xc8d8e2, side: THREE.BackSide });
  const exteriorSkyBackdrop = new THREE.Mesh(
    new THREE.SphereGeometry(55, 32, 20),
    exteriorSkyMat
  );
  root.add(exteriorSkyBackdrop);

  // --- Interior Floors ---
  const mainFloor = new THREE.Mesh(new THREE.PlaneGeometry(18.0, 12.4), mats.herringboneFloor);
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.position.set(0, 0.001, 0);
  mainFloor.receiveShadow = true;
  root.add(mainFloor);

  const bathFloor = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.35), mats.slateFloor);
  bathFloor.rotation.x = -Math.PI / 2;
  bathFloor.position.set(2.5, 0.008, 4.525);
  bathFloor.receiveShadow = true;
  root.add(bathFloor);

  const corridorFloor = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 2.9), mats.terraceFloor);
  corridorFloor.rotation.x = -Math.PI / 2;
  corridorFloor.position.set(5.55, 0.008, -4.75);
  corridorFloor.receiveShadow = true;
  root.add(corridorFloor);

  // =========================================================================
  // EXTERIOR PERIMETER WALLS
  // =========================================================================
  addWallSegment(root, colliders, wallMeshes, mats, -9.0, -6.2, -9.0, -4.9);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -9.0, -4.9, -9.0, -2.7);
  addWallSegment(root, colliders, wallMeshes, mats, -9.0, -2.7, -9.0, -1.1);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -9.0, -1.1, -9.0, 1.1);
  addWallSegment(root, colliders, wallMeshes, mats, -9.0, 1.1, -9.0, 2.7);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -9.0, 2.7, -9.0, 4.9);
  addWallSegment(root, colliders, wallMeshes, mats, -9.0, 4.9, -9.0, 6.2);

  addWallSegment(root, colliders, wallMeshes, mats, -9.0, -6.2, -7.8, -6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -7.8, -6.2, -5.8, -6.2);
  addWallSegment(root, colliders, wallMeshes, mats, -5.8, -6.2, -5.2, -6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -5.2, -6.2, -3.2, -6.2);
  addWallSegment(root, colliders, wallMeshes, mats, -3.2, -6.2, -2.6, -6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -2.6, -6.2, -0.8, -6.2);
  addWallSegment(root, colliders, wallMeshes, mats, -0.8, -6.2, 0.1, -6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, 0.1, -6.2, 1.6, -6.2);
  addWallSegment(root, colliders, wallMeshes, mats, 1.6, -6.2, 2.1, -6.2);
  addWallWithDoorway(root, colliders, wallMeshes, mats, 2.1, -6.2, 4.0, -6.2, 0.5, 1.1, 2.35, true, 0.55);
  addWallSegment(root, colliders, wallMeshes, mats, 4.0, -6.2, 9.0, -6.2);

  addWallSegment(root, colliders, wallMeshes, mats, 9.0, -6.2, 9.0, -2.1);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, 9.0, -2.1, 9.0, 0.1);
  addWallSegment(root, colliders, wallMeshes, mats, 9.0, 0.1, 9.0, 2.5);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, 9.0, 2.5, 9.0, 5.1);
  addWallSegment(root, colliders, wallMeshes, mats, 9.0, 5.1, 9.0, 6.2);

  addWallSegment(root, colliders, wallMeshes, mats, -9.0, 6.2, -8.0, 6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -8.0, 6.2, -6.0, 6.2);
  addWallSegment(root, colliders, wallMeshes, mats, -6.0, 6.2, -5.4, 6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -5.4, 6.2, -3.5, 6.2);
  addWallSegment(root, colliders, wallMeshes, mats, -3.5, 6.2, -2.9, 6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, -2.9, 6.2, -1.0, 6.2);
  addWallSegment(root, colliders, wallMeshes, mats, -1.0, 6.2, 0.0, 6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, 0.0, 6.2, 1.2, 6.2);
  addWallSegment(root, colliders, wallMeshes, mats, 1.2, 6.2, 2.0, 6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, 2.0, 6.2, 3.0, 6.2);
  addWallSegment(root, colliders, wallMeshes, mats, 3.0, 6.2, 4.9, 6.2);
  addWindowWallSegment(root, colliders, wallMeshes, mats, windowGlassMeshes, 4.9, 6.2, 7.5, 6.2);
  addWallSegment(root, colliders, wallMeshes, mats, 7.5, 6.2, 9.0, 6.2);

  // =========================================================================
  // INTERIOR PARTITION WALLS & DOORWAYS (Soft Greens, Muted Blues & Warm Neutrals)
  // =========================================================================
  // Main Reading Hall <-> Reception divider (Soft Sage Green)
  addWallWithDoorway(
    root,
    colliders,
    wallMeshes,
    mats,
    -0.6,
    -6.2,
    -0.6,
    6.2,
    0.5,
    1.9,
    2.48,
    false,
    0.78,
    mats.wallSoftGreen
  );
  // Reception north & pantry backdrop walls (Muted Mist Blue)
  addWallSegment(root, colliders, wallMeshes, mats, 2.1, -6.2, 2.1, -2.9, WALL_H, WALL_T, 0, mats.wallMutedBlue);
  addWallWithDoorway(
    root,
    colliders,
    wallMeshes,
    mats,
    -0.6,
    -2.9,
    2.1,
    -2.9,
    0.72,
    0.96,
    2.25,
    true,
    -0.82,
    mats.wallMutedBlue
  );

  // Entrance corridor & Quiet Study Studio north wall (Muted Blue entrance, Soft Green Quiet Studio)
  addWallWithDoorway(
    root,
    colliders,
    wallMeshes,
    mats,
    2.1,
    -3.3,
    3.6,
    -3.3,
    0.5,
    1.15,
    2.35,
    true,
    0.85,
    mats.wallMutedBlue
  );
  addWallSegment(root, colliders, wallMeshes, mats, 3.6, -3.3, 9.0, -3.3, WALL_H, WALL_T, 0, mats.wallSoftGreen);
  addWallSegment(root, colliders, wallMeshes, mats, 4.0, -6.2, 4.0, -3.3, WALL_H, WALL_T, 0, mats.wallPlaster);

  // Quiet Study Studio west wall (Soft Green) & Innovation Hub west/north walls (Muted Blue)
  addWallSegment(root, colliders, wallMeshes, mats, 3.4, -3.3, 3.4, -0.75, WALL_H, WALL_T, 0, mats.wallSoftGreen);
  addWallWithDoorway(
    root,
    colliders,
    wallMeshes,
    mats,
    3.4,
    -0.75,
    3.4,
    1.3,
    0.5,
    1.0,
    2.25,
    true,
    0.88,
    mats.wallSoftGreen
  );
  addWallWithDoorway(
    root,
    colliders,
    wallMeshes,
    mats,
    3.4,
    1.3,
    3.4,
    6.2,
    0.16,
    1.0,
    2.25,
    true,
    -0.86,
    mats.wallMutedBlue
  );
  addWallSegment(root, colliders, wallMeshes, mats, 3.4, 1.3, 9.0, 1.3, WALL_H, WALL_T, 0, mats.wallMutedBlue);

  // Lower Pantry & Bathroom partitions (Warm Neutral plaster)
  addWallWithDoorway(root, colliders, wallMeshes, mats, -0.6, 2.85, 1.6, 2.85, 0.56, 0.92, 2.25, true, -0.78);
  addWallWithDoorway(root, colliders, wallMeshes, mats, 1.6, 2.85, 3.4, 2.85, 0.46, 0.88, 2.25, true, -0.78);
  addWallSegment(root, colliders, wallMeshes, mats, 1.6, 2.85, 1.6, 6.2);

  // =========================================================================
  // ARCHITECTURAL DOORWAY ROOM PLAQUES (cleanly mounted on doorway lintels)
  // =========================================================================
  const addSign = (
    key: keyof MaterialLibrary['doorPlaqueMats'],
    x: number,
    y: number,
    z: number,
    rotY: number,
    w = 0.88,
    h = 0.24
  ) => {
    const sign = createDoorwayPlaque(mats, mats.doorPlaqueMats[key], w, h);
    sign.position.set(x, y, z);
    sign.rotation.y = rotY;
    root.add(sign);
  };

  // Entrance corridor -> Reception & Lobby
  addSign('reception', 2.85, 2.64, -3.41, Math.PI, 0.96, 0.26);
  // Reception <-> Main Reading Hall archway (both sides clearly labeled)
  addSign('reading-hall', -0.49, 2.76, 0, Math.PI / 2, 1.16, 0.28);
  addSign('reception', -0.71, 2.76, 0, -Math.PI / 2, 1.16, 0.28);
  // Reception -> Quiet Study Studio
  addSign('quiet-studio', 3.29, 2.52, 0.275, -Math.PI / 2, 0.94, 0.24);
  // Reception -> Innovation Hub (centered at z=2.084, completely clear of Bathroom corner at z=2.75)
  addSign('innovation-hub', 3.29, 2.52, 2.084, -Math.PI / 2, 0.94, 0.24);
  // Reception -> Upper & Lower Pantry / Break Rooms
  addSign('pantry', 1.344, 2.52, -2.79, 0, 0.88, 0.23);
  addSign('pantry', 0.632, 2.52, 2.74, Math.PI, 0.88, 0.23);
  // Reception -> Bathroom / W.C.
  addSign('bathroom', 2.428, 2.52, 2.74, Math.PI, 0.86, 0.23);

  // =========================================================================
  // STAIRWELL IN COMMON CORRIDOR (steps + center balustrade & handrail)
  // =========================================================================
  for (let s = 0; s < 10; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 2.4), mats.terraceFloor);
    step.position.set(4.5 + s * 0.32, 0.09 + s * 0.17, -4.75);
    step.receiveShadow = true;
    root.add(step);
  }
  const handrail = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 0.06), mats.darkAnodized);
  handrail.position.set(6.0, 1.85, -4.75);
  handrail.rotation.z = 0.46;
  root.add(handrail);

  // =========================================================================
  // 1. QUIET STUDY STUDIO (6 Bookable Study Carrel Chairs: Q1–Q6)
  // =========================================================================
  const quietStations: StudyChairMetadata[] = [
    {
      id: 'Q1',
      label: 'Quiet Desk Q1',
      roomName: 'Quiet Study Studio',
      positionLabel: 'North-West Alcove · Near Bookshelf',
      targetKind: 'chair',
      rates: { ...STANDARD_SEAT_RATES },
      features: ['Acoustic Carrel', 'Brass Task Lamp', 'Upper Book Hutch', 'Power & USB-C'],
      worldPosition: [4.85, 0, -2.35],
      cameraViewPosition: [4.85, 1.48, -0.68],
      cameraLookTarget: [4.85, 0.86, -2.35],
      previewImage: '/assets/aistudio/Modern_Quiet_Study_Studio_627be306.png',
    },
    {
      id: 'Q2',
      label: 'Quiet Desk Q2',
      roomName: 'Quiet Study Studio',
      positionLabel: 'North Center · Quiet Focus Row',
      targetKind: 'chair',
      rates: { ...STANDARD_SEAT_RATES },
      features: ['Acoustic Carrel', 'Brass Task Lamp', 'Upper Book Hutch', 'Power & USB-C'],
      worldPosition: [6.45, 0, -2.35],
      cameraViewPosition: [6.45, 1.48, -0.68],
      cameraLookTarget: [6.45, 0.86, -2.35],
      previewImage: '/assets/aistudio/Modern_Quiet_Study_Studio_627be306.png',
    },
    {
      id: 'Q3',
      label: 'Quiet Desk Q3',
      roomName: 'Quiet Study Studio',
      positionLabel: 'North-East Corner · Window Daylight',
      targetKind: 'chair',
      rates: { ...STANDARD_SEAT_RATES },
      features: ['Natural Window Light', 'Brass Task Lamp', 'Upper Book Hutch', 'Power & USB-C'],
      worldPosition: [8.05, 0, -2.35],
      cameraViewPosition: [7.65, 1.48, -0.68],
      cameraLookTarget: [8.05, 0.86, -2.35],
      previewImage: '/assets/aistudio/Modern_Quiet_Study_Studio_627be306.png',
    },
    {
      id: 'Q4',
      label: 'Quiet Desk Q4',
      roomName: 'Quiet Study Studio',
      positionLabel: 'South-West Alcove · Near Entrance',
      targetKind: 'chair',
      rates: { ...STANDARD_SEAT_RATES },
      features: ['Acoustic Carrel', 'Brass Task Lamp', 'Upper Book Hutch', 'Power & USB-C'],
      worldPosition: [4.85, 0, 0.35],
      cameraViewPosition: [4.85, 1.48, -1.25],
      cameraLookTarget: [4.85, 0.86, 0.35],
      previewImage: '/assets/aistudio/Modern_Quiet_Study_Studio_627be306.png',
    },
    {
      id: 'Q5',
      label: 'Quiet Desk Q5',
      roomName: 'Quiet Study Studio',
      positionLabel: 'South Center · Quiet Focus Row',
      targetKind: 'chair',
      rates: { ...STANDARD_SEAT_RATES },
      features: ['Acoustic Carrel', 'Brass Task Lamp', 'Upper Book Hutch', 'Power & USB-C'],
      worldPosition: [6.45, 0, 0.35],
      cameraViewPosition: [6.45, 1.48, -1.25],
      cameraLookTarget: [6.45, 0.86, 0.35],
      previewImage: '/assets/aistudio/Modern_Quiet_Study_Studio_627be306.png',
    },
    {
      id: 'Q6',
      label: 'Quiet Desk Q6',
      roomName: 'Quiet Study Studio',
      positionLabel: 'South-East Corner · Floor Lamp Glow',
      targetKind: 'chair',
      rates: { ...STANDARD_SEAT_RATES },
      features: ['Floor Lamp Reading Nook', 'Brass Task Lamp', 'Upper Book Hutch', 'Power & USB-C'],
      worldPosition: [8.05, 0, 0.35],
      cameraViewPosition: [7.65, 1.48, -1.25],
      cameraLookTarget: [8.05, 0.86, 0.35],
      previewImage: '/assets/aistudio/Modern_Quiet_Study_Studio_627be306.png',
    },
  ];

  quietStations.forEach((meta) => {
    const handle = createQuietStudyStation(mats, lamps, meta);
    root.add(handle.group);
    bookableChairs.push(handle);

    const isNorth = meta.worldPosition[2] < -0.8;
    const dz = isNorth ? meta.worldPosition[2] - 0.45 : meta.worldPosition[2] + 0.45;
    colliders.push({
      minX: meta.worldPosition[0] - 0.72,
      maxX: meta.worldPosition[0] + 0.72,
      minZ: dz - 0.36,
      maxZ: dz + 0.36,
    });
  });

  const quietShelf = createBookshelfUnit(mats, 1.85, 2.35, 0.36, 5, true);
  quietShelf.rotation.y = Math.PI / 2;
  quietShelf.position.set(3.68, 0, -1.85);
  root.add(quietShelf);
  colliders.push({ minX: 3.45, maxX: 3.9, minZ: -2.8, maxZ: -0.9 });

  const quietPlant = createPottedPlant(mats, 1.15, 14);
  quietPlant.position.set(3.98, 0, -2.92);
  root.add(quietPlant);

  const quietPlantNE = createPottedPlant(mats, 0.92, 51);
  quietPlantNE.position.set(8.62, 0, -2.95);
  root.add(quietPlantNE);

  const quietArt1 = createWallArtFrame(mats, 1, 0.56, 0.72);
  quietArt1.rotation.y = -Math.PI / 2;
  quietArt1.position.set(8.88, 1.65, -1.45);
  root.add(quietArt1);

  const quietFloorLamp = createFloorLamp(mats, lamps, 1.68);
  quietFloorLamp.position.set(8.58, 0, -0.95);
  root.add(quietFloorLamp);

  // =========================================================================
  // 2. INNOVATION HUB (Room-Only Booking — Individual Chairs Cannot Be Sold)
  // =========================================================================
  const roomBookingMeta: StudyChairMetadata = {
    id: 'INNOVATION-HUB-ROOM',
    label: 'Innovation Hub (Full Suite)',
    roomName: 'Innovation Hub',
    positionLabel: '12-Seat Conference Suite · Room-Only Booking',
    targetKind: 'room',
    rates: { ...INNOVATION_HUB_RATES },
    features: [
      'Entire 12-Seat Conference Room',
      'Calacatta Marble Boardroom Table',
      'Glass Whiteboard & Wall Sconces',
      'Built-In Power & HDMI Console',
    ],
    worldPosition: [6.2, 0, 3.8],
    cameraViewPosition: [4.05, 1.62, 3.8],
    cameraLookTarget: [6.4, 1.05, 3.8],
    previewImage: '/assets/aistudio/Modern_Innovation_Hub_Meeting_Room_0fcd03ed.png',
  };

  const hubSignPanel = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.68, 0.14),
    mats.innovationSign
  );
  hubSignPanel.position.set(6.2, 1.72, 1.48);
  root.add(hubSignPanel);

  const hubCredenza = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 0.38), mats.walnutWood);
  hubCredenza.position.set(6.2, 0.325, 1.6);
  hubCredenza.castShadow = true;
  root.add(hubCredenza);
  for (let cx = -1.0; cx <= 1.0; cx += 0.5) {
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.02), mats.brushedBrass);
    pull.position.set(6.2 + cx, 0.55, 1.8);
    root.add(pull);
  }

  for (const sx of [4.5, 8.05]) {
    const shelf = createBookshelfUnit(mats, 1.0, 2.25, 0.36, 4, true);
    shelf.position.set(sx, 0, 1.6);
    root.add(shelf);
  }
  colliders.push({ minX: 3.95, maxX: 8.7, minZ: 1.38, maxZ: 1.82 });

  const hubTable = createMarbleTable(mats, 3.2, 1.35, 0.75, true);
  hubTable.position.set(6.2, 0, 3.8);
  root.add(hubTable);
  colliders.push({ minX: 4.55, maxX: 7.85, minZ: 3.1, maxZ: 4.5 });

  // Conference table props: laptop, notebook, pen cup, potted plant
  const hubLaptop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.24), mats.darkAnodized);
  hubLaptop.position.set(5.4, 0.765, 3.45);
  root.add(hubLaptop);

  const hubPenCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.03, 0.09, 12),
    mats.darkAnodized
  );
  hubPenCup.position.set(7.35, 0.795, 3.55);
  root.add(hubPenCup);

  const hubTablePlant = createPottedPlant(mats, 0.38, 99);
  hubTablePlant.position.set(7.05, 0.75, 3.55);
  root.add(hubTablePlant);

  // Innovation Hub 12 Chairs (non-individual: clicking any triggers Innovation Hub room booking)
  const addInnovationChair = (x: number, z: number, rotY: number, idx: number) => {
    const { root: cRoot } = createSwivelChairGroup(mats, mats.taupeFabric);
    cRoot.position.set(x, 0, z);
    cRoot.rotation.y = rotY;
    root.add(cRoot);

    const { hitTarget, notice } = createNonBookableProxy(
      'innovation-chair',
      `INNOVATION-CHAIR-${idx}`,
      'Innovation Hub · Room-Only Suite',
      'Individual chairs cannot be sold separately — click to book the full room',
      0.72,
      1.05,
      0.72,
      [x, 0, z]
    );
    root.add(hitTarget);
    noticeTargets.push(notice);
  };

  for (let i = 0; i < 5; i++) {
    const cx = 4.95 + i * 0.62;
    addInnovationChair(cx, 2.86, 0, i * 2 + 1);
    addInnovationChair(cx, 4.74, Math.PI, i * 2 + 2);
  }
  addInnovationChair(4.32, 3.8, Math.PI / 2, 11);
  addInnovationChair(8.08, 3.8, -Math.PI / 2, 12);

  // Whiteboard "Think · Build · Innovate" + Marker Tray + Flanking Wall Sconces
  const whiteboard = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.15, 0.06), mats.whiteboardMat);
  whiteboard.position.set(6.2, 1.45, 6.04);
  root.add(whiteboard);

  const markerTray = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.08), mats.darkAnodized);
  markerTray.position.set(6.2, 0.87, 6.01);
  root.add(markerTray);

  for (const sx of [4.65, 7.75]) {
    const sconce = createWallSconce(mats, lamps);
    sconce.position.set(sx, 1.65, 6.06);
    root.add(sconce);
  }

  for (const [px, pz, s] of [
    [3.72, 1.56, 0.95],
    [8.58, 1.75, 1.1],
    [3.85, 5.75, 0.95],
    [8.55, 5.75, 0.95],
  ] as [number, number, number][]) {
    const p = createPottedPlant(mats, s, px * 7);
    p.position.set(px, 0, pz);
    root.add(p);
  }

  // =========================================================================
  // 3. RECEPTION / LOBBY (Curved Desk + 3D Receptionist Maya + 2 Bookable Armchairs RA1–RA2)
  // =========================================================================
  const receptionDesk = createReceptionDesk(mats);
  receptionDesk.position.set(1.02, 0, -0.95);
  root.add(receptionDesk);
  colliders.push({ minX: 0.0, maxX: 2.3, minZ: -1.35, maxZ: -0.58 });
  colliders.push({ minX: 1.66, maxX: 2.3, minZ: -2.35, maxZ: -1.2 });

  const { root: execChair } = createSwivelChairGroup(mats, mats.blackLeather);
  execChair.position.set(0.66, 0, -1.78);
  root.add(execChair);

  const receptionist = createReceptionistHelper(mats, [1.42, 0, -1.75]);
  receptionist.group.rotation.y = 0.28;
  root.add(receptionist.group);

  const receptionShelf = createBookshelfUnit(mats, 1.35, 2.15, 0.34, 4, true);
  receptionShelf.position.set(0.22, 0, -2.65);
  root.add(receptionShelf);
  colliders.push({ minX: -0.45, maxX: 0.94, minZ: -2.85, maxZ: -2.42 });

  const receptionRug = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.45), mats.rugMaterial);
  receptionRug.rotation.x = -Math.PI / 2;
  receptionRug.position.set(1.2, 0.008, 1.68);
  receptionRug.receiveShadow = true;
  root.add(receptionRug);

  const registerGeneralChair = (
    id: string,
    label: string,
    roomName: string,
    positionLabel: string,
    x: number,
    z: number,
    rotY: number,
    fabricMat: THREE.Material,
    isArmchair: boolean,
    rates: Record<BookingPlan, number>,
    previewImage: string
  ) => {
    const { root: cRoot, body: cBody } = isArmchair
      ? createLoungeArmchair(mats, fabricMat)
      : createSwivelChairGroup(mats, fabricMat);
    const { camPos, lookAt } = computeChairCameraView(x, z, rotY, isArmchair ? 1.62 : 1.58);

    const meta: StudyChairMetadata = {
      id,
      label,
      roomName,
      positionLabel,
      targetKind: 'chair',
      rates,
      features: isArmchair
        ? ['Upholstered Lounge Armchair', 'Side Table Access', 'Ambient Lighting']
        : ['Ergonomic Swivel Chair', 'Shared Table Lamp', 'Quiet Reading Zone'],
      worldPosition: [x, 0, z],
      cameraViewPosition: camPos,
      cameraLookTarget: lookAt,
      previewImage,
    };

    const handle = makeBookableChairInstance(
      cRoot,
      cBody,
      meta,
      x,
      z,
      rotY,
      isArmchair ? 0.3 : 0.32,
      isArmchair ? 0.42 : 0.3
    );
    root.add(handle.group);
    bookableChairs.push(handle);
  };

  registerGeneralChair(
    'RA1',
    'Reception Armchair RA1',
    'Reception / Lobby',
    'South Lobby · West Lounge Chair',
    0.35,
    1.65,
    Math.PI,
    mats.cognacLeather,
    true,
    { ...STANDARD_SEAT_RATES },
    '/assets/aistudio/Warm_Modern_Reception_Floor_Plan_62db75e0.png'
  );
  registerGeneralChair(
    'RA2',
    'Reception Armchair RA2',
    'Reception / Lobby',
    'South Lobby · East Lounge Chair',
    2.05,
    1.65,
    Math.PI,
    mats.cognacLeather,
    true,
    { ...STANDARD_SEAT_RATES },
    '/assets/aistudio/Warm_Modern_Reception_Floor_Plan_62db75e0.png'
  );

  const recSideTable = createMarbleTable(mats, 0.62, 0.62, 0.48);
  recSideTable.position.set(1.2, 0, 1.68);
  root.add(recSideTable);
  const recSidePlant = createPottedPlant(mats, 0.34, 42);
  recSidePlant.position.set(1.2, 0.48, 1.68);
  root.add(recSidePlant);
  colliders.push({ minX: -0.05, maxX: 2.45, minZ: 1.25, maxZ: 2.05 });

  const recFloorLamp = createFloorLamp(mats, lamps, 1.68);
  recFloorLamp.position.set(3.05, 0, -2.55);
  root.add(recFloorLamp);

  for (let a = 0; a < 3; a++) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.62, 0.52), mats.darkAnodized);
    frame.position.set(3.28, 1.55, -2.1 + a * 0.72);
    root.add(frame);

    const canvasArt = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.56),
      mats.artMaterials[a % mats.artMaterials.length]
    );
    canvasArt.position.set(3.255, 1.55, -2.1 + a * 0.72);
    canvasArt.rotation.y = -Math.PI / 2;
    root.add(canvasArt);
  }

  for (const pz of [-2.4, 1.65]) {
    const rp = createPottedPlant(mats, 1.05, pz * 11);
    rp.position.set(-0.22, 0, pz);
    root.add(rp);
  }

  // =========================================================================
  // 4. PANTRIES & BATHROOM (with Cooktops, Sinks, Shower & Bookable Dining Chairs P1-P2)
  // =========================================================================
  const uCounterN = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.88, 0.6), mats.marbleSlab);
  uCounterN.position.set(0.55, 0.44, -5.8);
  uCounterN.castShadow = true;
  root.add(uCounterN);
  const uCounterW = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.88, 2.2), mats.marbleSlab);
  uCounterW.position.set(-0.2, 0.44, -4.6);
  uCounterW.castShadow = true;
  root.add(uCounterW);
  const uFridge = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.92, 0.68), mats.chromeMetal);
  uFridge.position.set(1.68, 0.96, -5.74);
  uFridge.castShadow = true;
  root.add(uFridge);
  root.add(createKitchenAppliances(mats, [0.55, 0.89, -5.78], [-0.2, 0.89, -4.75], Math.PI / 2));
  const uEspresso = createEspressoStation(mats);
  uEspresso.position.set(-0.2, 0.88, -5.7);
  uEspresso.rotation.y = Math.PI / 4;
  root.add(uEspresso);

  const uDining = createWoodStudyTable(mats, 0.88, 0.88, 0.74);
  uDining.position.set(0.95, 0, -4.15);
  root.add(uDining);
  const uDiningPlant = createPottedPlant(mats, 0.3, 18);
  uDiningPlant.position.set(0.95, 0.74, -4.15);
  root.add(uDiningPlant);

  registerGeneralChair(
    'P1',
    'Pantry Seat P1',
    'Upper Pantry / Break Room',
    'Pantry Dining Table · West Side',
    0.32,
    -4.15,
    Math.PI / 2,
    mats.taupeFabric,
    false,
    { ...STANDARD_SEAT_RATES },
    '/assets/aistudio/Warm_Modern_Reception_Floor_Plan_62db75e0.png'
  );
  registerGeneralChair(
    'P2',
    'Pantry Seat P2',
    'Upper Pantry / Break Room',
    'Pantry Dining Table · East Side',
    1.58,
    -4.15,
    -Math.PI / 2,
    mats.taupeFabric,
    false,
    { ...STANDARD_SEAT_RATES },
    '/assets/aistudio/Warm_Modern_Reception_Floor_Plan_62db75e0.png'
  );

  colliders.push({ minX: -0.5, maxX: 2.0, minZ: -6.1, maxZ: -5.45 });
  colliders.push({ minX: -0.5, maxX: 0.12, minZ: -6.0, maxZ: -3.45 });

  // Lower Pantry
  const lCounterS = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.88, 0.6), mats.marbleSlab);
  lCounterS.position.set(0.5, 0.44, 5.8);
  root.add(lCounterS);
  const lCounterW = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.88, 2.4), mats.marbleSlab);
  lCounterW.position.set(-0.2, 0.44, 4.4);
  root.add(lCounterW);
  const lFridge = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.88, 0.62), mats.chromeMetal);
  lFridge.position.set(1.2, 0.94, 4.1);
  root.add(lFridge);
  root.add(createKitchenAppliances(mats, [0.45, 0.89, 5.78], [-0.2, 0.89, 4.4], Math.PI / 2));
  const lEspresso = createEspressoStation(mats);
  lEspresso.position.set(-0.2, 0.88, 5.65);
  lEspresso.rotation.y = Math.PI * 0.75;
  root.add(lEspresso);
  colliders.push({ minX: -0.5, maxX: 1.5, minZ: 5.45, maxZ: 6.1 });
  colliders.push({ minX: -0.5, maxX: 0.12, minZ: 3.2, maxZ: 6.0 });

  // Bathroom / W.C.
  const vanity = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.78, 0.72), mats.walnutWood);
  vanity.position.set(3.05, 0.39, 3.6);
  root.add(vanity);
  const vesselSink = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.13, 0.14, 20),
    mats.ceramicWhite
  );
  vesselSink.position.set(3.05, 0.85, 3.6);
  root.add(vesselSink);
  const sinkFaucet = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.04), mats.chromeMetal);
  sinkFaucet.position.set(3.2, 0.92, 3.6);
  root.add(sinkFaucet);

  const toiletBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.14, 0.4, 16),
    mats.ceramicWhite
  );
  toiletBase.position.set(2.15, 0.2, 5.65);
  root.add(toiletBase);
  const toiletTank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.46, 0.18), mats.ceramicWhite);
  toiletTank.position.set(2.15, 0.56, 5.88);
  root.add(toiletTank);

  const showerGlass = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.1, 0.95), mats.glassWindow);
  showerGlass.position.set(2.55, 1.05, 5.55);
  root.add(showerGlass);
  const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), mats.chromeMetal);
  showerHead.position.set(2.95, 2.02, 5.75);
  root.add(showerHead);

  // =========================================================================
  // 5. MAIN READING HALL (Every Table Chair & Armchair Bookable, Sofas/Benches Excluded)
  // =========================================================================
  for (const [sz, len] of [
    [-5.55, 1.08],
    [-1.9, 1.35],
    [1.9, 1.35],
    [5.4, 1.35],
  ] as [number, number][]) {
    const bs = createBookshelfUnit(mats, len, 2.45, 0.38, 5, true);
    bs.rotation.y = Math.PI / 2;
    bs.position.set(-8.68, 0, sz);
    root.add(bs);
  }
  colliders.push({ minX: -8.95, maxX: -8.45, minZ: -6.1, maxZ: 6.1 });

  for (const sz of [-4.65, -2.35, 2.35, 4.65]) {
    const bs = createBookshelfUnit(mats, 1.55, 2.45, 0.38, 5, true);
    bs.rotation.y = -Math.PI / 2;
    bs.position.set(-0.92, 0, sz);
    root.add(bs);
  }

  const northLoungeShelf = createBookshelfUnit(mats, 2.2, 2.35, 0.36, 5, true);
  northLoungeShelf.position.set(-2.0, 0, -5.88);
  root.add(northLoungeShelf);

  const westReadingShelf = createBookshelfUnit(mats, 1.6, 2.3, 0.36, 5, true);
  westReadingShelf.position.set(-5.5, 0, -5.88);
  root.add(westReadingShelf);

  // Center Calacatta Marble Collaborative Table + 12 Bookable Chairs (M1–M12)
  const centerMarble = createMarbleTable(mats, 5.2, 1.25, 0.75, false);
  centerMarble.position.set(-4.8, 0, 0);
  root.add(centerMarble);
  colliders.push({ minX: -7.45, maxX: -2.15, minZ: -0.68, maxZ: 0.68 });

  for (let i = 0; i < 6; i++) {
    const xPos = -6.9 + i * 0.84;
    registerGeneralChair(
      `M${i + 1}`,
      `Marble Table Seat M${i + 1}`,
      'Main Reading Hall & Lounge',
      'Collaborative Marble Table · North Row',
      xPos,
      -0.92,
      0,
      mats.taupeFabric,
      false,
      { ...STANDARD_SEAT_RATES },
      '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
    );
    registerGeneralChair(
      `M${i + 7}`,
      `Marble Table Seat M${i + 7}`,
      'Main Reading Hall & Lounge',
      'Collaborative Marble Table · South Row',
      xPos,
      0.92,
      Math.PI,
      mats.taupeFabric,
      false,
      { ...STANDARD_SEAT_RATES },
      '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
    );
  }

  for (const lx of [-6.4, -5.3, -4.2, -3.1]) {
    const lamp = createBrassDomeLamp(mats, lamps, 1.05, { day: 0.12, evening: 1.8, night: 3.4 });
    lamp.position.set(lx, 0.75, 0);
    root.add(lamp);
  }
  for (const px of [-5.85, -3.65]) {
    const p = createPottedPlant(mats, 0.36, px * 13);
    p.position.set(px, 0.75, 0);
    root.add(p);
  }

  // 3 Vertical Wood Study Tables in Top-Left Reading Hall -> 12 Bookable Chairs (S1–S12)
  let sIdx = 1;
  for (const tx of [-7.95, -6.12, -4.29]) {
    const table = createWoodStudyTable(mats, 0.78, 2.0, 0.75);
    table.position.set(tx, 0, -4.1);
    root.add(table);
    colliders.push({ minX: tx - 0.42, maxX: tx + 0.42, minZ: -5.14, maxZ: -3.06 });

    for (const tz of [-4.55, -3.62]) {
      registerGeneralChair(
        `S${sIdx++}`,
        `Reading Desk S${sIdx - 1}`,
        'Main Reading Hall & Lounge',
        'North Window Study Row · West Facing',
        tx - 0.48,
        tz,
        Math.PI / 2,
        mats.taupeFabric,
        false,
        { ...STANDARD_SEAT_RATES },
        '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
      );
      registerGeneralChair(
        `S${sIdx++}`,
        `Reading Desk S${sIdx - 1}`,
        'Main Reading Hall & Lounge',
        'North Window Study Row · East Facing',
        tx + 0.48,
        tz,
        -Math.PI / 2,
        mats.taupeFabric,
        false,
        { ...STANDARD_SEAT_RATES },
        '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
      );
    }

    const tLamp = createBrassDomeLamp(mats, lamps, 0.92, { day: 0.1, evening: 1.5, night: 2.9 });
    tLamp.position.set(tx, 0.75, -4.45);
    root.add(tLamp);

    const tPlant = createPottedPlant(mats, 0.32, tx * 5);
    tPlant.position.set(tx, 0.75, -3.78);
    root.add(tPlant);
  }

  // Top-Right Cognac Leather Lounge: Sofa (NON-BOOKABLE) + 3 Bookable Armchairs (CA1–CA3)
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.55), mats.rugMaterial);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-2.02, 0.008, -4.08);
  rug.receiveShadow = true;
  root.add(rug);

  const leatherSofa = createLoungeSofa(mats, mats.cognacLeather, 1.85);
  leatherSofa.position.set(-2.02, 0, -5.15);
  root.add(leatherSofa);

  const sofaNotice = createNonBookableProxy(
    'sofa',
    'LOUNGE-SOFA-1',
    'Cognac Leather Sofa · Shared Seating',
    'Sofas cannot be booked individually — click any single chair or armchair',
    1.9,
    0.92,
    0.9,
    [-2.02, 0, -5.15]
  );
  root.add(sofaNotice.hitTarget);
  noticeTargets.push(sofaNotice.notice);

  registerGeneralChair(
    'CA1',
    'Leather Armchair CA1',
    'Main Reading Hall & Lounge',
    'North-East Cognac Lounge',
    -2.75,
    -4.1,
    Math.PI / 2,
    mats.cognacLeather,
    true,
    { ...STANDARD_SEAT_RATES },
    '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
  );
  registerGeneralChair(
    'CA2',
    'Leather Armchair CA2',
    'Main Reading Hall & Lounge',
    'North-East Cognac Lounge',
    -2.58,
    -3.15,
    Math.PI * 0.74,
    mats.cognacLeather,
    true,
    { ...STANDARD_SEAT_RATES },
    '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
  );
  registerGeneralChair(
    'CA3',
    'Leather Armchair CA3',
    'Main Reading Hall & Lounge',
    'North-East Cognac Lounge',
    -1.48,
    -3.18,
    -Math.PI * 0.74,
    mats.cognacLeather,
    true,
    { ...STANDARD_SEAT_RATES },
    '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
  );

  const coffeeW = createWoodStudyTable(mats, 0.84, 0.84, 0.42);
  coffeeW.position.set(-2.02, 0, -4.08);
  root.add(coffeeW);
  const coffeePlant = createPottedPlant(mats, 0.34, 33);
  coffeePlant.position.set(-2.02, 0.42, -4.08);
  root.add(coffeePlant);
  const coffeeBook = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.18), mats.bookSpines);
  coffeeBook.position.set(-1.78, 0.44, -3.92);
  root.add(coffeeBook);
  colliders.push({ minX: -3.1, maxX: -1.05, minZ: -5.55, maxZ: -2.85 });

  // Bottom-Left Light Grey Lounge: Woven Rug + 4 Bookable Armchairs (LA1–LA4) + Floor Lamp
  const greyRug = new THREE.Mesh(new THREE.PlaneGeometry(2.65, 2.65), mats.rugMaterial);
  greyRug.rotation.x = -Math.PI / 2;
  greyRug.position.set(-7.25, 0.008, 3.85);
  greyRug.receiveShadow = true;
  root.add(greyRug);

  const greyFloorLamp = createFloorLamp(mats, lamps, 1.66);
  greyFloorLamp.position.set(-8.36, 0, 2.45);
  root.add(greyFloorLamp);

  const greyCoffee = createMarbleTable(mats, 0.86, 0.86, 0.42);
  greyCoffee.position.set(-7.25, 0, 3.85);
  root.add(greyCoffee);
  const greyCoffeePlant = createPottedPlant(mats, 0.34, 66);
  greyCoffeePlant.position.set(-7.25, 0.42, 3.85);
  root.add(greyCoffeePlant);

  const greySpecs: [string, number, number, number][] = [
    ['LA1', -8.08, 3.85, Math.PI / 2],
    ['LA2', -6.42, 3.85, -Math.PI / 2],
    ['LA3', -7.25, 2.95, 0],
    ['LA4', -7.25, 4.75, Math.PI],
  ];
  for (const [id, gx, gz, rot] of greySpecs) {
    registerGeneralChair(
      id,
      `Lounge Armchair ${id}`,
      'Main Reading Hall & Lounge',
      'South-West Quiet Reading Lounge',
      gx,
      gz,
      rot,
      mats.lightGreyFabric,
      true,
      { ...STANDARD_SEAT_RATES },
      '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
    );
  }
  colliders.push({ minX: -8.45, maxX: -6.02, minZ: 2.65, maxZ: 5.05 });

  // Bottom-Center Walnut Study Table + 6 Bookable Chairs (W1–W6)
  const bottomWoodTable = createWoodStudyTable(mats, 1.02, 2.25, 0.75);
  bottomWoodTable.position.set(-4.75, 0, 3.9);
  root.add(bottomWoodTable);
  colliders.push({ minX: -5.32, maxX: -4.18, minZ: 2.75, maxZ: 5.05 });

  let wIdx = 1;
  for (const bz of [3.15, 3.9, 4.65]) {
    registerGeneralChair(
      `W${wIdx++}`,
      `Walnut Table Seat W${wIdx - 1}`,
      'Main Reading Hall & Lounge',
      'South Walnut Table · West Side',
      -5.38,
      bz,
      Math.PI / 2,
      mats.taupeFabric,
      false,
      { ...STANDARD_SEAT_RATES },
      '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
    );
    registerGeneralChair(
      `W${wIdx++}`,
      `Walnut Table Seat W${wIdx - 1}`,
      'Main Reading Hall & Lounge',
      'South Walnut Table · East Side',
      -4.12,
      bz,
      -Math.PI / 2,
      mats.taupeFabric,
      false,
      { ...STANDARD_SEAT_RATES },
      '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
    );
  }
  const bLamp = createBrassDomeLamp(mats, lamps, 0.98, { day: 0.1, evening: 1.6, night: 3.1 });
  bLamp.position.set(-4.75, 0.75, 3.5);
  root.add(bLamp);
  const bPlant = createPottedPlant(mats, 0.34, 88);
  bPlant.position.set(-4.75, 0.75, 4.25);
  root.add(bPlant);

  // Bottom-Right Oxblood Leather Lounge: Woven Rug + 4 Bookable Armchairs (OA1–OA4) + Floor Lamp
  const oxRug = new THREE.Mesh(new THREE.PlaneGeometry(2.65, 2.65), mats.rugMaterial);
  oxRug.rotation.x = -Math.PI / 2;
  oxRug.position.set(-2.12, 0.008, 3.85);
  oxRug.receiveShadow = true;
  root.add(oxRug);

  const oxFloorLamp = createFloorLamp(mats, lamps, 1.66);
  oxFloorLamp.position.set(-1.3, 0, 2.42);
  root.add(oxFloorLamp);

  const oxCoffee = createMarbleTable(mats, 0.86, 0.86, 0.42);
  oxCoffee.position.set(-2.12, 0, 3.85);
  root.add(oxCoffee);
  const oxPlant = createPottedPlant(mats, 0.34, 12);
  oxPlant.position.set(-2.12, 0.42, 3.85);
  root.add(oxPlant);

  const oxSpecs: [string, number, number, number][] = [
    ['OA1', -2.96, 3.85, Math.PI / 2],
    ['OA2', -1.28, 3.85, -Math.PI / 2],
    ['OA3', -2.12, 2.95, 0],
    ['OA4', -2.12, 4.75, Math.PI],
  ];
  for (const [id, ox, oz, rot] of oxSpecs) {
    registerGeneralChair(
      id,
      `Oxblood Armchair ${id}`,
      'Main Reading Hall & Lounge',
      'South-East Reading Lounge',
      ox,
      oz,
      rot,
      mats.oxbloodLeather,
      true,
      { ...STANDARD_SEAT_RATES },
      '/assets/aistudio/Modern_Library_Reading_Hall_8702bf49.png'
    );
  }
  colliders.push({ minX: -3.35, maxX: -0.92, minZ: 2.65, maxZ: 5.05 });

  // Window Seating Benches (NON-BOOKABLE shared bench seating)
  for (const [idx, bx] of [-7.0, -4.45, -1.95].entries()) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.46, 0.56), mats.walnutWood);
    bench.position.set(bx, 0.23, 5.82);
    bench.castShadow = true;
    root.add(bench);

    const cushion = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.52), mats.lightGreyFabric);
    cushion.position.set(bx, 0.5, 5.82);
    root.add(cushion);

    const benchLed = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.02, 0.02), mats.ledStripEmissive);
    benchLed.position.set(bx, 0.05, 5.53);
    root.add(benchLed);

    const benchPlant = createTrailingShelfPlant(mats, 0.95, idx * 9 + 5);
    benchPlant.position.set(bx + 0.72, 0.54, 5.82);
    root.add(benchPlant);

    const benchNotice = createNonBookableProxy(
      'sofa',
      `WINDOW-BENCH-${idx + 1}`,
      'Window Seating Bench · Shared Seating',
      'Benches & sofas cannot be booked individually — select any single chair',
      2.05,
      0.6,
      0.58,
      [bx, 0, 5.82]
    );
    root.add(benchNotice.hitTarget);
    noticeTargets.push(benchNotice.notice);
  }

  for (const [px, pz, s] of [
    [-8.35, -5.65, 1.12],
    [-3.68, -5.68, 1.0],
    [-8.25, 5.45, 1.15],
    [-1.25, -1.65, 1.05],
    [-8.3, -0.15, 0.95],
    [2.95, -5.55, 0.95],
  ] as [number, number, number][]) {
    const plant = createPottedPlant(mats, s, px * 3 + pz);
    plant.position.set(px, 0, pz);
    root.add(plant);
  }

  // =========================================================================
  // CEILING, PENDANT CHANDELIERS & ARCHITECTURAL COVE LIGHTING
  // =========================================================================
  const ceilingSlab = new THREE.Mesh(new THREE.PlaneGeometry(18.0, 12.4), mats.ceilingPanel);
  ceilingSlab.rotation.x = Math.PI / 2;
  ceilingSlab.position.set(0, WALL_H + 0.02, 0);
  ceilingGroup.add(ceilingSlab);

  const marblePendant1 = createLinearPendantLight(mats, lamps, 2.2, 0.62);
  marblePendant1.position.set(-5.9, WALL_H, 0);
  ceilingGroup.add(marblePendant1);

  const marblePendant2 = createLinearPendantLight(mats, lamps, 2.2, 0.62);
  marblePendant2.position.set(-3.7, WALL_H, 0);
  ceilingGroup.add(marblePendant2);

  const hubPendant = createLinearPendantLight(mats, lamps, 2.4, 0.62);
  hubPendant.position.set(6.2, WALL_H, 3.8);
  ceilingGroup.add(hubPendant);

  const coveCoords: [number, number, number, number][] = [
    [-4.8, 0, 5.6, 0.14],
    [-4.8, -3.8, 4.6, 0.12],
    [-4.8, 3.8, 4.6, 0.12],
    [1.3, -0.5, 2.2, 0.12],
    [6.45, -1.0, 3.8, 0.12],
    [6.2, 3.8, 3.4, 0.14],
  ];
  for (const [cx, cz, len, w] of coveCoords) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.03, w),
      mats.ceilingCoveEmissive
    );
    strip.position.set(cx, WALL_H - 0.01, cz);
    ceilingGroup.add(strip);
  }
  root.add(ceilingGroup);

  return {
    root,
    ceilingGroup,
    bookableChairs,
    roomBookingMeta,
    noticeTargets,
    receptionist,
    wallMeshes,
    lamps,
    colliders,
    windowGlassMeshes,
    exteriorSkyBackdrop,
    exteriorSkyMat,
  };
}

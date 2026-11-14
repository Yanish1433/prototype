import * as THREE from 'three';
import type { MaterialLibrary } from './materials';
import type { StudyChairMetadata } from '../types/space';

export interface BookableChairHandle {
  metadata: StudyChairMetadata;
  group: THREE.Group;
  chairBody: THREE.Group;
  hitTarget: THREE.Mesh;
  statusRing: THREE.Mesh;
  statusRingMat: THREE.MeshStandardMaterial;
  restLocalPos: THREE.Vector3;
  pullOutOffset: THREE.Vector3;
  baseRotationY: number;
  currentSlide: number;
  slideVelocity: number;
  targetSlide: number;
  currentSwivel: number;
  swivelVelocity: number;
  isSelected: boolean;
  isBooked: boolean;
  isHovered: boolean;
}

export interface InteractiveNoticeTarget {
  hitTarget: THREE.Mesh;
  kind: 'sofa' | 'innovation-chair';
  id: string;
  title: string;
  subtitle: string;
  worldPosition: [number, number, number];
}

export interface LampLightHandle {
  light: THREE.PointLight;
  baseIntensity: number;
  eveningIntensity: number;
  nightIntensity: number;
  phase: number;
  linkedChairId?: string;
}

export interface ReceptionistHandle {
  group: THREE.Group;
  hitTarget: THREE.Mesh;
  worldPosition: [number, number, number];
  update: (elapsed: number, isGuiding: boolean, camX: number, camZ: number) => void;
}

export function addContactShadow(
  parent: THREE.Group,
  mats: MaterialLibrary,
  width: number,
  depth: number,
  y = 0.004
) {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mesh = new THREE.Mesh(geo, mats.contactShadowMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = 1;
  parent.add(mesh);
  return mesh;
}

function createHitMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });
}

function createRoundedBoxGeo(w: number, h: number, d: number, radius = 0.03): THREE.ExtrudeGeometry {
  const hw = w / 2 - radius;
  const hd = d / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hd - radius);
  shape.lineTo(hw, -hd - radius);
  shape.quadraticCurveTo(hw + radius, -hd - radius, hw + radius, -hd);
  shape.lineTo(hw + radius, hd);
  shape.quadraticCurveTo(hw + radius, hd + radius, hw, hd + radius);
  shape.lineTo(-hw, hd + radius);
  shape.quadraticCurveTo(-hw - radius, hd + radius, -hw - radius, hd);
  shape.lineTo(-hw - radius, -hd);
  shape.quadraticCurveTo(-hw - radius, -hd - radius, -hw, -hd - radius);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, h - radius * 2),
    bevelEnabled: true,
    bevelThickness: radius,
    bevelSize: radius,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
}

export function createPottedPlant(
  mats: MaterialLibrary,
  scale = 1.0,
  seed = 1
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, mats, 0.56 * scale, 0.56 * scale);

  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.14 * scale, 0.0),
    new THREE.Vector2(0.2 * scale, 0.22 * scale),
    new THREE.Vector2(0.21 * scale, 0.36 * scale),
    new THREE.Vector2(0.18 * scale, 0.36 * scale),
    new THREE.Vector2(0.16 * scale, 0.3 * scale),
    new THREE.Vector2(0.0, 0.3 * scale),
  ];
  const potGeo = new THREE.LatheGeometry(pts, 20);
  const pot = new THREE.Mesh(potGeo, mats.ceramicWhite);
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.175 * scale, 0.16 * scale, 0.04 * scale, 16),
    mats.soilDark
  );
  soil.position.y = 0.31 * scale;
  group.add(soil);

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.06 * scale, 0.12 * scale, 0.0, 0.28 * scale);
  leafShape.quadraticCurveTo(-0.06 * scale, 0.12 * scale, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 6);

  const leafCount = 24;
  const leafInstanced = new THREE.InstancedMesh(leafGeo, mats.foliageGreen, leafCount);
  leafInstanced.castShadow = true;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let i = 0; i < leafCount; i++) {
    const t = i / leafCount;
    const angle = i * 2.39996 + seed;
    const radius = (0.04 + t * 0.16) * scale;
    const height = (0.36 + (1 - t * 0.65) * 0.56) * scale;
    dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    dummy.rotation.set(0.45 + t * 0.65, -angle + Math.PI / 2, (i % 2 === 0 ? 1 : -1) * 0.15);
    const s = 0.72 + ((i * 17) % 10) * 0.055;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    leafInstanced.setMatrixAt(i, dummy.matrix);

    color.setHSL(0.3 + ((i % 5) - 2) * 0.015, 0.42, 0.28 + (i % 3) * 0.04);
    leafInstanced.setColorAt(i, color);
  }
  leafInstanced.instanceMatrix.needsUpdate = true;
  if (leafInstanced.instanceColor) leafInstanced.instanceColor.needsUpdate = true;
  leafInstanced.computeBoundingSphere();
  group.add(leafInstanced);

  return group;
}

export function createBrassDomeLamp(
  mats: MaterialLibrary,
  lampsOut: LampLightHandle[],
  scale = 1.0,
  lightIntensity = { day: 0.14, evening: 1.7, night: 3.1 },
  linkedChairId?: string
): THREE.Group {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075 * scale, 0.088 * scale, 0.022 * scale, 20),
    mats.brushedBrass
  );
  base.position.y = 0.011 * scale;
  group.add(base);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02 * scale, 0),
    new THREE.Vector3(0, 0.24 * scale, -0.02 * scale),
    new THREE.Vector3(0, 0.36 * scale, 0.04 * scale),
    new THREE.Vector3(0, 0.34 * scale, 0.09 * scale),
  ]);
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 14, 0.0085 * scale, 10, false),
    mats.brushedBrass
  );
  group.add(stem);

  const shadePts = [
    new THREE.Vector2(0.012 * scale, 0.08 * scale),
    new THREE.Vector2(0.055 * scale, 0.072 * scale),
    new THREE.Vector2(0.095 * scale, 0.036 * scale),
    new THREE.Vector2(0.105 * scale, 0.0),
  ];
  const shade = new THREE.Mesh(new THREE.LatheGeometry(shadePts, 24), mats.brushedBrass);
  shade.position.set(0, 0.28 * scale, 0.09 * scale);
  group.add(shade);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.028 * scale, 12, 10),
    mats.lampBulbEmissive
  );
  bulb.position.set(0, 0.285 * scale, 0.09 * scale);
  group.add(bulb);

  // Volumetric downward soft light cone + desk surface radial light pool
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.29 * scale, 0.28 * scale, 20, 1, true),
    mats.lampLightConeMat
  );
  cone.position.set(0, 0.145 * scale, 0.09 * scale);
  cone.renderOrder = 4;
  group.add(cone);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(0.42 * scale, 24),
    mats.lampLightPoolMat
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.005, 0.09 * scale);
  pool.renderOrder = 2;
  group.add(pool);

  const ptLight = new THREE.PointLight(0xffb860, lightIntensity.day, 3.6, 1.8);
  ptLight.position.set(0, 0.24 * scale, 0.09 * scale);
  ptLight.castShadow = false;
  group.add(ptLight);

  lampsOut.push({
    light: ptLight,
    baseIntensity: lightIntensity.day,
    eveningIntensity: lightIntensity.evening,
    nightIntensity: lightIntensity.night,
    phase: Math.random() * Math.PI * 2,
    linkedChairId,
  });

  return group;
}

export function createFloorLamp(
  mats: MaterialLibrary,
  lampsOut: LampLightHandle[],
  height = 1.65
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, mats, 0.45, 0.45);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.03, 24),
    mats.brushedBrass
  );
  base.position.y = 0.015;
  group.add(base);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.016, height - 0.35, 14),
    mats.brushedBrass
  );
  pole.position.y = (height - 0.35) / 2 + 0.03;
  pole.castShadow = true;
  group.add(pole);

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.23, 0.32, 24, 1, true),
    mats.lampShadeLinen
  );
  shade.position.y = height - 0.16;
  group.add(shade);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 14, 12),
    mats.lampBulbEmissive
  );
  bulb.position.y = height - 0.18;
  group.add(bulb);

  // Soft downward light cone + warm floor radial glow pool
  const downCone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.72, 1.28, 24, 1, true),
    mats.lampLightConeMat
  );
  downCone.position.y = height - 0.94;
  downCone.renderOrder = 4;
  group.add(downCone);

  const floorPool = new THREE.Mesh(
    new THREE.CircleGeometry(1.18, 28),
    mats.lampLightPoolMat
  );
  floorPool.rotation.x = -Math.PI / 2;
  floorPool.position.y = 0.01;
  floorPool.renderOrder = 2;
  group.add(floorPool);

  const ptLight = new THREE.PointLight(0xffbe6a, 0.15, 6.2, 1.7);
  ptLight.position.y = height - 0.2;
  ptLight.castShadow = false;
  group.add(ptLight);

  lampsOut.push({
    light: ptLight,
    baseIntensity: 0.15,
    eveningIntensity: 2.2,
    nightIntensity: 4.1,
    phase: Math.random() * Math.PI * 2,
  });

  return group;
}

export function createLinearPendantLight(
  mats: MaterialLibrary,
  lampsOut: LampLightHandle[],
  length = 2.1,
  dropY = 0.58
): THREE.Group {
  const group = new THREE.Group();

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.6, 0.035, 0.12),
    mats.brushedBrass
  );
  canopy.position.y = -0.018;
  group.add(canopy);

  for (const rx of [-length * 0.28, length * 0.28]) {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, dropY, 8),
      mats.brushedBrass
    );
    rod.position.set(rx, -dropY / 2, 0);
    group.add(rod);
  }

  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.05, 0.09),
    mats.brushedBrass
  );
  bar.position.y = -dropY;
  group.add(bar);

  const diffuser = new THREE.Mesh(
    new THREE.BoxGeometry(length - 0.08, 0.018, 0.065),
    mats.lampBulbEmissive
  );
  diffuser.position.y = -dropY - 0.025;
  group.add(diffuser);

  const pt = new THREE.PointLight(0xffc97d, 0.12, 6.8, 1.6);
  pt.position.y = -dropY - 0.12;
  group.add(pt);

  lampsOut.push({
    light: pt,
    baseIntensity: 0.12,
    eveningIntensity: 1.55,
    nightIntensity: 2.75,
    phase: Math.random() * Math.PI * 2,
  });

  return group;
}

export function createWallSconce(
  mats: MaterialLibrary,
  lampsOut: LampLightHandle[]
): THREE.Group {
  const group = new THREE.Group();
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.18, 0.07),
    mats.darkAnodized
  );
  group.add(housing);

  const lens = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.14, 0.015),
    mats.lampBulbEmissive
  );
  lens.position.z = -0.038;
  group.add(lens);

  const pt = new THREE.PointLight(0xffbe6b, 0.1, 2.8, 2);
  pt.position.set(0, -0.04, -0.18);
  group.add(pt);

  lampsOut.push({
    light: pt,
    baseIntensity: 0.1,
    eveningIntensity: 1.2,
    nightIntensity: 2.2,
    phase: Math.random() * Math.PI * 2,
  });

  return group;
}

export function createSwivelChairGroup(
  mats: MaterialLibrary,
  fabricMat: THREE.Material = mats.lightGreyFabric
): { root: THREE.Group; body: THREE.Group } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  addContactShadow(root, mats, 0.68, 0.68);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.026, 0.26),
      mats.darkAnodized
    );
    arm.position.set(Math.sin(a) * 0.13, 0.065, Math.cos(a) * 0.13);
    arm.rotation.y = a;
    body.add(arm);

    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.024, 12),
      mats.darkAnodized
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(Math.sin(a) * 0.24, 0.025, Math.cos(a) * 0.24);
    body.add(wheel);
  }

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.032, 0.36, 14),
    mats.chromeMetal
  );
  stem.position.y = 0.24;
  body.add(stem);

  const seatGeo = createRoundedBoxGeo(0.5, 0.09, 0.48, 0.028);
  const seat = new THREE.Mesh(seatGeo, fabricMat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  seat.receiveShadow = true;
  body.add(seat);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.28, 0.03),
    mats.darkAnodized
  );
  spine.position.set(0, 0.56, -0.23);
  spine.rotation.x = -0.14;
  body.add(spine);

  const backGeo = createRoundedBoxGeo(0.46, 0.42, 0.075, 0.026);
  const backrest = new THREE.Mesh(backGeo, fabricMat);
  backrest.position.set(0, 0.74, -0.21);
  backrest.rotation.x = -0.1;
  backrest.castShadow = true;
  backrest.receiveShadow = true;
  body.add(backrest);

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.22, 0.045),
      mats.darkAnodized
    );
    post.position.set(side * 0.255, 0.53, -0.02);
    body.add(post);

    const pad = new THREE.Mesh(
      createRoundedBoxGeo(0.055, 0.032, 0.28, 0.012),
      mats.darkAnodized
    );
    pad.position.set(side * 0.255, 0.645, -0.01);
    pad.castShadow = true;
    body.add(pad);
  }

  return { root, body };
}

/**
 * Registers any individual chair or lounge armchair as an interactive bookable seat
 * that smoothly slides backwards when hovered/clicked.
 */
export function makeBookableChairInstance(
  chairVisualRoot: THREE.Group,
  chairVisualBody: THREE.Group,
  meta: StudyChairMetadata,
  worldX: number,
  worldZ: number,
  facingRotY: number,
  slideDistance = 0.42,
  ringRadius = 0.34
): BookableChairHandle {
  const stationGroup = new THREE.Group();
  stationGroup.position.set(worldX, 0, worldZ);
  stationGroup.rotation.y = facingRotY;

  const chairContainer = new THREE.Group();
  const restLocalPos = new THREE.Vector3(0, 0, 0);
  chairContainer.position.copy(restLocalPos);
  stationGroup.add(chairContainer);

  chairContainer.add(chairVisualRoot);

  const statusRingMat = new THREE.MeshStandardMaterial({
    color: 0x3f6b56,
    emissive: new THREE.Color(0x2f5443),
    emissiveIntensity: 0.16,
    roughness: 0.45,
    metalness: 0.1,
    transparent: true,
    opacity: 0.5,
  });
  const statusRing = new THREE.Mesh(
    new THREE.RingGeometry(ringRadius, ringRadius + 0.04, 32),
    statusRingMat
  );
  statusRing.rotation.x = -Math.PI / 2;
  statusRing.position.y = 0.008;
  chairContainer.add(statusRing);

  const hitTarget = new THREE.Mesh(
    new THREE.BoxGeometry(ringRadius * 2.1, 1.05, ringRadius * 2.1),
    createHitMaterial()
  );
  hitTarget.position.y = 0.52;
  hitTarget.userData.bookableChairId = meta.id;
  hitTarget.userData.interactiveKind = 'chair';
  chairContainer.add(hitTarget);

  chairVisualBody.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.userData.bookableChairId = meta.id;
      child.userData.interactiveKind = 'chair';
    }
  });

  // In chair local space, +Z is front (towards table), -Z is behind the backrest
  // Wait: in createSwivelChairGroup & createLoungeArmchair, backrest is at -Z, front is +Z!
  // So pulling the chair backwards away from the desk moves along -Z!
  return {
    metadata: meta,
    group: stationGroup,
    chairBody: chairContainer,
    hitTarget,
    statusRing,
    statusRingMat,
    restLocalPos,
    pullOutOffset: new THREE.Vector3(0, 0, -slideDistance),
    baseRotationY: 0,
    currentSlide: 0,
    slideVelocity: 0,
    targetSlide: 0,
    currentSwivel: 0,
    swivelVelocity: 0,
    isSelected: false,
    isBooked: false,
    isHovered: false,
  };
}

export function createQuietStudyStation(
  mats: MaterialLibrary,
  lampsOut: LampLightHandle[],
  meta: StudyChairMetadata
): BookableChairHandle {
  const stationGroup = new THREE.Group();
  stationGroup.position.set(meta.worldPosition[0], 0, meta.worldPosition[2]);

  const isNorthRow = meta.worldPosition[2] < -0.8;
  stationGroup.rotation.y = isNorthRow ? 0 : Math.PI;

  const deskGroup = new THREE.Group();
  deskGroup.position.set(0, 0, -0.48);
  stationGroup.add(deskGroup);
  addContactShadow(deskGroup, mats, 1.56, 0.85);

  const deskW = 1.48;
  const deskD = 0.76;
  const deskH = 0.75;

  for (const side of [-1, 1]) {
    const sidePanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 1.52, deskD),
      mats.walnutWood
    );
    sidePanel.position.set(side * (deskW / 2 - 0.022), 0.76, 0);
    sidePanel.castShadow = true;
    sidePanel.receiveShadow = true;
    deskGroup.add(sidePanel);
  }

  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(deskW - 0.04, 1.52, 0.04),
    mats.walnutWood
  );
  backPanel.position.set(0, 0.76, -deskD / 2 + 0.02);
  backPanel.castShadow = true;
  deskGroup.add(backPanel);

  const desktop = new THREE.Mesh(
    new THREE.BoxGeometry(deskW - 0.04, 0.045, deskD - 0.02),
    mats.walnutWood
  );
  desktop.position.set(0, deskH, 0.01);
  desktop.castShadow = true;
  desktop.receiveShadow = true;
  deskGroup.add(desktop);

  // Pedestal drawer cabinets + brushed brass drawer handles
  for (const side of [-1, 1]) {
    const pedX = side * (deskW / 2 - 0.19);
    const ped = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.42, 0.56),
      mats.walnutWood
    );
    ped.position.set(pedX, 0.52, -0.04);
    ped.castShadow = true;
    deskGroup.add(ped);

    for (const dy of [0.43, 0.6]) {
      const pull = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.012, 0.02),
        mats.brushedBrass
      );
      pull.position.set(pedX, dy, 0.25);
      deskGroup.add(pull);
    }
  }

  const hutchShelf = new THREE.Mesh(
    new THREE.BoxGeometry(deskW - 0.04, 0.035, 0.28),
    mats.walnutWood
  );
  hutchShelf.position.set(0, 1.18, -deskD / 2 + 0.16);
  deskGroup.add(hutchShelf);

  const hutchTop = new THREE.Mesh(
    new THREE.BoxGeometry(deskW - 0.04, 0.04, 0.3),
    mats.walnutWood
  );
  hutchTop.position.set(0, 1.5, -deskD / 2 + 0.17);
  deskGroup.add(hutchTop);

  const ledStrip = new THREE.Mesh(
    new THREE.BoxGeometry(deskW - 0.14, 0.016, 0.028),
    mats.ledStripEmissive
  );
  ledStrip.position.set(0, 1.155, -deskD / 2 + 0.22);
  deskGroup.add(ledStrip);

  const booksBlock = new THREE.Mesh(
    new THREE.BoxGeometry(deskW - 0.18, 0.25, 0.2),
    mats.bookSpines
  );
  booksBlock.position.set(0, 1.325, -deskD / 2 + 0.16);
  booksBlock.castShadow = true;
  deskGroup.add(booksBlock);

  // Laptop + Notebook + Pen cup + Coffee mug on desk
  const laptopBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.014, 0.23),
    mats.darkAnodized
  );
  laptopBase.position.set(0, deskH + 0.03, 0.08);
  deskGroup.add(laptopBase);

  const laptopLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.22, 0.012),
    mats.darkAnodized
  );
  laptopLid.position.set(0, deskH + 0.135, -0.05);
  laptopLid.rotation.x = -0.22;
  deskGroup.add(laptopLid);

  const laptopScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.31, 0.19),
    mats.laptopScreenEmissive
  );
  laptopScreen.position.set(0, deskH + 0.135, -0.043);
  laptopScreen.rotation.x = -0.22;
  deskGroup.add(laptopScreen);

  const notebook = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.012, 0.21),
    mats.ceramicWhite
  );
  notebook.position.set(-0.28, deskH + 0.028, 0.12);
  notebook.rotation.y = 0.12;
  deskGroup.add(notebook);

  const penCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.028, 0.08, 12),
    mats.darkAnodized
  );
  penCup.position.set(0.32, deskH + 0.062, -0.04);
  deskGroup.add(penCup);

  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.03, 0.075, 14),
    mats.ceramicWhite
  );
  mug.position.set(0.34, deskH + 0.06, 0.14);
  deskGroup.add(mug);

  const deskLamp = createBrassDomeLamp(
    mats,
    lampsOut,
    0.95,
    {
      day: 0.14,
      evening: 1.75,
      night: 3.25,
    },
    meta.id
  );
  deskLamp.position.set(0.46, deskH + 0.022, -0.14);
  deskLamp.rotation.y = -0.4;
  deskGroup.add(deskLamp);

  const miniPlant = createPottedPlant(mats, 0.34, meta.worldPosition[0] * 10);
  miniPlant.position.set(-0.48, deskH + 0.022, -0.12);
  deskGroup.add(miniPlant);

  // Chair facing desk (-Z)
  const chairContainer = new THREE.Group();
  const restLocalPos = new THREE.Vector3(0, 0, 0.26);
  chairContainer.position.copy(restLocalPos);
  chairContainer.rotation.y = Math.PI;
  stationGroup.add(chairContainer);

  const { root: chairRoot, body: chairBody } = createSwivelChairGroup(
    mats,
    mats.lightGreyFabric
  );
  chairContainer.add(chairRoot);

  const statusRingMat = new THREE.MeshStandardMaterial({
    color: 0x3f6b56,
    emissive: new THREE.Color(0x2f5443),
    emissiveIntensity: 0.18,
    roughness: 0.45,
    metalness: 0.1,
    transparent: true,
    opacity: 0.55,
  });
  const statusRing = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.36, 32),
    statusRingMat
  );
  statusRing.rotation.x = -Math.PI / 2;
  statusRing.position.y = 0.008;
  chairContainer.add(statusRing);

  const hitTarget = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 1.08, 0.76),
    createHitMaterial()
  );
  hitTarget.position.y = 0.54;
  hitTarget.userData.bookableChairId = meta.id;
  hitTarget.userData.interactiveKind = 'chair';
  chairContainer.add(hitTarget);

  chairBody.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.userData.bookableChairId = meta.id;
      child.userData.interactiveKind = 'chair';
    }
  });

  return {
    metadata: meta,
    group: stationGroup,
    chairBody: chairContainer,
    hitTarget,
    statusRing,
    statusRingMat,
    restLocalPos,
    pullOutOffset: new THREE.Vector3(0, 0, 0.44),
    baseRotationY: Math.PI,
    currentSlide: 0,
    slideVelocity: 0,
    targetSlide: 0,
    currentSwivel: 0,
    swivelVelocity: 0,
    isSelected: false,
    isBooked: false,
    isHovered: false,
  };
}

export function createTrailingShelfPlant(
  mats: MaterialLibrary,
  scale = 1.0,
  seed = 3
): THREE.Group {
  const group = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075 * scale, 0.06 * scale, 0.11 * scale, 14),
    mats.terracottaPot
  );
  pot.position.y = 0.055 * scale;
  pot.castShadow = true;
  group.add(pot);

  const crown = createPottedPlant(mats, 0.24 * scale, seed);
  crown.position.y = 0.06 * scale;
  group.add(crown);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + seed * 0.4;
    const vine = new THREE.Mesh(
      new THREE.ConeGeometry(0.026 * scale, 0.18 * scale, 6),
      mats.foliageGreen
    );
    vine.position.set(
      Math.cos(a) * 0.068 * scale,
      0.04 * scale,
      Math.sin(a) * 0.068 * scale
    );
    vine.rotation.x = Math.PI - 0.25;
    vine.rotation.y = a;
    group.add(vine);
  }
  return group;
}

export function createBookshelfUnit(
  mats: MaterialLibrary,
  width: number,
  height: number,
  depth = 0.36,
  tiers = 5,
  withDecor = false
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, mats, width + 0.12, depth + 0.12);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.03),
    mats.walnutWood
  );
  back.position.set(0, height / 2, -depth / 2 + 0.015);
  back.castShadow = true;
  back.receiveShadow = true;
  group.add(back);

  for (const side of [-1, 1]) {
    const upright = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, height, depth),
      mats.walnutWood
    );
    upright.position.set(side * (width / 2 - 0.02), height / 2, 0);
    upright.castShadow = true;
    group.add(upright);
  }

  const bookAccentMats = [
    mats.cognacLeather,
    mats.oxbloodLeather,
    mats.blazerNavy,
    mats.ceramicWhite,
    mats.terracottaPot,
  ];

  const tierHeight = (height - 0.12) / tiers;
  for (let i = 0; i <= tiers; i++) {
    const y = 0.06 + i * tierHeight;
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.04, 0.032, depth - 0.01),
      mats.walnutWood
    );
    shelf.position.set(0, y, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    group.add(shelf);

    if (i < tiers) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.1, 0.012, 0.022),
        mats.ledStripEmissive
      );
      strip.position.set(0, y + tierHeight - 0.022, depth / 2 - 0.05);
      group.add(strip);

      const bookH = tierHeight * 0.72;
      const isFeatureTier = withDecor && (i === 1 || i === tiers - 1);
      const bookW = isFeatureTier ? (width - 0.16) * 0.56 : width - 0.14;
      const books = new THREE.Mesh(
        new THREE.BoxGeometry(bookW, bookH, depth * 0.6),
        mats.bookSpines
      );
      books.position.set(isFeatureTier ? -width * 0.16 : 0, y + 0.016 + bookH / 2, -0.02);
      books.castShadow = true;
      group.add(books);

      // Individual protruding decorative hardcovers for realistic silhouette relief
      for (let b = 0; b < 3; b++) {
        const soloBook = new THREE.Mesh(
          new THREE.BoxGeometry(0.032, bookH * (0.88 + (b % 2) * 0.12), depth * 0.64),
          bookAccentMats[(i + b) % bookAccentMats.length]
        );
        soloBook.position.set(
          (isFeatureTier ? -width * 0.16 : 0) + (b - 1) * (bookW * 0.24),
          y + 0.016 + (bookH * 0.92) / 2,
          0.01
        );
        group.add(soloBook);
      }

      if (withDecor && i === 1) {
        const trophy = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.032, 0.18, 14),
          mats.brushedBrass
        );
        trophy.position.set(width * 0.24, y + 0.11, 0.02);
        group.add(trophy);
      } else if (withDecor && i === tiers - 1) {
        const shelfPlant = createTrailingShelfPlant(mats, 0.9, i * 11 + width * 3);
        shelfPlant.position.set(width * 0.24, y + 0.016, 0.04);
        group.add(shelfPlant);
      } else if (i === 0) {
        // Horizontal stacked art monographs on bottom shelf
        const flatBook = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.04, 0.18),
          mats.ceramicWhite
        );
        flatBook.position.set(width * 0.22, y + 0.036, 0.04);
        group.add(flatBook);
      }
    }
  }

  return group;
}

export function createLoungeArmchair(
  mats: MaterialLibrary,
  upholstery: THREE.Material
): { root: THREE.Group; body: THREE.Group } {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  addContactShadow(root, mats, 0.96, 0.96);

  for (const lx of [-0.36, 0.36]) {
    for (const lz of [-0.34, 0.34]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.016, 0.16, 10),
        mats.darkAnodized
      );
      leg.position.set(lx, 0.08, lz);
      body.add(leg);
    }
  }

  const base = new THREE.Mesh(createRoundedBoxGeo(0.84, 0.16, 0.82, 0.03), upholstery);
  base.position.y = 0.24;
  base.castShadow = true;
  base.receiveShadow = true;
  body.add(base);

  const cushion = new THREE.Mesh(createRoundedBoxGeo(0.62, 0.12, 0.66, 0.035), upholstery);
  cushion.position.set(0, 0.36, 0.04);
  cushion.castShadow = true;
  body.add(cushion);

  const back = new THREE.Mesh(createRoundedBoxGeo(0.84, 0.44, 0.18, 0.035), upholstery);
  back.position.set(0, 0.52, -0.32);
  back.castShadow = true;
  body.add(back);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(createRoundedBoxGeo(0.14, 0.3, 0.8, 0.03), upholstery);
    arm.position.set(side * 0.35, 0.44, 0);
    arm.castShadow = true;
    body.add(arm);
  }

  return { root, body };
}

export function createLoungeSofa(
  mats: MaterialLibrary,
  upholstery: THREE.Material,
  width = 2.1
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, mats, width + 0.16, 1.0);

  for (const lx of [-width / 2 + 0.12, width / 2 - 0.12]) {
    for (const lz of [-0.34, 0.34]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.016, 0.16, 10),
        mats.darkAnodized
      );
      leg.position.set(lx, 0.08, lz);
      group.add(leg);
    }
  }

  const base = new THREE.Mesh(createRoundedBoxGeo(width, 0.17, 0.84, 0.03), upholstery);
  base.position.y = 0.24;
  base.castShadow = true;
  group.add(base);

  const cushW = (width - 0.32) / 3;
  for (let i = -1; i <= 1; i++) {
    const cush = new THREE.Mesh(
      createRoundedBoxGeo(cushW - 0.02, 0.12, 0.68, 0.03),
      upholstery
    );
    cush.position.set(i * cushW, 0.37, 0.04);
    cush.castShadow = true;
    group.add(cush);
  }

  const back = new THREE.Mesh(createRoundedBoxGeo(width, 0.45, 0.18, 0.035), upholstery);
  back.position.set(0, 0.52, -0.33);
  back.castShadow = true;
  group.add(back);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(createRoundedBoxGeo(0.15, 0.32, 0.82, 0.03), upholstery);
    arm.position.set(side * (width / 2 - 0.075), 0.44, 0);
    arm.castShadow = true;
    group.add(arm);
  }

  return group;
}

export function createMarbleTable(
  mats: MaterialLibrary,
  width: number,
  depth: number,
  height = 0.75,
  withCableTray = false
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, mats, width + 0.15, depth + 0.15);

  const top = new THREE.Mesh(
    createRoundedBoxGeo(width, 0.05, depth, 0.014),
    mats.marbleSlab
  );
  top.position.y = height - 0.025;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  if (withCableTray) {
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.56, 0.014, depth * 0.18),
      mats.darkAnodized
    );
    tray.position.y = height + 0.002;
    group.add(tray);

    for (const gx of [-width * 0.18, 0, width * 0.18]) {
      const grommet = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.018, 0.07),
        mats.chromeMetal
      );
      grommet.position.set(gx, height + 0.004, 0);
      group.add(grommet);
    }
  }

  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.3, 0.045, depth - 0.3),
    mats.darkAnodized
  );
  apron.position.y = height - 0.065;
  group.add(apron);

  const legPositions =
    width > 3.5
      ? [-width / 2 + 0.28, 0, width / 2 - 0.28]
      : [-width / 2 + 0.22, width / 2 - 0.22];

  for (const lx of legPositions) {
    for (const lz of [-depth / 2 + 0.2, depth / 2 - 0.2]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.02, height - 0.06, 12),
        mats.darkAnodized
      );
      leg.position.set(lx, (height - 0.06) / 2, lz);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  return group;
}

export function createWoodStudyTable(
  mats: MaterialLibrary,
  width: number,
  depth: number,
  height = 0.75
): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, mats, width + 0.12, depth + 0.12);

  const top = new THREE.Mesh(
    createRoundedBoxGeo(width, 0.045, depth, 0.012),
    mats.walnutWood
  );
  top.position.y = height - 0.022;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  for (const lx of [-width / 2 + 0.14, width / 2 - 0.14]) {
    const trestle = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, height - 0.04, depth - 0.18),
      mats.darkAnodized
    );
    trestle.position.set(lx, (height - 0.04) / 2, 0);
    trestle.castShadow = true;
    group.add(trestle);
  }

  return group;
}

export function createReceptionDesk(mats: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  addContactShadow(group, mats, 2.5, 1.8);

  const frontCounter = new THREE.Mesh(
    createRoundedBoxGeo(1.95, 1.02, 0.62, 0.03),
    mats.walnutWood
  );
  frontCounter.position.set(-0.08, 0.51, 0);
  frontCounter.castShadow = true;
  frontCounter.receiveShadow = true;
  group.add(frontCounter);

  // Curved corner arc connecting front counter & side wing
  const curvedCorner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 1.02, 20, 1, false, 0, Math.PI / 2),
    mats.walnutWood
  );
  curvedCorner.position.set(0.68, 0.51, -0.32);
  curvedCorner.castShadow = true;
  group.add(curvedCorner);

  const sideWing = new THREE.Mesh(
    createRoundedBoxGeo(0.6, 1.02, 1.12, 0.03),
    mats.walnutWood
  );
  sideWing.position.set(0.98, 0.51, -0.82);
  sideWing.castShadow = true;
  group.add(sideWing);

  // Dual curved monitors + keyboard
  for (const offset of [-0.22, 0.22]) {
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.18, 0.05),
      mats.darkAnodized
    );
    stand.position.set(offset, 1.1, -0.08);
    group.add(stand);

    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.25, 0.02),
      mats.darkAnodized
    );
    screen.position.set(offset, 1.23, -0.06);
    screen.rotation.y = offset * 0.35;
    group.add(screen);

    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.39, 0.22),
      mats.laptopScreenEmissive
    );
    panel.position.set(offset, 1.23, -0.072);
    panel.rotation.y = Math.PI + offset * 0.35;
    group.add(panel);
  }

  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.014, 0.12),
    mats.darkAnodized
  );
  keyboard.position.set(0, 1.03, -0.18);
  group.add(keyboard);

  const plant = createPottedPlant(mats, 0.38, 77);
  plant.position.set(-0.78, 1.02, 0.08);
  group.add(plant);

  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.13, 0.025),
    mats.welcomePlaqueMat
  );
  plaque.position.set(-0.62, 1.085, 0.24);
  plaque.rotation.x = -0.18;
  group.add(plaque);

  return group;
}

export function createReceptionistHelper(
  mats: MaterialLibrary,
  worldPosition: [number, number, number]
): ReceptionistHandle {
  const group = new THREE.Group();
  group.position.set(worldPosition[0], 0, worldPosition[2]);
  addContactShadow(group, mats, 0.72, 0.72);

  // Subtle brass floor indicator ring
  const floorRing = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.36, 32),
    mats.brushedBrass
  );
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.y = 0.008;
  group.add(floorRing);

  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  // 1. Shoes & tailored slacks
  for (const sx of [-0.085, 0.085]) {
    const shoe = new THREE.Mesh(
      createRoundedBoxGeo(0.085, 0.055, 0.18, 0.015),
      mats.darkAnodized
    );
    shoe.position.set(sx, 0.028, 0.03);
    bodyRoot.add(shoe);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.042, 0.76, 12),
      mats.blazerNavy
    );
    leg.position.set(sx, 0.42, 0);
    leg.castShadow = true;
    bodyRoot.add(leg);
  }

  // 2. Blouse & tailored blazer torso + lapel collar
  const torso = new THREE.Mesh(
    createRoundedBoxGeo(0.34, 0.48, 0.2, 0.045),
    mats.blazerNavy
  );
  torso.position.set(0, 1.04, 0);
  torso.castShadow = true;
  bodyRoot.add(torso);

  const blouseV = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.28, 0.03),
    mats.blouseCream
  );
  blouseV.position.set(0, 1.12, 0.095);
  bodyRoot.add(blouseV);

  const goldBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.024, 0.012),
    mats.brushedBrass
  );
  goldBadge.position.set(0.09, 1.17, 0.105);
  bodyRoot.add(goldBadge);

  // 3. Neck & articulated head pivot
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.048, 0.09, 12),
    mats.skinWarm
  );
  neck.position.set(0, 1.32, 0);
  bodyRoot.add(neck);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.43, 0);
  bodyRoot.add(headPivot);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.108, 20, 16), mats.skinWarm);
  head.scale.set(0.92, 1.06, 0.96);
  head.castShadow = true;
  headPivot.add(head);

  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.114, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
    mats.hairDark
  );
  hairCrown.position.set(0, 0.015, -0.01);
  headPivot.add(hairCrown);

  const hairBun = new THREE.Mesh(
    new THREE.SphereGeometry(0.056, 14, 12),
    mats.hairDark
  );
  hairBun.position.set(0, 0.02, -0.115);
  headPivot.add(hairBun);

  for (const ex of [-0.036, 0.036]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mats.darkAnodized);
    eye.position.set(ex, 0.01, 0.094);
    headPivot.add(eye);
  }

  // 4. Left arm holding concierge tablet
  const leftArm = new THREE.Mesh(
    createRoundedBoxGeo(0.075, 0.36, 0.08, 0.022),
    mats.blazerNavy
  );
  leftArm.position.set(-0.21, 1.04, 0.06);
  leftArm.rotation.x = -0.55;
  leftArm.rotation.z = 0.14;
  bodyRoot.add(leftArm);

  const tablet = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.014, 0.24),
    mats.darkAnodized
  );
  tablet.position.set(-0.14, 0.95, 0.22);
  tablet.rotation.x = 0.42;
  bodyRoot.add(tablet);

  // 5. Right arm welcoming pivot (waves/gestures smoothly)
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.2, 1.21, 0);
  bodyRoot.add(rightArmPivot);

  const rightArm = new THREE.Mesh(
    createRoundedBoxGeo(0.075, 0.36, 0.08, 0.022),
    mats.blazerNavy
  );
  rightArm.position.set(0.01, -0.17, 0.03);
  rightArm.rotation.x = -0.35;
  rightArmPivot.add(rightArm);

  const rightHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 12, 10),
    mats.skinWarm
  );
  rightHand.position.set(0.01, -0.35, 0.09);
  rightArmPivot.add(rightHand);

  // Clickable proxy hitbox
  const hitTarget = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 1.68, 0.76),
    createHitMaterial()
  );
  hitTarget.position.set(0, 0.84, 0);
  hitTarget.userData.interactiveKind = 'receptionist';
  hitTarget.userData.interactiveId = 'RECEPTIONIST-MAYA';
  group.add(hitTarget);

  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && obj !== floorRing) {
      obj.userData.interactiveKind = 'receptionist';
      obj.userData.interactiveId = 'RECEPTIONIST-MAYA';
    }
  });

  return {
    group,
    hitTarget,
    worldPosition,
    update: (elapsed: number, isGuiding: boolean, camX: number, camZ: number) => {
      // Gentle breathing
      bodyRoot.position.y = Math.sin(elapsed * 1.9) * 0.008;

      // Turn body/head subtly toward approaching visitor when inside Lobby/Entrance
      const dx = camX - worldPosition[0];
      const dz = camZ - worldPosition[2];
      const dist = Math.hypot(dx, dz);
      if (dist < 7.5 && dist > 0.4) {
        const targetWorldYaw = Math.atan2(dx, dz);
        let diff = targetWorldYaw - group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const clampedHead = THREE.MathUtils.clamp(diff * 0.45, -0.55, 0.55);
        headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, clampedHead, 0.08);
      } else {
        headPivot.rotation.y = THREE.MathUtils.lerp(
          headPivot.rotation.y,
          Math.sin(elapsed * 0.5) * 0.14,
          0.05
        );
      }

      // Welcoming hand gesture
      const waveTarget = isGuiding
        ? -0.95 + Math.sin(elapsed * 4.2) * 0.22
        : -0.3 + Math.sin(elapsed * 1.4) * 0.12;
      rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, waveTarget, 0.1);
      rightArmPivot.rotation.z = THREE.MathUtils.lerp(
        rightArmPivot.rotation.z,
        isGuiding ? -0.35 : -0.1,
        0.1
      );
    },
  };
}

export function createEspressoStation(mats: MaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    createRoundedBoxGeo(0.32, 0.34, 0.28, 0.02),
    mats.espressoSteel
  );
  body.position.y = 0.17;
  body.castShadow = true;
  group.add(body);

  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.025, 0.12),
    mats.chromeMetal
  );
  tray.position.set(0, 0.015, 0.14);
  group.add(tray);

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12),
    mats.chromeMetal
  );
  head.position.set(0, 0.22, 0.15);
  group.add(head);

  for (const cx of [-0.07, 0.07]) {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.022, 0.055, 12),
      mats.ceramicWhite
    );
    cup.position.set(cx, 0.055, 0.15);
    group.add(cup);
  }
  return group;
}

export function createWallArtFrame(
  mats: MaterialLibrary,
  artIdx: number,
  width = 0.62,
  height = 0.78
): THREE.Group {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.036),
    mats.darkAnodized
  );
  group.add(frame);

  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.07, height - 0.07),
    mats.artMaterials[artIdx % mats.artMaterials.length]
  );
  canvas.position.z = 0.019;
  group.add(canvas);
  return group;
}

export function createKitchenAppliances(
  mats: MaterialLibrary,
  sinkPos: [number, number, number],
  stovePos: [number, number, number],
  stoveRotY = 0
): THREE.Group {
  const group = new THREE.Group();

  // Stainless steel sink basin + arched chrome gooseneck faucet
  const sinkRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.025, 0.44),
    mats.chromeMetal
  );
  sinkRim.position.set(sinkPos[0], sinkPos[1], sinkPos[2]);
  group.add(sinkRim);

  const sinkBasin = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.028, 0.36),
    mats.darkAnodized
  );
  sinkBasin.position.set(sinkPos[0], sinkPos[1] + 0.004, sinkPos[2]);
  group.add(sinkBasin);

  const faucetCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.2, 0),
    new THREE.Vector3(0, 0.24, 0.08),
    new THREE.Vector3(0, 0.16, 0.12),
  ]);
  const faucet = new THREE.Mesh(
    new THREE.TubeGeometry(faucetCurve, 12, 0.01, 8, false),
    mats.chromeMetal
  );
  faucet.position.set(sinkPos[0], sinkPos[1] + 0.01, sinkPos[2] - 0.18);
  group.add(faucet);

  // 2-burner induction cooktop
  const stoveGroup = new THREE.Group();
  stoveGroup.position.set(stovePos[0], stovePos[1], stovePos[2]);
  stoveGroup.rotation.y = stoveRotY;
  const glassTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.02, 0.34),
    mats.darkAnodized
  );
  stoveGroup.add(glassTop);

  for (const bx of [-0.13, 0.13]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.075, 20),
      mats.chromeMetal
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(bx, 0.012, 0);
    stoveGroup.add(ring);
  }
  group.add(stoveGroup);

  return group;
}

export function createDoorwayDoor(
  mats: MaterialLibrary,
  openAngle = 0.78,
  width = 0.96,
  height = 2.25
): THREE.Group {
  const group = new THREE.Group();

  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, height, 0.18),
      mats.walnutWood
    );
    jamb.position.set(side * (width / 2 + 0.02), height / 2, 0);
    group.add(jamb);
  }
  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.1, 0.06, 0.18),
    mats.walnutWood
  );
  lintel.position.set(0, height + 0.02, 0);
  group.add(lintel);

  const hinge = new THREE.Group();
  hinge.position.set(-width / 2, 0, 0);
  hinge.rotation.y = openAngle;
  group.add(hinge);

  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(width, height - 0.02, 0.045),
    mats.oakDoor
  );
  leaf.position.set(width / 2, (height - 0.02) / 2, 0);
  leaf.castShadow = true;
  leaf.receiveShadow = true;
  hinge.add(leaf);

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.024, 0.09),
    mats.darkAnodized
  );
  handle.position.set(width - 0.1, 1.02, 0);
  hinge.add(handle);

  return group;
}

export function createDoorwayPlaque(
  mats: MaterialLibrary,
  plaqueMat: THREE.Material,
  width = 0.88,
  height = 0.24
): THREE.Group {
  const group = new THREE.Group();

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.03, height + 0.03, 0.018),
    mats.brushedBrass
  );
  group.add(backing);

  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), plaqueMat);
  face.position.z = 0.011;
  group.add(face);

  return group;
}

export function createNonBookableProxy(
  kind: 'sofa' | 'innovation-chair',
  id: string,
  title: string,
  subtitle: string,
  width: number,
  height: number,
  depth: number,
  worldPos: [number, number, number]
): { hitTarget: THREE.Mesh; notice: InteractiveNoticeTarget } {
  const hitTarget = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    createHitMaterial()
  );
  hitTarget.position.set(worldPos[0], height / 2, worldPos[2]);
  hitTarget.userData.interactiveKind = kind;
  hitTarget.userData.interactiveId = id;

  return {
    hitTarget,
    notice: {
      hitTarget,
      kind,
      id,
      title,
      subtitle,
      worldPosition: worldPos,
    },
  };
}

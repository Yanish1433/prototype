import * as THREE from 'three';
import type { LightingMode } from '../types/space';
import type { MaterialLibrary } from './materials';
import type { FloorplanSceneData } from './floorplan';

export interface LightingRig {
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  readingAmbientFill: THREE.PointLight;
  receptionAmbientFill: THREE.PointLight;
  dustMotes: THREE.Points;
  dustMotesMat: THREE.PointsMaterial;
  update: (
    mode: LightingMode,
    dt: number,
    elapsed: number,
    highlightedChairId?: string | null
  ) => void;
  dispose: () => void;
}

interface LightingTargets {
  bgColor: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunPos: THREE.Vector3;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  exposure: number;
  bulbEmissive: number;
  shadeEmissive: number;
  ledEmissive: number;
  coveEmissive: number;
  signEmissive: number;
  laptopEmissive: number;
  readingFill: number;
  receptionFill: number;
  dustOpacity: number;
  poolOpacity: number;
  coneOpacity: number;
}

const MODE_PRESETS: Record<LightingMode, LightingTargets> = {
  day: {
    bgColor: new THREE.Color(0xc8d8e2),
    sunColor: new THREE.Color(0xfff5e4),
    sunIntensity: 2.35,
    sunPos: new THREE.Vector3(11, 16, 8),
    hemiSky: new THREE.Color(0xd5e4ec),
    hemiGround: new THREE.Color(0x9a8b77),
    hemiIntensity: 1.05,
    exposure: 1.12,
    bulbEmissive: 0.25,
    shadeEmissive: 0.08,
    ledEmissive: 0.35,
    coveEmissive: 0.35,
    signEmissive: 0.55,
    laptopEmissive: 0.25,
    readingFill: 0.4,
    receptionFill: 0.35,
    dustOpacity: 0.14,
    poolOpacity: 0.06,
    coneOpacity: 0.02,
  },
  evening: {
    bgColor: new THREE.Color(0x323a46),
    sunColor: new THREE.Color(0xff9852),
    sunIntensity: 1.85,
    sunPos: new THREE.Vector3(-15, 5.8, 9),
    hemiSky: new THREE.Color(0x7c8a9e),
    hemiGround: new THREE.Color(0x524234),
    hemiIntensity: 0.68,
    exposure: 1.06,
    bulbEmissive: 1.95,
    shadeEmissive: 0.62,
    ledEmissive: 1.25,
    coveEmissive: 1.05,
    signEmissive: 1.35,
    laptopEmissive: 0.55,
    readingFill: 0.55,
    receptionFill: 0.55,
    dustOpacity: 0.45,
    poolOpacity: 0.28,
    coneOpacity: 0.16,
  },
  night: {
    bgColor: new THREE.Color(0x0c131d),
    sunColor: new THREE.Color(0x6384b8),
    sunIntensity: 0.55,
    sunPos: new THREE.Vector3(-8, 14, -9),
    hemiSky: new THREE.Color(0x213248),
    hemiGround: new THREE.Color(0x1e1a14),
    hemiIntensity: 0.4,
    exposure: 1.08,
    bulbEmissive: 3.1,
    shadeEmissive: 0.95,
    ledEmissive: 1.75,
    coveEmissive: 0.72,
    signEmissive: 1.9,
    laptopEmissive: 0.85,
    readingFill: 0.75,
    receptionFill: 0.75,
    dustOpacity: 0.22,
    poolOpacity: 0.44,
    coneOpacity: 0.24,
  },
};

export function createLightingRig(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  mats: MaterialLibrary,
  floorplan: FloorplanSceneData,
  isSoftwareGl: boolean
): LightingRig {
  const initial = MODE_PRESETS.day;
  scene.background = initial.bgColor.clone();
  scene.fog = new THREE.FogExp2(initial.bgColor.getHex(), 0.014);

  const hemiLight = new THREE.HemisphereLight(
    initial.hemiSky.clone(),
    initial.hemiGround.clone(),
    initial.hemiIntensity
  );
  hemiLight.position.set(0, 12, 0);
  scene.add(hemiLight);

  // Single primary shadow-casting key light (within <= 3 shadow caster budget)
  const sunLight = new THREE.DirectionalLight(
    initial.sunColor.clone(),
    initial.sunIntensity
  );
  sunLight.position.copy(initial.sunPos);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 42;
  sunLight.shadow.camera.left = -13;
  sunLight.shadow.camera.right = 13;
  sunLight.shadow.camera.top = 11;
  sunLight.shadow.camera.bottom = -11;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.025;
  scene.add(sunLight);

  // Soft interior fill pools (no shadows, keeps night & evening rich without black voids)
  const readingAmbientFill = new THREE.PointLight(0xffcb88, initial.readingFill, 14, 1.5);
  readingAmbientFill.position.set(-4.8, 2.7, 0);
  scene.add(readingAmbientFill);

  const receptionAmbientFill = new THREE.PointLight(0xffcb88, initial.receptionFill, 12, 1.5);
  receptionAmbientFill.position.set(1.8, 2.7, -0.5);
  scene.add(receptionAmbientFill);

  // Subtle floating dust motes visible in Evening golden-hour shafts
  const moteCount = 110;
  const positions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16.5;
    positions[i * 3 + 1] = 0.35 + Math.random() * 2.4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 11.2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMotesMat = new THREE.PointsMaterial({
    color: 0xffd79e,
    size: 0.036,
    transparent: true,
    opacity: initial.dustOpacity,
    depthWrite: false,
  });
  const dustMotes = new THREE.Points(dustGeo, dustMotesMat);
  scene.add(dustMotes);

  const currentBg = initial.bgColor.clone();

  return {
    sunLight,
    hemiLight,
    readingAmbientFill,
    receptionAmbientFill,
    dustMotes,
    dustMotesMat,
    update: (
      mode: LightingMode,
      dt: number,
      elapsed: number,
      highlightedChairId: string | null = null
    ) => {
      const target = MODE_PRESETS[mode];
      const lambda = 3.6;
      const alpha = 1 - Math.exp(-lambda * dt);

      currentBg.lerp(target.bgColor, alpha);
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(currentBg);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(currentBg);
      }
      floorplan.exteriorSkyMat.color.copy(currentBg);

      sunLight.color.lerp(target.sunColor, alpha);
      sunLight.position.lerp(target.sunPos, alpha);
      hemiLight.color.lerp(target.hemiSky, alpha);
      hemiLight.groundColor.lerp(target.hemiGround, alpha);
      hemiLight.intensity = THREE.MathUtils.damp(
        hemiLight.intensity,
        target.hemiIntensity,
        lambda,
        dt
      );
      renderer.toneMappingExposure = THREE.MathUtils.damp(
        renderer.toneMappingExposure,
        target.exposure,
        lambda,
        dt
      );

      // Living Evening animation on lights & golden-hour motes
      const eveningPulse =
        mode === 'evening' ? Math.sin(elapsed * 1.45) * 0.16 + Math.sin(elapsed * 2.7) * 0.06 : 0;
      const nightFlicker = mode === 'night' ? Math.sin(elapsed * 2.1) * 0.04 : 0;

      sunLight.intensity = THREE.MathUtils.damp(
        sunLight.intensity,
        target.sunIntensity + (mode === 'evening' ? Math.sin(elapsed * 0.9) * 0.18 : 0),
        lambda,
        dt
      );

      readingAmbientFill.intensity = THREE.MathUtils.damp(
        readingAmbientFill.intensity,
        target.readingFill + eveningPulse * 0.25,
        lambda,
        dt
      );
      receptionAmbientFill.intensity = THREE.MathUtils.damp(
        receptionAmbientFill.intensity,
        target.receptionFill + eveningPulse * 0.25,
        lambda,
        dt
      );

      mats.lampBulbEmissive.emissiveIntensity = THREE.MathUtils.damp(
        mats.lampBulbEmissive.emissiveIntensity,
        target.bulbEmissive + eveningPulse * 0.55 + nightFlicker,
        lambda,
        dt
      );
      mats.lampShadeLinen.emissiveIntensity = THREE.MathUtils.damp(
        mats.lampShadeLinen.emissiveIntensity,
        target.shadeEmissive + eveningPulse * 0.2,
        lambda,
        dt
      );
      mats.ledStripEmissive.emissiveIntensity = THREE.MathUtils.damp(
        mats.ledStripEmissive.emissiveIntensity,
        target.ledEmissive + eveningPulse * 0.35,
        lambda,
        dt
      );
      mats.ceilingCoveEmissive.emissiveIntensity = THREE.MathUtils.damp(
        mats.ceilingCoveEmissive.emissiveIntensity,
        target.coveEmissive + eveningPulse * 0.3,
        lambda,
        dt
      );
      mats.innovationSign.emissiveIntensity = THREE.MathUtils.damp(
        mats.innovationSign.emissiveIntensity,
        target.signEmissive + eveningPulse * 0.25,
        lambda,
        dt
      );
      mats.laptopScreenEmissive.emissiveIntensity = THREE.MathUtils.damp(
        mats.laptopScreenEmissive.emissiveIntensity,
        target.laptopEmissive,
        lambda,
        dt
      );
      mats.lampLightPoolMat.opacity = THREE.MathUtils.damp(
        mats.lampLightPoolMat.opacity,
        target.poolOpacity + eveningPulse * 0.08 + nightFlicker * 0.04,
        lambda,
        dt
      );
      mats.lampLightConeMat.opacity = THREE.MathUtils.damp(
        mats.lampLightConeMat.opacity,
        target.coneOpacity + eveningPulse * 0.05 + nightFlicker * 0.03,
        lambda,
        dt
      );

      // Update individual lamps across Quiet Study Studio, Reception, and Reading Hall
      for (let i = 0; i < floorplan.lamps.length; i++) {
        const lamp = floorplan.lamps[i];
        let desired = lamp.baseIntensity;
        if (mode === 'evening') {
          const wave = Math.sin(elapsed * 1.6 + lamp.phase) * 0.28;
          desired = lamp.eveningIntensity + wave;
        } else if (mode === 'night') {
          const gentle = Math.sin(elapsed * 1.8 + lamp.phase) * 0.08;
          desired = lamp.nightIntensity + gentle;
        }
        if (highlightedChairId && lamp.linkedChairId === highlightedChairId) {
          desired += 1.25;
        }
        lamp.light.intensity = THREE.MathUtils.damp(
          lamp.light.intensity,
          desired,
          lambda,
          dt
        );
      }

      // Gentle drift for golden-hour dust motes
      dustMotesMat.opacity = THREE.MathUtils.damp(
        dustMotesMat.opacity,
        target.dustOpacity,
        lambda,
        dt
      );
      dustMotes.rotation.y = elapsed * 0.018;
      dustMotes.position.y = Math.sin(elapsed * 0.45) * 0.08;
    },
    dispose: () => {
      dustGeo.dispose();
      dustMotesMat.dispose();
    },
  };
}

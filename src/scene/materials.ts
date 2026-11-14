import * as THREE from 'three';
import type { DoorSignKey, TextureLibrary } from './textures';

export interface MaterialLibrary {
  herringboneFloor: THREE.MeshStandardMaterial;
  slateFloor: THREE.MeshStandardMaterial;
  terraceFloor: THREE.MeshStandardMaterial;
  wallPlaster: THREE.MeshStandardMaterial;
  wallSoftGreen: THREE.MeshStandardMaterial;
  wallMutedBlue: THREE.MeshStandardMaterial;
  wallDarkCap: THREE.MeshStandardMaterial;
  wallExterior: THREE.MeshStandardMaterial;
  ceilingPanel: THREE.MeshStandardMaterial;
  walnutWood: THREE.MeshStandardMaterial;
  oakDoor: THREE.MeshStandardMaterial;
  marbleSlab: THREE.MeshPhysicalMaterial;
  chromeMetal: THREE.MeshPhysicalMaterial;
  darkAnodized: THREE.MeshStandardMaterial;
  brushedBrass: THREE.MeshPhysicalMaterial;
  taupeFabric: THREE.MeshStandardMaterial;
  lightGreyFabric: THREE.MeshStandardMaterial;
  cognacLeather: THREE.MeshStandardMaterial;
  oxbloodLeather: THREE.MeshStandardMaterial;
  blackLeather: THREE.MeshStandardMaterial;
  ceramicWhite: THREE.MeshStandardMaterial;
  soilDark: THREE.MeshStandardMaterial;
  foliageGreen: THREE.MeshStandardMaterial;
  glassWindow: THREE.MeshPhysicalMaterial;
  bookSpines: THREE.MeshStandardMaterial;
  rugMaterial: THREE.MeshStandardMaterial;
  lampBulbEmissive: THREE.MeshStandardMaterial;
  lampShadeLinen: THREE.MeshStandardMaterial;
  ledStripEmissive: THREE.MeshStandardMaterial;
  ceilingCoveEmissive: THREE.MeshStandardMaterial;
  laptopScreenEmissive: THREE.MeshStandardMaterial;
  innovationSign: THREE.MeshStandardMaterial;
  whiteboardMat: THREE.MeshStandardMaterial;
  doorPlaqueMats: Record<DoorSignKey, THREE.MeshStandardMaterial>;
  contactShadowMat: THREE.MeshBasicMaterial;
  lampLightPoolMat: THREE.MeshBasicMaterial;
  lampLightConeMat: THREE.MeshBasicMaterial;
  welcomePlaqueMat: THREE.MeshStandardMaterial;
  skinWarm: THREE.MeshStandardMaterial;
  hairDark: THREE.MeshStandardMaterial;
  blazerNavy: THREE.MeshStandardMaterial;
  blouseCream: THREE.MeshStandardMaterial;
  espressoSteel: THREE.MeshPhysicalMaterial;
  terracottaPot: THREE.MeshStandardMaterial;
  artMaterials: THREE.MeshStandardMaterial[];
  dispose: () => void;
}

export function createMaterialLibrary(
  textures: TextureLibrary,
  isSoftwareGl: boolean
): MaterialLibrary {
  const herringboneFloor = new THREE.MeshStandardMaterial({
    map: textures.herringboneAlbedo,
    bumpMap: textures.herringboneBump,
    bumpScale: 0.015,
    roughnessMap: textures.herringboneRoughness,
    roughness: 0.62,
    metalness: 0.0,
    envMapIntensity: 0.85,
  });

  const slateFloor = new THREE.MeshStandardMaterial({
    map: textures.slateAlbedo,
    bumpMap: textures.slateBump,
    bumpScale: 0.012,
    roughness: 0.58,
    metalness: 0.05,
  });

  const terraceFloor = new THREE.MeshStandardMaterial({
    color: 0xd6d1c8,
    roughness: 0.86,
    metalness: 0.0,
  });

  const wallPlaster = new THREE.MeshStandardMaterial({
    map: textures.plasterAlbedo,
    bumpMap: textures.plasterBump,
    bumpScale: 0.008,
    color: 0xf3ede2,
    roughness: 0.88,
    metalness: 0.0,
  });

  const wallSoftGreen = new THREE.MeshStandardMaterial({
    map: textures.plasterAlbedo,
    bumpMap: textures.plasterBump,
    bumpScale: 0.008,
    color: 0xd0dccd,
    roughness: 0.89,
    metalness: 0.0,
  });

  const wallMutedBlue = new THREE.MeshStandardMaterial({
    map: textures.plasterAlbedo,
    bumpMap: textures.plasterBump,
    bumpScale: 0.008,
    color: 0xc9d5df,
    roughness: 0.89,
    metalness: 0.0,
  });

  const wallDarkCap = new THREE.MeshStandardMaterial({
    color: 0x2a2e33,
    roughness: 0.55,
    metalness: 0.25,
  });

  const wallExterior = new THREE.MeshStandardMaterial({
    color: 0xc9c2b8,
    roughness: 0.82,
    metalness: 0.0,
  });

  const ceilingPanel = new THREE.MeshStandardMaterial({
    color: 0xf2eee7,
    roughness: 0.85,
    metalness: 0.0,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide,
  });

  const walnutWood = new THREE.MeshStandardMaterial({
    map: textures.walnutAlbedo,
    roughnessMap: textures.walnutRoughness,
    roughness: 0.54,
    metalness: 0.0,
    envMapIntensity: 0.8,
  });

  const oakDoor = new THREE.MeshStandardMaterial({
    map: textures.walnutAlbedo,
    color: 0xb98b5b,
    roughness: 0.56,
    metalness: 0.0,
  });

  const marbleSlab = new THREE.MeshPhysicalMaterial({
    map: textures.marbleAlbedo,
    roughnessMap: textures.marbleRoughness,
    roughness: 0.2,
    metalness: 0.0,
    clearcoat: 0.65,
    clearcoatRoughness: 0.14,
    envMapIntensity: 1.0,
  });

  const chromeMetal = new THREE.MeshPhysicalMaterial({
    color: 0xdadfe6,
    metalness: 0.94,
    roughness: 0.16,
    anisotropy: 0.6,
    envMapIntensity: 1.2,
  });

  const darkAnodized = new THREE.MeshStandardMaterial({
    color: 0x212428,
    metalness: 0.72,
    roughness: 0.36,
  });

  const brushedBrass = new THREE.MeshPhysicalMaterial({
    color: 0xd5a858,
    metalness: 0.92,
    roughness: 0.22,
    anisotropy: 0.8,
    envMapIntensity: 1.25,
  });

  const taupeFabric = new THREE.MeshStandardMaterial({
    map: textures.fabricAlbedo,
    bumpMap: textures.fabricBump,
    bumpScale: 0.012,
    color: 0x9b948b,
    roughness: 0.92,
    metalness: 0.0,
  });

  const lightGreyFabric = new THREE.MeshStandardMaterial({
    map: textures.fabricAlbedo,
    bumpMap: textures.fabricBump,
    bumpScale: 0.014,
    color: 0xc2bcb3,
    roughness: 0.9,
    metalness: 0.0,
  });

  const cognacLeather = new THREE.MeshStandardMaterial({
    color: 0x8a512b,
    roughness: 0.44,
    metalness: 0.04,
    envMapIntensity: 0.7,
  });

  const oxbloodLeather = new THREE.MeshStandardMaterial({
    color: 0x5c2326,
    roughness: 0.46,
    metalness: 0.04,
    envMapIntensity: 0.7,
  });

  const blackLeather = new THREE.MeshStandardMaterial({
    color: 0x1e1f22,
    roughness: 0.42,
    metalness: 0.06,
  });

  const ceramicWhite = new THREE.MeshStandardMaterial({
    color: 0xebe8e1,
    roughness: 0.32,
    metalness: 0.02,
  });

  const soilDark = new THREE.MeshStandardMaterial({
    color: 0x2d2118,
    roughness: 0.96,
    metalness: 0.0,
  });

  const foliageGreen = new THREE.MeshStandardMaterial({
    color: 0x3f6b36,
    roughness: 0.58,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const glassWindow = new THREE.MeshPhysicalMaterial({
    color: 0xdff0f8,
    metalness: 0.0,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.86,
    transparent: true,
    opacity: isSoftwareGl ? 0.3 : 1.0,
    ior: 1.5,
    thickness: 0.06,
    depthWrite: false,
  });

  const bookSpines = new THREE.MeshStandardMaterial({
    map: textures.bookSpines,
    roughness: 0.78,
    metalness: 0.02,
  });

  const rugMaterial = new THREE.MeshStandardMaterial({
    map: textures.rugAlbedo,
    roughness: 0.95,
    metalness: 0.0,
  });

  const lampBulbEmissive = new THREE.MeshStandardMaterial({
    color: 0xfff5dc,
    emissive: new THREE.Color(0xffbe6b),
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.0,
  });

  const lampShadeLinen = new THREE.MeshStandardMaterial({
    color: 0xf4ecdd,
    emissive: new THREE.Color(0xffb55a),
    emissiveIntensity: 0.12,
    roughness: 0.78,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const ledStripEmissive = new THREE.MeshStandardMaterial({
    color: 0xfff1d6,
    emissive: new THREE.Color(0xffc36e),
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.0,
  });

  const ceilingCoveEmissive = new THREE.MeshStandardMaterial({
    color: 0xfff8eb,
    emissive: new THREE.Color(0xffcf87),
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.0,
  });

  const laptopScreenEmissive = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: new THREE.Color(0x93c5fd),
    emissiveIntensity: 0.25,
    roughness: 0.2,
    metalness: 0.1,
  });

  const innovationSign = new THREE.MeshStandardMaterial({
    map: textures.innovationSignAlbedo,
    emissiveMap: textures.innovationSignEmissive,
    emissive: new THREE.Color(0xffc069),
    emissiveIntensity: 0.75,
    roughness: 0.45,
    metalness: 0.05,
  });

  const whiteboardMat = new THREE.MeshStandardMaterial({
    map: textures.whiteboardAlbedo,
    roughness: 0.25,
    metalness: 0.05,
  });

  const doorPlaqueMats = (Object.keys(textures.doorPlaques) as DoorSignKey[]).reduce(
    (acc, key) => {
      acc[key] = new THREE.MeshStandardMaterial({
        map: textures.doorPlaques[key],
        roughness: 0.36,
        metalness: 0.22,
      });
      return acc;
    },
    {} as Record<DoorSignKey, THREE.MeshStandardMaterial>
  );

  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.45,
  });

  const lampLightPoolMat = new THREE.MeshBasicMaterial({
    map: textures.lampLightPool,
    color: 0xffd28c,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const lampLightConeMat = new THREE.MeshBasicMaterial({
    map: textures.lampLightCone,
    color: 0xffd088,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const welcomePlaqueMat = new THREE.MeshStandardMaterial({
    map: textures.welcomePlaque,
    roughness: 0.35,
    metalness: 0.25,
  });

  const skinWarm = new THREE.MeshStandardMaterial({
    color: 0xd9a788,
    roughness: 0.62,
    metalness: 0.0,
  });

  const hairDark = new THREE.MeshStandardMaterial({
    color: 0x241a15,
    roughness: 0.68,
    metalness: 0.04,
  });

  const blazerNavy = new THREE.MeshStandardMaterial({
    color: 0x1e2b3b,
    roughness: 0.78,
    metalness: 0.02,
  });

  const blouseCream = new THREE.MeshStandardMaterial({
    color: 0xf4eee4,
    roughness: 0.72,
    metalness: 0.0,
  });

  const espressoSteel = new THREE.MeshPhysicalMaterial({
    color: 0x2f3338,
    metalness: 0.84,
    roughness: 0.24,
    clearcoat: 0.4,
  });

  const terracottaPot = new THREE.MeshStandardMaterial({
    color: 0xb96c49,
    roughness: 0.78,
    metalness: 0.02,
  });

  const artMaterials = textures.artTextures.map(
    (tex) =>
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.72,
        metalness: 0.0,
      })
  );

  const allMaterials: THREE.Material[] = [
    herringboneFloor,
    slateFloor,
    terraceFloor,
    wallPlaster,
    wallSoftGreen,
    wallMutedBlue,
    wallDarkCap,
    wallExterior,
    ceilingPanel,
    walnutWood,
    oakDoor,
    marbleSlab,
    chromeMetal,
    darkAnodized,
    brushedBrass,
    taupeFabric,
    lightGreyFabric,
    cognacLeather,
    oxbloodLeather,
    blackLeather,
    ceramicWhite,
    soilDark,
    foliageGreen,
    glassWindow,
    bookSpines,
    rugMaterial,
    lampBulbEmissive,
    lampShadeLinen,
    ledStripEmissive,
    ceilingCoveEmissive,
    laptopScreenEmissive,
    innovationSign,
    whiteboardMat,
    ...Object.values(doorPlaqueMats),
    contactShadowMat,
    lampLightPoolMat,
    lampLightConeMat,
    welcomePlaqueMat,
    skinWarm,
    hairDark,
    blazerNavy,
    blouseCream,
    espressoSteel,
    terracottaPot,
    ...artMaterials,
  ];

  return {
    herringboneFloor,
    slateFloor,
    terraceFloor,
    wallPlaster,
    wallSoftGreen,
    wallMutedBlue,
    wallDarkCap,
    wallExterior,
    ceilingPanel,
    walnutWood,
    oakDoor,
    marbleSlab,
    chromeMetal,
    darkAnodized,
    brushedBrass,
    taupeFabric,
    lightGreyFabric,
    cognacLeather,
    oxbloodLeather,
    blackLeather,
    ceramicWhite,
    soilDark,
    foliageGreen,
    glassWindow,
    bookSpines,
    rugMaterial,
    lampBulbEmissive,
    lampShadeLinen,
    ledStripEmissive,
    ceilingCoveEmissive,
    laptopScreenEmissive,
    innovationSign,
    whiteboardMat,
    doorPlaqueMats,
    contactShadowMat,
    lampLightPoolMat,
    lampLightConeMat,
    welcomePlaqueMat,
    skinWarm,
    hairDark,
    blazerNavy,
    blouseCream,
    espressoSteel,
    terracottaPot,
    artMaterials,
    dispose: () => {
      allMaterials.forEach((m) => m.dispose());
    },
  };
}

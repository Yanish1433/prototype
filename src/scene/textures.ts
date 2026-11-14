import * as THREE from 'three';

export type DoorSignKey =
  | 'reading-hall'
  | 'reception'
  | 'quiet-studio'
  | 'innovation-hub'
  | 'pantry'
  | 'bathroom';

export interface TextureLibrary {
  herringboneAlbedo: THREE.CanvasTexture;
  herringboneBump: THREE.CanvasTexture;
  herringboneRoughness: THREE.CanvasTexture;
  marbleAlbedo: THREE.CanvasTexture;
  marbleRoughness: THREE.CanvasTexture;
  slateAlbedo: THREE.CanvasTexture;
  slateBump: THREE.CanvasTexture;
  walnutAlbedo: THREE.CanvasTexture;
  walnutRoughness: THREE.CanvasTexture;
  fabricAlbedo: THREE.CanvasTexture;
  fabricBump: THREE.CanvasTexture;
  plasterAlbedo: THREE.CanvasTexture;
  plasterBump: THREE.CanvasTexture;
  bookSpines: THREE.CanvasTexture;
  rugAlbedo: THREE.CanvasTexture;
  innovationSignAlbedo: THREE.CanvasTexture;
  innovationSignEmissive: THREE.CanvasTexture;
  whiteboardAlbedo: THREE.CanvasTexture;
  doorPlaques: Record<DoorSignKey, THREE.CanvasTexture>;
  artTextures: THREE.CanvasTexture[];
  contactShadow: THREE.CanvasTexture;
  lampLightPool: THREE.CanvasTexture;
  lampLightCone: THREE.CanvasTexture;
  welcomePlaque: THREE.CanvasTexture;
  dispose: () => void;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function configureTexture(
  tex: THREE.CanvasTexture,
  isColor: boolean,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function createHerringboneTextures(maxAnisotropy: number) {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  aCtx.fillStyle = '#7a5230';
  aCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#888888';
  rCtx.fillRect(0, 0, size, size);

  const rand = seededRandom(4102);
  const cols = 8;
  const step = size / cols;
  const plankLen = step * 1.4142;
  const plankW = plankLen / 3;

  const drawPlank = (cx: number, cy: number, angle: number) => {
    const toneShift = (rand() - 0.5) * 26;
    const baseR = Math.min(255, Math.max(0, 146 + toneShift));
    const baseG = Math.min(255, Math.max(0, 100 + toneShift * 0.72));
    const baseB = Math.min(255, Math.max(0, 58 + toneShift * 0.45));

    aCtx.save();
    aCtx.translate(cx, cy);
    aCtx.rotate(angle);

    aCtx.fillStyle = `rgb(${baseR | 0}, ${baseG | 0}, ${baseB | 0})`;
    aCtx.fillRect(-plankLen / 2, -plankW / 2, plankLen, plankW);

    for (let g = 0; g < 18; g++) {
      const gy = -plankW / 2 + rand() * plankW;
      const alpha = 0.05 + rand() * 0.1;
      aCtx.strokeStyle =
        rand() > 0.45
          ? `rgba(72, 42, 18, ${alpha})`
          : `rgba(188, 138, 88, ${alpha * 0.8})`;
      aCtx.lineWidth = 1 + rand() * 1.6;
      aCtx.beginPath();
      aCtx.moveTo(-plankLen / 2, gy);
      aCtx.bezierCurveTo(
        -plankLen / 6,
        gy + (rand() - 0.5) * 4,
        plankLen / 6,
        gy + (rand() - 0.5) * 4,
        plankLen / 2,
        gy
      );
      aCtx.stroke();
    }

    aCtx.strokeStyle = 'rgba(42, 24, 10, 0.55)';
    aCtx.lineWidth = 2;
    aCtx.strokeRect(-plankLen / 2 + 1, -plankW / 2 + 1, plankLen - 2, plankW - 2);
    aCtx.restore();

    bCtx.save();
    bCtx.translate(cx, cy);
    bCtx.rotate(angle);
    const bVal = 148 + ((rand() - 0.5) * 20) | 0;
    bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
    bCtx.fillRect(-plankLen / 2, -plankW / 2, plankLen, plankW);
    bCtx.strokeStyle = '#222222';
    bCtx.lineWidth = 2.2;
    bCtx.strokeRect(-plankLen / 2 + 1, -plankW / 2 + 1, plankLen - 2, plankW - 2);
    bCtx.restore();

    rCtx.save();
    rCtx.translate(cx, cy);
    rCtx.rotate(angle);
    const rVal = (98 + rand() * 44) | 0;
    rCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
    rCtx.fillRect(-plankLen / 2, -plankW / 2, plankLen, plankW);
    rCtx.restore();
  };

  for (let row = -2; row <= cols + 2; row++) {
    for (let col = -2; col <= cols + 2; col++) {
      const x = col * step;
      const y = row * step;
      const dir = (row + col) % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
      drawPlank(x + step * 0.5, y + step * 0.5, dir);
    }
  }

  return {
    albedo: configureTexture(new THREE.CanvasTexture(albedoCanvas), true, maxAnisotropy, 5, 4),
    bump: configureTexture(new THREE.CanvasTexture(bumpCanvas), false, maxAnisotropy, 5, 4),
    roughness: configureTexture(new THREE.CanvasTexture(roughCanvas), false, maxAnisotropy, 5, 4),
  };
}

function createMarbleTextures(maxAnisotropy: number) {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  ctx.fillStyle = '#f2efe9';
  ctx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#383838';
  rCtx.fillRect(0, 0, size, size);

  const rand = seededRandom(8812);

  // Soft cloudy marble patches
  for (let i = 0; i < 40; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const radius = 80 + rand() * 220;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(218, 214, 206, 0.25)');
    grad.addColorStop(1, 'rgba(242, 239, 233, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Calacatta mineral veins
  for (let v = 0; v < 22; v++) {
    let x = rand() * size;
    let y = rand() * size;
    const angle = (rand() - 0.5) * 1.4;
    const isGold = rand() > 0.72;
    ctx.strokeStyle = isGold
      ? `rgba(176, 152, 114, ${0.18 + rand() * 0.22})`
      : `rgba(112, 115, 120, ${0.15 + rand() * 0.28})`;
    ctx.lineWidth = 0.8 + rand() * 3.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 14; s++) {
      x += Math.cos(angle + (rand() - 0.5) * 0.9) * (size / 16);
      y += Math.sin(angle + (rand() - 0.5) * 0.9) * (size / 16);
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    rCtx.strokeStyle = 'rgba(110, 110, 110, 0.35)';
    rCtx.lineWidth = ctx.lineWidth;
    rCtx.beginPath();
    rCtx.moveTo(x, y);
    rCtx.stroke();
  }

  return {
    albedo: configureTexture(new THREE.CanvasTexture(albedoCanvas), true, maxAnisotropy, 1, 1),
    roughness: configureTexture(new THREE.CanvasTexture(roughCanvas), false, maxAnisotropy, 1, 1),
  };
}

function createSlateTextures(maxAnisotropy: number) {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#33363b';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#909090';
  bCtx.fillRect(0, 0, size, size);

  const rand = seededRandom(5509);
  const grid = 4;
  const cell = size / grid;

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const shade = 48 + ((rand() - 0.5) * 14) | 0;
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      ctx.fillRect(c * cell + 3, r * cell + 3, cell - 6, cell - 6);

      const bShade = 140 + ((rand() - 0.5) * 20) | 0;
      bCtx.fillStyle = `rgb(${bShade}, ${bShade}, ${bShade})`;
      bCtx.fillRect(c * cell + 3, r * cell + 3, cell - 6, cell - 6);
    }
  }

  for (let i = 0; i < 1200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(x, y, 2, 2);
  }

  return {
    albedo: configureTexture(new THREE.CanvasTexture(albedoCanvas), true, maxAnisotropy, 2, 2),
    bump: configureTexture(new THREE.CanvasTexture(bumpCanvas), false, maxAnisotropy, 2, 2),
  };
}

function createWalnutTextures(maxAnisotropy: number) {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  ctx.fillStyle = '#5c3c24';
  ctx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#7c7c7c';
  rCtx.fillRect(0, 0, size, size);

  const rand = seededRandom(7123);
  for (let i = 0; i < 140; i++) {
    const y = rand() * size;
    const dark = rand() > 0.4;
    ctx.strokeStyle = dark
      ? `rgba(42, 24, 12, ${0.08 + rand() * 0.14})`
      : `rgba(128, 86, 52, ${0.06 + rand() * 0.1})`;
    ctx.lineWidth = 1 + rand() * 3.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      size * 0.33,
      y + (rand() - 0.5) * 14,
      size * 0.66,
      y + (rand() - 0.5) * 14,
      size,
      y + (rand() - 0.5) * 8
    );
    ctx.stroke();

    rCtx.strokeStyle = dark ? 'rgba(135,135,135,0.2)' : 'rgba(95,95,95,0.2)';
    rCtx.lineWidth = ctx.lineWidth;
    rCtx.beginPath();
    rCtx.moveTo(0, y);
    rCtx.lineTo(size, y);
    rCtx.stroke();
  }

  return {
    albedo: configureTexture(new THREE.CanvasTexture(albedoCanvas), true, maxAnisotropy, 1, 1),
    roughness: configureTexture(new THREE.CanvasTexture(roughCanvas), false, maxAnisotropy, 1, 1),
  };
}

function createFabricTextures(maxAnisotropy: number) {
  const size = 256;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#b4ada2';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(40,36,32,0.08)';
    ctx.fillRect(0, y, size, 2);
    bCtx.fillStyle = y % 8 === 0 ? '#a8a8a8' : '#5c5c5c';
    bCtx.fillRect(0, y, size, 2);
  }
  for (let x = 0; x < size; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(40,36,32,0.07)';
    ctx.fillRect(x, 0, 2, size);
    bCtx.fillStyle = x % 8 === 0 ? '#a0a0a0' : '#646464';
    bCtx.fillRect(x, 0, 2, size);
  }

  return {
    albedo: configureTexture(new THREE.CanvasTexture(albedoCanvas), true, maxAnisotropy, 4, 4),
    bump: configureTexture(new THREE.CanvasTexture(bumpCanvas), false, maxAnisotropy, 4, 4),
  };
}

function createPlasterTextures(maxAnisotropy: number) {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#f2ede4';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const rand = seededRandom(3344);

  // Soft architectural limewash clouds for natural depth on tinted walls
  for (let c = 0; c < 36; c++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const radius = 55 + rand() * 110;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, c % 2 === 0 ? 'rgba(255, 253, 249, 0.14)' : 'rgba(218, 212, 202, 0.12)');
    grad.addColorStop(1, 'rgba(242, 237, 228, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  for (let i = 0; i < 3500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 3;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,252,245,0.06)' : 'rgba(180,170,158,0.06)';
    ctx.fillRect(x, y, r, r);
    const bv = (116 + rand() * 24) | 0;
    bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bCtx.fillRect(x, y, r, r);
  }

  return {
    albedo: configureTexture(new THREE.CanvasTexture(albedoCanvas), true, maxAnisotropy, 2, 2),
    bump: configureTexture(new THREE.CanvasTexture(bumpCanvas), false, maxAnisotropy, 2, 2),
  };
}

function createBookSpinesTexture(maxAnisotropy: number) {
  const w = 1024;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1f1610';
  ctx.fillRect(0, 0, w, h);

  const palette = [
    '#2c3e50',
    '#8b3a2b',
    '#d9cbb8',
    '#3c5a46',
    '#1f2937',
    '#a37b4b',
    '#6d4c41',
    '#4a5568',
    '#e8dfd1',
    '#7c2d12',
    '#334155',
    '#b48a5a',
  ];

  const rand = seededRandom(9921);
  let x = 6;
  while (x < w - 12) {
    if (rand() < 0.08) {
      x += 18 + rand() * 24;
      continue;
    }
    const bw = 14 + rand() * 22;
    const bh = h * (0.68 + rand() * 0.27);
    const by = h - bh;
    const color = palette[(rand() * palette.length) | 0];

    ctx.fillStyle = color;
    ctx.fillRect(x, by, bw - 2, bh);

    // Subtle spine lighting gradient
    const grad = ctx.createLinearGradient(x, by, x + bw, by);
    grad.addColorStop(0, 'rgba(255,255,255,0.16)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, by, bw - 2, bh);

    // Gold or cream foil bands
    if (rand() > 0.35) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(218, 184, 114, 0.72)' : 'rgba(245, 240, 232, 0.55)';
      ctx.fillRect(x + 2, by + 18, bw - 6, 4);
      ctx.fillRect(x + 2, by + 28, bw - 6, 2);
      ctx.fillRect(x + 2, h - 24, bw - 6, 3);
    }

    x += bw;
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAnisotropy, 1, 1);
}

function createRugTexture(maxAnisotropy: number) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c4b8a6';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#9a8c78';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, size - 40, size - 40);

  ctx.strokeStyle = '#7e705e';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, size - 72, size - 72);

  const rand = seededRandom(2048);
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(65,55,45,0.07)';
    ctx.fillRect(rand() * size, rand() * size, 3, 2);
  }

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAnisotropy, 1, 1);
}

function createInnovationSignTextures(maxAnisotropy: number) {
  const w = 1024;
  const h = 256;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const ctx = albedoCanvas.getContext('2d')!;

  ctx.fillStyle = '#4e331f';
  ctx.fillRect(0, 0, w, h);

  // Subtle horizontal wood slats
  for (let y = 0; y < h; y += 16) {
    ctx.fillStyle = y % 32 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(255,220,180,0.04)';
    ctx.fillRect(0, y, w, 2);
  }

  ctx.font = '600 72px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff3d6';
  ctx.fillText('INNOVATION HUB', w / 2, h / 2);

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = w;
  emissiveCanvas.height = h;
  const eCtx = emissiveCanvas.getContext('2d')!;
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, w, h);
  eCtx.shadowColor = '#ffb74d';
  eCtx.shadowBlur = 22;
  eCtx.font = '600 72px Outfit, sans-serif';
  eCtx.textAlign = 'center';
  eCtx.textBaseline = 'middle';
  eCtx.fillStyle = '#ffe2a8';
  eCtx.fillText('INNOVATION HUB', w / 2, h / 2);

  return {
    albedo: configureTexture(new THREE.CanvasTexture(albedoCanvas), true, maxAnisotropy, 1, 1),
    emissive: configureTexture(new THREE.CanvasTexture(emissiveCanvas), true, maxAnisotropy, 1, 1),
  };
}

function createWhiteboardTexture(maxAnisotropy: number) {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f6f6f4';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#d4d4d0';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  ctx.font = 'italic 500 58px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#27272a';
  ctx.fillText('Think  ·  Build  ·  Innovate', w / 2, h / 2 - 12);

  ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.25, h / 2 + 44);
  ctx.lineTo(w * 0.75, h / 2 + 44);
  ctx.stroke();

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAnisotropy, 1, 1);
}

function createDoorPlaqueTexture(
  title: string,
  subtitle: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 640;
  const h = 176;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#221b17';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#d5a858';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  ctx.strokeStyle = 'rgba(213, 168, 88, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  ctx.font = '600 40px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#faecd0';
  ctx.fillText(title, w / 2, h / 2 - 20);

  ctx.font = '500 22px Plus Jakarta Sans, sans-serif';
  ctx.fillStyle = '#d5b278';
  ctx.fillText(subtitle, w / 2, h / 2 + 26);

  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAnisotropy, 1, 1);
}

function createArtTextures(maxAnisotropy: number): THREE.CanvasTexture[] {
  const specs = [
    { bg: '#ece7df', accent1: '#9a6b48', accent2: '#2d3748', type: 'arch' },
    { bg: '#e6e2d8', accent1: '#4d6a54', accent2: '#c59b6d', type: 'botanical' },
    { bg: '#f0ece4', accent1: '#3b4252', accent2: '#b87a52', type: 'circle' },
  ];

  return specs.map((spec) => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = spec.bg;
    ctx.fillRect(0, 0, size, size);

    if (spec.type === 'arch') {
      ctx.fillStyle = spec.accent1;
      ctx.beginPath();
      ctx.arc(size / 2, size * 0.48, 56, Math.PI, 0);
      ctx.lineTo(size / 2 + 56, size * 0.82);
      ctx.lineTo(size / 2 - 56, size * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = spec.accent2;
      ctx.fillRect(size * 0.36, size * 0.62, size * 0.28, 6);
    } else if (spec.type === 'botanical') {
      ctx.strokeStyle = spec.accent1;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(size * 0.5, size * 0.85);
      ctx.quadraticCurveTo(size * 0.45, size * 0.5, size * 0.55, size * 0.2);
      ctx.stroke();
      ctx.fillStyle = spec.accent1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(
          size * (i % 2 === 0 ? 0.38 : 0.62),
          size * (0.72 - i * 0.11),
          22,
          9,
          i % 2 === 0 ? -0.5 : 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    } else {
      ctx.fillStyle = spec.accent2;
      ctx.beginPath();
      ctx.arc(size * 0.46, size * 0.46, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = spec.accent1;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(size * 0.58, size * 0.56, 44, 0, Math.PI * 2);
      ctx.stroke();
    }

    return configureTexture(new THREE.CanvasTexture(canvas), true, maxAnisotropy, 1, 1);
  });
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(18, 12, 8, 0.52)');
  grad.addColorStop(0.55, 'rgba(18, 12, 8, 0.22)');
  grad.addColorStop(1, 'rgba(18, 12, 8, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createLampLightPoolTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size * 0.49
  );
  grad.addColorStop(0, 'rgba(255, 224, 162, 0.95)');
  grad.addColorStop(0.28, 'rgba(255, 198, 118, 0.55)');
  grad.addColorStop(0.65, 'rgba(255, 175, 88, 0.16)');
  grad.addColorStop(1, 'rgba(255, 165, 75, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createLampLightConeTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255, 226, 168, 0.72)');
  grad.addColorStop(0.35, 'rgba(255, 200, 120, 0.34)');
  grad.addColorStop(0.8, 'rgba(255, 180, 95, 0.08)');
  grad.addColorStop(1, 'rgba(255, 170, 80, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createWelcomePlaqueTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#241e1a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d5a858';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.font = '600 34px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f8e6c2';
  ctx.fillText('CONCIERGE & SEATS', w / 2, h / 2 - 18);
  ctx.font = '500 22px Plus Jakarta Sans, sans-serif';
  ctx.fillStyle = '#d4b483';
  ctx.fillText('Ask Maya for Guided Help', w / 2, h / 2 + 24);
  return configureTexture(new THREE.CanvasTexture(canvas), true, maxAnisotropy, 1, 1);
}

export function createTextureLibrary(maxAnisotropy: number): TextureLibrary {
  const herringbone = createHerringboneTextures(maxAnisotropy);
  const marble = createMarbleTextures(maxAnisotropy);
  const slate = createSlateTextures(maxAnisotropy);
  const walnut = createWalnutTextures(maxAnisotropy);
  const fabric = createFabricTextures(maxAnisotropy);
  const plaster = createPlasterTextures(maxAnisotropy);
  const bookSpines = createBookSpinesTexture(maxAnisotropy);
  const rugAlbedo = createRugTexture(maxAnisotropy);
  const innovationSign = createInnovationSignTextures(maxAnisotropy);
  const whiteboardAlbedo = createWhiteboardTexture(maxAnisotropy);
  const doorPlaques: Record<DoorSignKey, THREE.CanvasTexture> = {
    'reading-hall': createDoorPlaqueTexture(
      'READING HALL',
      'Study Tables & Lounges',
      maxAnisotropy
    ),
    reception: createDoorPlaqueTexture(
      'RECEPTION & LOBBY',
      'Check-in · Concierge Maya',
      maxAnisotropy
    ),
    'quiet-studio': createDoorPlaqueTexture(
      'QUIET STUDY STUDIO',
      'Silent Focus Desks Q1–Q6',
      maxAnisotropy
    ),
    'innovation-hub': createDoorPlaqueTexture(
      'INNOVATION HUB',
      '12-Seat Conference Suite',
      maxAnisotropy
    ),
    pantry: createDoorPlaqueTexture(
      'PANTRY / BREAK ROOM',
      'Espresso · Kitchen · Dining',
      maxAnisotropy
    ),
    bathroom: createDoorPlaqueTexture(
      'BATHROOM / W.C.',
      'Restroom & Shower',
      maxAnisotropy
    ),
  };
  const artTextures = createArtTextures(maxAnisotropy);
  const contactShadow = createContactShadowTexture();
  const lampLightPool = createLampLightPoolTexture();
  const lampLightCone = createLampLightConeTexture();
  const welcomePlaque = createWelcomePlaqueTexture(maxAnisotropy);

  const allTextures: THREE.Texture[] = [
    herringbone.albedo,
    herringbone.bump,
    herringbone.roughness,
    marble.albedo,
    marble.roughness,
    slate.albedo,
    slate.bump,
    walnut.albedo,
    walnut.roughness,
    fabric.albedo,
    fabric.bump,
    plaster.albedo,
    plaster.bump,
    bookSpines,
    rugAlbedo,
    innovationSign.albedo,
    innovationSign.emissive,
    whiteboardAlbedo,
    ...Object.values(doorPlaques),
    contactShadow,
    lampLightPool,
    lampLightCone,
    welcomePlaque,
    ...artTextures,
  ];

  return {
    herringboneAlbedo: herringbone.albedo,
    herringboneBump: herringbone.bump,
    herringboneRoughness: herringbone.roughness,
    marbleAlbedo: marble.albedo,
    marbleRoughness: marble.roughness,
    slateAlbedo: slate.albedo,
    slateBump: slate.bump,
    walnutAlbedo: walnut.albedo,
    walnutRoughness: walnut.roughness,
    fabricAlbedo: fabric.albedo,
    fabricBump: fabric.bump,
    plasterAlbedo: plaster.albedo,
    plasterBump: plaster.bump,
    bookSpines,
    rugAlbedo,
    innovationSignAlbedo: innovationSign.albedo,
    innovationSignEmissive: innovationSign.emissive,
    whiteboardAlbedo,
    doorPlaques,
    artTextures,
    contactShadow,
    lampLightPool,
    lampLightCone,
    welcomePlaque,
    dispose: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}

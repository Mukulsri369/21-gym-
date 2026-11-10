import * as THREE from 'three';

export type FinishPresetId = 'obsidian-brass' | 'titanium-cobalt' | 'carbon-platinum';

export interface FinishTheme {
  id: FinishPresetId;
  name: string;
  rackColor: number;
  rackRoughness: number;
  rackMetalness: number;
  accentColor: number;
  accentRoughness: number;
  accentMetalness: number;
  barShaftColor: number;
  plateRingHex: string;
  plateBodyHex: string;
}

export const FINISH_THEMES: Record<FinishPresetId, FinishTheme> = {
  'obsidian-brass': {
    id: 'obsidian-brass',
    name: 'Obsidian & Brass',
    rackColor: 0x131316,
    rackRoughness: 0.4,
    rackMetalness: 0.65,
    accentColor: 0xd4af37,
    accentRoughness: 0.16,
    accentMetalness: 0.94,
    barShaftColor: 0xd8dce3,
    plateRingHex: '#D4AF37',
    plateBodyHex: '#111114',
  },
  'titanium-cobalt': {
    id: 'titanium-cobalt',
    name: 'Brushed Titanium',
    rackColor: 0x4b525d,
    rackRoughness: 0.28,
    rackMetalness: 0.88,
    accentColor: 0x60a5fa,
    accentRoughness: 0.18,
    accentMetalness: 0.92,
    barShaftColor: 0xe2e8f0,
    plateRingHex: '#60A5FA',
    plateBodyHex: '#151922',
  },
  'carbon-platinum': {
    id: 'carbon-platinum',
    name: 'Monochrome Platinum',
    rackColor: 0x0d0d10,
    rackRoughness: 0.48,
    rackMetalness: 0.45,
    accentColor: 0xe5e7eb,
    accentRoughness: 0.12,
    accentMetalness: 0.96,
    barShaftColor: 0xf3f4f6,
    plateRingHex: '#E5E7EB',
    plateBodyHex: '#101013',
  },
};

export function createBrandHeaderTexture(
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0e0e11';
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 1000, 232);

  ctx.fillStyle = '#F4F4F6';
  ctx.font = '600 92px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('21 FITNESS', 512, 132);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createPlateFaceTexture(
  weightKg: number,
  ringColorHex: string,
  bodyColorHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const cx = 512;
  const cy = 512;

  ctx.fillStyle = bodyColorHex;
  ctx.fillRect(0, 0, 1024, 1024);

  const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 500);
  grad.addColorStop(0, 'rgba(255,255,255,0.05)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0.03)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Minimalist perimeter calibration ring
  ctx.strokeStyle = ringColorHex;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, 430, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle inner hairline ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 310, 0, Math.PI * 2);
  ctx.stroke();

  // Brand name on plate
  ctx.fillStyle = '#F4F4F6';
  ctx.font = '600 54px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('21 FITNESS', cx, cy - 205);

  ctx.fillStyle = ringColorHex;
  ctx.font = '600 96px "Outfit", sans-serif';
  ctx.fillText(`${weightKg} KG`, cx, cy + 210);

  // Center hub ring
  ctx.strokeStyle = ringColorHex;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createPlatformDeckTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0d0d10';
  ctx.fillRect(0, 0, 1024, 1024);

  // Center smoked oak strip
  const woodGrad = ctx.createLinearGradient(256, 0, 768, 0);
  woodGrad.addColorStop(0, '#161412');
  woodGrad.addColorStop(0.5, '#1f1b17');
  woodGrad.addColorStop(1, '#161412');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(256, 40, 512, 944);

  // Subtle brass frame
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 952, 952);

  ctx.beginPath();
  ctx.moveTo(256, 36);
  ctx.lineTo(256, 988);
  ctx.moveTo(768, 36);
  ctx.lineTo(768, 988);
  ctx.stroke();

  // Minimalist "21 FITNESS" emblem on the lifting deck
  ctx.fillStyle = '#F4F4F6';
  ctx.font = '600 84px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('21', 512, 485);

  ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
  ctx.font = '500 28px "Outfit", sans-serif';
  ctx.fillText('F I T N E S S', 512, 555);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createKnurlBumpTexture(maxAnisotropy: number): THREE.DataTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const diamond = (x + y) % 4 === 0 || (x - y + size) % 4 === 0 ? 60 : 210;
      data[idx] = diamond;
      data[idx + 1] = diamond;
      data[idx + 2] = diamond;
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 4);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

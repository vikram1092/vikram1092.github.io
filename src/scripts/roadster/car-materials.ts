import * as T from 'three';
import {RUNNING_LAMP_INTENSITY} from './presentation';

export const finishes = [
  { name: 'Iridescent violet', color: '#7940b2', iridescence: .65, metalness: .62, roughness: .25 },
  { name: 'Arctic pearl', color: '#d5dce2', iridescence: .05, metalness: .24, roughness: .27 },
  { name: 'Liquid silver', color: '#a0a7b0', iridescence: .04, metalness: .9, roughness: .24 },
  { name: 'Crimson', color: '#92182d', iridescence: .12, metalness: .55, roughness: .26 },
  { name: 'Ion blue', color: '#17658c', iridescence: .45, metalness: .68, roughness: .25 },
  { name: 'Obsidian', color: '#171c24', iridescence: .12, metalness: .65, roughness: .26 },
];

function canvasTexture(size: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  paint(canvas.getContext('2d')!);
  const texture = new T.CanvasTexture(canvas); texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.anisotropy = 8;
  return texture;
}
export function createMaterials() {
  const carbonMap = canvasTexture(256, ctx => {
    ctx.fillStyle = '#15191e'; ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 8) for (let x = 0; x < 256; x += 8) {
      const horizontal = (x / 8 + y / 8) % 4 < 2;
      const grad = ctx.createLinearGradient(x, y, horizontal ? x : x + 8, horizontal ? y + 8 : y);
      grad.addColorStop(0, '#0c1015'); grad.addColorStop(.5, '#272e36'); grad.addColorStop(1, '#10151b');
      ctx.fillStyle = grad; ctx.fillRect(x, y, 8, 8);
      ctx.strokeStyle = '#ffffff08'; ctx.lineWidth = .5;
      for (let k = 1; k < 8; k += 2) { ctx.beginPath(); ctx.moveTo(x + (horizontal ? 0 : k), y + (horizontal ? k : 0)); ctx.lineTo(x + (horizontal ? 8 : k), y + (horizontal ? k : 8)); ctx.stroke(); }
    }
  });
  carbonMap.colorSpace = T.SRGBColorSpace; carbonMap.repeat.set(5, 3);
  const flake = canvasTexture(128, ctx => {
    const image = ctx.createImageData(128, 128); let seed = 137;
    for (let i = 0; i < image.data.length; i += 4) { seed = (seed * 1664525 + 1013904223) >>> 0; const v = 116 + seed % 26; image.data.set([v, v, v, 255], i); }
    ctx.putImageData(image, 0, 0);
  }); flake.repeat.set(42, 42);
  const paint = new T.MeshPhysicalMaterial({ color: finishes[0].color, metalness: finishes[0].metalness, roughness: .25, clearcoat: 1, clearcoatRoughness: .13, iridescence: .65, iridescenceIOR: 1.28, iridescenceThicknessRange: [230, 350], envMapIntensity: 1.4, bumpMap: flake, bumpScale: .00004, side: T.DoubleSide });
  const carbon = new T.MeshPhysicalMaterial({ color: 0x6a737e, map: carbonMap, bumpMap: carbonMap, bumpScale: .0008, roughness: .42, metalness: .38, clearcoat: .35, clearcoatRoughness: .25, side: T.DoubleSide });
  const black = new T.MeshStandardMaterial({ color: 0x080a0e, metalness: .25, roughness: .42, side: T.DoubleSide });
  const rubber = new T.MeshStandardMaterial({ color: 0x101112, roughness: .88, side: T.DoubleSide });
  const seam = new T.MeshStandardMaterial({ color: 0x040609, roughness: .75, side: T.DoubleSide });
  const alloy = new T.MeshStandardMaterial({ color: 0xb2b6bd, metalness: .72, roughness: .29, side: T.DoubleSide });
  const graphite = new T.MeshPhysicalMaterial({ color: 0x161b22, metalness: .72, roughness: .26, clearcoat: .45, side: T.DoubleSide });
  const machined = new T.MeshStandardMaterial({ color: 0x84939c, metalness: 1, roughness: .23, side: T.DoubleSide });
  const titanium = new T.MeshStandardMaterial({ color: 0x77716b, metalness: 1, roughness: .29, side: T.DoubleSide });
  const glass = new T.MeshPhysicalMaterial({ color: 0x182027, metalness: 0, roughness: .085, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.2, transparent: true, opacity: .97, side: T.DoubleSide });
  const lens = new T.MeshPhysicalMaterial({ color: 0x27323e, metalness: .1, roughness: .11, clearcoat: 1, side: T.DoubleSide });
  const headlight = new T.MeshPhysicalMaterial({color:0x7b8792,metalness:.5,roughness:.18,clearcoat:1,emissive:0xb7d2df,emissiveIntensity:.12,side:T.DoubleSide});
  const white = new T.MeshStandardMaterial({ color: 0xdbe5ec, emissive: 0xccdfef, emissiveIntensity: 2.3, side: T.DoubleSide });
  const red = new T.MeshStandardMaterial({ color: 0x83121d, emissive: 0xff162b, emissiveIntensity: RUNNING_LAMP_INTENSITY, side: T.DoubleSide });
  const amber = new T.MeshStandardMaterial({ color: 0xa75d1a, emissive: 0xff6d0b, emissiveIntensity: .7, side: T.DoubleSide });
  return { paint, carbon, black, rubber, seam, alloy, graphite, machined, titanium, glass, lens, headlight, white, red, amber };
}
export type Materials = ReturnType<typeof createMaterials>;

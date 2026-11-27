import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, Calculator, Eye, Flame, Layers, RotateCw, Sliders, Thermometer } from 'lucide-react';
import {
  ConductorMaterial,
  INSTALLATION_METHODS,
  INSULATIONS,
  InstallationMethodId,
  InsulationType,
  METHOD_ORDER,
  PhaseSystem,
  STANDARD_SECTIONS,
  StandardSection,
  getGroupingFactor,
  getTempCorrectionFactor,
  lookupBaseAmpacity,
} from '../data/itcBt19';
import type { CalculationResult } from '../engine/calculator';
import { Tex, tn, ts } from './Tex';

/** Cas de càlcul enviat al visor des de la calculadora o dels exercicis */
export interface ViewerCalcContext {
  source: 'calculadora' | 'exercici';
  method: InstallationMethodId;
  phase: PhaseSystem;
  material: ConductorMaterial;
  insulation: InsulationType;
  ambientTemp: number;
  groupedCircuits: number;
  serviceCurrentA: number;
  section: StandardSection;
}

export function viewerContextFromResult(result: CalculationResult, source: ViewerCalcContext['source']): ViewerCalcContext {
  return {
    source,
    method: result.input.method,
    phase: result.effectivePhase,
    material: result.input.material,
    insulation: result.effectiveInsulation,
    ambientTemp: result.input.ambientTemp,
    groupedCircuits: result.input.groupedCircuits,
    serviceCurrentA: result.serviceCurrentA,
    section: result.finalSection,
  };
}

interface Installation3DViewerProps {
  selectedMethod: InstallationMethodId;
  onSelectMethod: (method: InstallationMethodId) => void;
  /** Últim cas enviat des de la calculadora o els exercicis (activa el mapa tèrmic) */
  calcContext?: ViewerCalcContext | null;
  onClearCalcContext?: () => void;
  /** Porta el mètode seleccionat a la calculadora */
  onCalculateWithMethod?: (method: InstallationMethodId) => void;
}

/** Escala de color tèrmica: t = (T − T_amb)/(T_màx − T_amb); t > 1 indica sobrecàrrega */
const HEAT_STOPS: [number, string][] = [
  [0, '#2563eb'],
  [0.4, '#10b981'],
  [0.65, '#eab308'],
  [0.85, '#f97316'],
  [1, '#dc2626'],
  [1.25, '#c026d3'],
];
const HEAT_MAX_T = 1.25;

function heatColor(t: number): THREE.Color {
  const x = Math.min(Math.max(t, 0), HEAT_MAX_T);
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [t1, c1] = HEAT_STOPS[i];
    if (x <= t1) {
      const [t0, c0] = HEAT_STOPS[i - 1];
      return new THREE.Color(c0).lerp(new THREE.Color(c1), (x - t0) / (t1 - t0));
    }
  }
  return new THREE.Color(HEAT_STOPS[HEAT_STOPS.length - 1][1]);
}

const HEAT_GRADIENT_CSS = `linear-gradient(90deg, ${HEAT_STOPS.map(([t, c]) => `${c} ${(t / HEAT_MAX_T) * 100}%`).join(', ')})`;

interface ThermalEstimate {
  available: boolean;
  ambient: number;
  tMax: number;
  itab: number | null;
  kt: number;
  kg: number;
  iz: number;
  ratio: number;
  temp: number;
  /** Escalfament relatiu (0 = T_amb, 1 = T_màx) */
  t: number;
}

type CameraPreset = 'iso' | 'section' | 'front' | 'top';

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number]; label: string }> = {
  iso: { pos: [4.6, 3.1, 4.9], target: [0, 0.2, 0], label: 'Isomètrica' },
  section: { pos: [0.3, 0.45, 5.4], target: [0, 0.2, 0], label: 'Tall transversal' },
  front: { pos: [5.4, 0.9, 0.2], target: [0, 0.2, 0], label: 'Lateral' },
  top: { pos: [0.1, 6.2, 1.8], target: [0, 0, 0], label: 'Superior' },
};

/** Modalitat constructiva d'un mètode (un mateix mètode de referència pot correspondre a diversos sistemes de la Tabla B) */
interface MethodVariant {
  id: string;
  label: string;
  description: string;
  /** Índex de l'exemple de `INSTALLATION_METHODS[m].examples` que representa */
  exampleIndex?: number;
}

/** Modalitats visualitzables per mètode. La primera és la que es mostra per defecte. */
const METHOD_VARIANTS: Partial<Record<InstallationMethodId, MethodVariant[]>> = {
  A1: [
    { id: 'tub', label: 'En tub', description: 'Conductors unipolars dins d’un tub encastat a la paret tèrmicament aïllant.', exampleIndex: 0 },
    { id: 'directe', label: 'Mànega directa', description: 'Cable multiconductor encastat directament a la paret aïllant, sense tub.', exampleIndex: 1 },
  ],
  B1: [
    { id: 'encastat', label: 'Tub encastat', description: 'Tub corrugat encastat en una regata de la paret d’obra.', exampleIndex: 0 },
    { id: 'superficial', label: 'Tub superficial', description: 'Tub rígid fixat sobre la paret amb abraçadores (separació < 0,3·D).', exampleIndex: 1 },
    { id: 'canal', label: 'Canal protectora', description: 'Conductors allotjats en una canal protectora (canaleta) sobre la paret.', exampleIndex: 2 },
  ],
  B2: [
    { id: 'encastat', label: 'Tub encastat', description: 'Tub corrugat encastat en una regata de la paret d’obra.', exampleIndex: 0 },
    { id: 'superficial', label: 'Tub superficial', description: 'Tub rígid fixat sobre la paret amb abraçadores (separació < 0,3·D).', exampleIndex: 1 },
    { id: 'canal', label: 'Canal protectora', description: 'Mànega allotjada en una canal protectora (canaleta) sobre la paret.', exampleIndex: 2 },
  ],
  C: [
    { id: 'paret', label: 'Sobre paret', description: 'Cable fixat directament a la paret amb grapes (separació < 0,3·D).', exampleIndex: 1 },
    { id: 'safata', label: 'Safata no perforada', description: 'Cable sobre una safata de base contínua, sense ventilació inferior.', exampleIndex: 0 },
    { id: 'encastat', label: 'Encastat sense tub', description: 'Cable encastat directament a la paret d’obra, sense tub.', exampleIndex: 2 },
  ],
  E: [
    { id: 'safata', label: 'Safata perforada', description: 'Cable sobre safata perforada: l’aire circula també per sota.', exampleIndex: 1 },
    { id: 'paret', label: 'Separat de paret', description: 'Cable sostingut amb distanciadors a ≥ 0,3·D de la paret.', exampleIndex: 0 },
  ],
  F: [
    { id: 'trevol', label: 'En trèvol', description: 'Tres cables unipolars en contacte formant un triangle (trèvol).' },
    { id: 'pla', label: 'En pla', description: 'Cables unipolars en contacte, l’un al costat de l’altre en una capa.' },
  ],
};

/** Crea una textura a ratlles verd-groc per al conductor de protecció PE */
function createPeStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#facc15';
  for (let i = -128; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 0);
    ctx.lineTo(i + 144, 128);
    ctx.lineTo(i + 128, 128);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 6);
  return tex;
}

/** Textura procedural de maó per parets d'obra (B1, B2, C) */
function createBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#cbd5e1'; // morter
  ctx.fillRect(0, 0, 256, 256);
  const rows = 8;
  const rowH = 256 / rows;
  const brickW = 64;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (brickW / 2);
    for (let x = -brickW; x < 256 + brickW; x += brickW) {
      const shade = 155 + ((r * 17 + x * 7) % 24);
      ctx.fillStyle = `rgb(${shade}, ${Math.round(shade * 0.48)}, ${Math.round(shade * 0.36)})`;
      ctx.fillRect(x + offset + 3, r * rowH + 3, brickW - 6, rowH - 6);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/** Textura procedural de llana mineral groga (A1, A2) */
function createMineralWoolTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(161, 98, 7, 0.35)' : 'rgba(254, 240, 138, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const x = (i * 37) % 256;
    const y = (i * 53) % 256;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 18, y + (i % 2 ? 12 : -12), x + 36, y + 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/** Crea un cable individual (aïllament + ànima metàl·lica de coure o alumini sobresortint a l'extrem) */
function createWireMesh(
  length: number,
  outerRadius: number,
  colorHex: number | 'pe',
  metalMat: THREE.Material,
  peTexture: THREE.Texture
): THREE.Group {
  const g = new THREE.Group();
  const insMat =
    colorHex === 'pe'
      ? new THREE.MeshStandardMaterial({ map: peTexture, roughness: 0.45, metalness: 0.05 })
      : new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.42, metalness: 0.05 });

  const insGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, length, 24);
  insGeo.rotateX(Math.PI / 2);
  const insMesh = new THREE.Mesh(insGeo, insMat);
  insMesh.userData.thermal = true;
  insMesh.castShadow = true;
  insMesh.receiveShadow = true;
  g.add(insMesh);

  // Ànima metàl·lica que sobresurt per davant (tall didàctic)
  const coreRadius = outerRadius * 0.58;
  const coreGeo = new THREE.CylinderGeometry(coreRadius, coreRadius, length + 0.55, 20);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, metalMat);
  coreMesh.position.z = 0.25;
  coreMesh.castShadow = true;
  g.add(coreMesh);

  return g;
}

/** Crea una mànega multiconductor amb coberta exterior opaca retallada a l'extrem per veure els conductors interns */
function createMulticoreCable(
  length: number,
  jacketRadius: number,
  phase: PhaseSystem,
  metalMat: THREE.Material,
  peTexture: THREE.Texture
): THREE.Group {
  const g = new THREE.Group();
  const jacketMat = new THREE.MeshStandardMaterial({
    color: 0x161a20,
    roughness: 0.48,
    metalness: 0.12,
  });

  // Coberta exterior sempre opaca, més curta pel davant perquè es vegin els fils emergir
  const jacketLen = length - 0.72;
  const jacketGeo = new THREE.CylinderGeometry(jacketRadius, jacketRadius, jacketLen, 32);
  jacketGeo.rotateX(Math.PI / 2);
  const jacketMesh = new THREE.Mesh(jacketGeo, jacketMat);
  jacketMesh.userData.thermal = true;
  jacketMesh.position.z = -0.36;
  jacketMesh.castShadow = true;
  jacketMesh.receiveShadow = true;
  g.add(jacketMesh);

  // Farciment interior opac (es veu al tall frontal de la coberta)
  const fillerGeo = new THREE.CylinderGeometry(jacketRadius * 0.84, jacketRadius * 0.84, jacketLen + 0.03, 24);
  fillerGeo.rotateX(Math.PI / 2);
  const fillerMesh = new THREE.Mesh(
    fillerGeo,
    new THREE.MeshStandardMaterial({ color: 0xdbe2ea, roughness: 0.85 })
  );
  fillerMesh.position.z = -0.36;
  g.add(fillerMesh);

  const wireDefs: { color: number | 'pe'; angle: number }[] =
    phase === 'trifasic'
      ? [
          { color: 0x7c4a2d, angle: 0 }, // Marró L1
          { color: 0x1f242c, angle: (Math.PI * 2) / 5 }, // Negre L2
          { color: 0x94a3b8, angle: (Math.PI * 4) / 5 }, // Gris L3
          { color: 0x2563eb, angle: (Math.PI * 6) / 5 }, // Blau N
          { color: 'pe', angle: (Math.PI * 8) / 5 }, // Verd-groc PE
        ]
      : [
          { color: 0x7c4a2d, angle: 0 }, // Marró L1
          { color: 0x2563eb, angle: (Math.PI * 2) / 3 }, // Blau N
          { color: 'pe', angle: (Math.PI * 4) / 3 }, // Verd-groc PE
        ];

  const wireR = phase === 'trifasic' ? jacketRadius * 0.27 : jacketRadius * 0.34;
  const ringR = jacketRadius * 0.44;

  wireDefs.forEach((w) => {
    const wm = createWireMesh(length, wireR, w.color, metalMat, peTexture);
    wm.position.set(Math.cos(w.angle) * ringR, Math.sin(w.angle) * ringR, 0);
    g.add(wm);
  });

  return g;
}

/** Crea un tub corrugat o rígid buit (transparent si cutaway està activat) */
function createConduit(
  length: number,
  radius: number,
  colorHex: number,
  corrugated: boolean,
  cutaway: boolean
): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.45,
    metalness: 0.15,
    side: THREE.DoubleSide,
    transparent: cutaway,
    opacity: cutaway ? 0.32 : 0.92,
  });

  // Tub principal obert als extrems
  const mainGeo = new THREE.CylinderGeometry(radius, radius, length, 32, 1, true);
  mainGeo.rotateX(Math.PI / 2);
  const mainMesh = new THREE.Mesh(mainGeo, mat);
  mainMesh.castShadow = !cutaway;
  mainMesh.receiveShadow = true;
  g.add(mainMesh);

  if (corrugated) {
    const ringCount = 26;
    for (let i = 0; i < ringCount; i++) {
      const z = -length / 2 + (i + 0.5) * (length / ringCount);
      const torus = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.02, 0.025, 8, 24), mat);
      torus.position.z = z;
      g.add(torus);
    }
  }

  return g;
}

/**
 * Prisma rectangular (secció X·Y, extrusió en Z i centrat en Z) amb el pas d'un tub
 * buidat: forat circular, regata al cantó dret o tall complet. Així l'interior del tub
 * només conté els cables. Les UV es normalitzen com les d'un BoxGeometry.
 */
function createSlabWithConduitPassage(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  length: number,
  cx: number,
  cy: number,
  r: number
): THREE.BufferGeometry {
  const shapes: THREE.Shape[] = [];
  const hAt = (x: number) => Math.sqrt(Math.max(r * r - (x - cx) ** 2, 0));

  if (cx - r > x0 && cx + r < x1) {
    // Forat interior
    const s = new THREE.Shape();
    s.moveTo(x0, y0);
    s.lineTo(x1, y0);
    s.lineTo(x1, y1);
    s.lineTo(x0, y1);
    s.closePath();
    const hole = new THREE.Path();
    hole.absarc(cx, cy, r, 0, Math.PI * 2, false);
    s.holes.push(hole);
    shapes.push(s);
  } else if (cx - r > x0) {
    // Regata oberta al cantó dret (x1)
    const h = hAt(x1);
    const a = Math.atan2(h, x1 - cx);
    const s = new THREE.Shape();
    s.moveTo(x0, y0);
    s.lineTo(x1, y0);
    s.lineTo(x1, cy - h);
    s.absarc(cx, cy, r, -a, a - Math.PI * 2, true);
    s.lineTo(x1, y1);
    s.lineTo(x0, y1);
    s.closePath();
    shapes.push(s);
  } else {
    // El tub travessa tot el gruix: dues peces (superior i inferior)
    const h0 = hAt(x0);
    const h1 = hAt(x1);
    const a0 = Math.atan2(h0, x0 - cx);
    const a1 = Math.atan2(h1, x1 - cx);
    const top = new THREE.Shape();
    top.moveTo(x0, cy + h0);
    top.lineTo(x0, y1);
    top.lineTo(x1, y1);
    top.lineTo(x1, cy + h1);
    top.absarc(cx, cy, r, a1, a0, false);
    top.closePath();
    const bottom = new THREE.Shape();
    bottom.moveTo(x0, y0);
    bottom.lineTo(x1, y0);
    bottom.lineTo(x1, cy - h1);
    bottom.absarc(cx, cy, r, -a1, -a0, true);
    bottom.closePath();
    shapes.push(top, bottom);
  }

  const geo = new THREE.ExtrudeGeometry(shapes, { depth: length, bevelEnabled: false, curveSegments: 40 });
  geo.translate(0, 0, -length / 2);

  // UV tipus caixa: cada cara rep coordenades 0..1 segons la seva orientació
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const W = x1 - x0;
  const H = y1 - y0;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) - x0) / W;
    const v = (pos.getY(i) - y0) / H;
    const w = (pos.getZ(i) + length / 2) / length;
    const nx = Math.abs(nor.getX(i));
    const nz = Math.abs(nor.getZ(i));
    if (nz > 0.5) uv.setXY(i, u, v);
    else if (nx > 0.5) uv.setXY(i, w, v);
    else uv.setXY(i, u, w);
  }
  uv.needsUpdate = true;
  return geo;
}

/** Construeix una cota dimensional 3D entre dos punts */
function createDimensionIndicator(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  colorHex = 0x38bdf8
): THREE.Group {
  const g = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

  const lineMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, len, 10), lineMat);
  shaft.position.copy(mid);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  g.add(shaft);

  // Caps en els extrems
  [p1, p2].forEach((pt) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), lineMat);
    cap.position.copy(pt);
    g.add(cap);
  });

  return g;
}

/** Construeix l'escena 3D completa per a cada mètode d'instal·lació de la ITC-BT-19 */
function buildInstallationScene(
  method: InstallationMethodId,
  phase: PhaseSystem,
  material: ConductorMaterial,
  cutaway: boolean,
  textures: { pe: THREE.Texture; brick: THREE.Texture; wool: THREE.Texture },
  variant?: string,
  thermal?: { color: THREE.Color; glow: number } | null
): THREE.Group {
  const root = new THREE.Group();
  const cableLength = 4.6;

  const metalMat =
    material === 'Cu'
      ? new THREE.MeshStandardMaterial({ color: 0xd97736, metalness: 0.88, roughness: 0.22 })
      : new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.85, roughness: 0.28 });

  const wallHeight = 3.2;
  const wallLength = 4.2;

  const addUnipolarBundle = (parent: THREE.Group, spreadRadius: number, wireRadius: number, offsetX = 0, offsetY = 0) => {
    const defs: { color: number | 'pe'; x: number; y: number }[] =
      phase === 'trifasic'
        ? [
            { color: 0x7c4a2d, x: -spreadRadius, y: -spreadRadius * 0.45 },
            { color: 0x1f242c, x: 0, y: -spreadRadius * 0.65 },
            { color: 0x94a3b8, x: spreadRadius, y: -spreadRadius * 0.45 },
            { color: 0x2563eb, x: -spreadRadius * 0.55, y: spreadRadius * 0.45 },
            { color: 'pe', x: spreadRadius * 0.55, y: spreadRadius * 0.45 },
          ]
        : [
            { color: 0x7c4a2d, x: -spreadRadius * 0.7, y: -spreadRadius * 0.35 },
            { color: 0x2563eb, x: spreadRadius * 0.7, y: -spreadRadius * 0.35 },
            { color: 'pe', x: 0, y: spreadRadius * 0.55 },
          ];
    defs.forEach((d) => {
      const w = createWireMesh(cableLength, wireRadius, d.color, metalMat, textures.pe);
      w.position.set(offsetX + d.x, offsetY + d.y, 0.15);
      parent.add(w);
    });
  };

  // ---------- Peces reutilitzables entre mètodes ----------

  /** Paret d'obra (maó, x ∈ [-1,3, -0,2]) + arrebossat (x ∈ [-0,2, -0,08]). Opcionalment buidada al pas d'un tub o cable. */
  const addMasonryWall = (passage?: { cx: number; cy: number; r: number }) => {
    const wallMat = new THREE.MeshStandardMaterial({
      map: textures.brick,
      roughness: 0.85,
      transparent: cutaway,
      opacity: cutaway ? 0.45 : 1,
    });
    const plasterMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
      transparent: cutaway,
      opacity: cutaway ? 0.3 : 1,
    });
    const slab = (x0: number, x1: number) =>
      passage && passage.cx + passage.r > x0
        ? createSlabWithConduitPassage(x0, x1, -wallHeight / 2, wallHeight / 2, wallLength, passage.cx, passage.cy, passage.r)
        : (() => {
            const g = new THREE.BoxGeometry(x1 - x0, wallHeight, wallLength);
            g.translate((x0 + x1) / 2, 0, 0);
            return g;
          })();
    const wall = new THREE.Mesh(slab(-1.3, -0.2), wallMat);
    wall.position.z = -0.2;
    wall.receiveShadow = true;
    const plaster = new THREE.Mesh(slab(-0.2, -0.08), plasterMat);
    plaster.position.z = -0.2;
    root.add(wall, plaster);
  };

  /** Tub rígid en muntatge superficial amb abraçadores. Retorna la x de l'eix. */
  const addSurfaceConduit = (): number => {
    const x = 0.28;
    const conduit = createConduit(cableLength - 0.4, 0.36, 0x94a3b8, false, cutaway);
    conduit.position.set(x, 0, -0.1);
    root.add(conduit);
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.65, roughness: 0.35 });
    [-1.3, 0, 1.3].forEach((z) => {
      const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.04, 10, 24), clampMat);
      clamp.position.set(x, 0, z);
      root.add(clamp);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.95, 0.14), clampMat);
      foot.position.set(-0.04, 0, z);
      root.add(foot);
    });
    return x;
  };

  /** Canal protectora (canaleta de PVC amb tapa) fixada sobre la paret. Retorna la x del centre. */
  const addTrunking = (): number => {
    const x0 = -0.08;
    const depth = 0.62;
    const height = 0.74;
    const t = 0.04;
    const len = cableLength - 0.5;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, metalness: 0.02 });
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.5,
      transparent: cutaway,
      opacity: cutaway ? 0.28 : 1,
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(t, height, len), bodyMat);
    back.position.set(x0 + t / 2, 0, -0.1);
    const top = new THREE.Mesh(new THREE.BoxGeometry(depth, t, len), bodyMat);
    top.position.set(x0 + depth / 2, height / 2 - t / 2, -0.1);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(depth, t, len), bodyMat);
    bottom.position.set(x0 + depth / 2, -height / 2 + t / 2, -0.1);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(t, height + 0.05, len), lidMat);
    lid.position.set(x0 + depth - t / 2, 0, -0.1);
    [back, top, bottom].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });
    root.add(back, top, bottom, lid);
    return x0 + depth / 2;
  };

  /** Paret posterior fosca (cara a x = -1,5) per a muntatges a l'aire */
  const addBackWall = () => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, wallHeight, wallLength),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
    );
    wall.position.set(-1.75, 0, -0.2);
    root.add(wall);
  };

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.72, roughness: 0.32 });

  /** Safata metàl·lica sobre mènsules (perforada o no). La cara superior de la base queda a y = -0,33. */
  const addCableTray = (perforated: boolean) => {
    addBackWall();
    [-1.3, 1.1].forEach((z) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.16), steelMat);
      bracket.position.set(-0.35, -0.45, z);
      root.add(bracket);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.24), steelMat);
      plate.position.set(-1.46, -0.45, z);
      root.add(plate);
    });

    const trayWidth = 1.65;
    const trayLen = 4.1;
    const trayBase = new THREE.Mesh(new THREE.BoxGeometry(trayWidth, 0.06, trayLen), steelMat);
    trayBase.position.set(0.0, -0.36, -0.15);
    trayBase.receiveShadow = true;
    root.add(trayBase);

    [-trayWidth / 2, trayWidth / 2].forEach((x) => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, trayLen), steelMat);
      side.position.set(x, -0.18, -0.15);
      root.add(side);
    });

    if (perforated) {
      // Ranures de ventilació (perforacions) sobre la base de la safata
      const slotMat = new THREE.MeshBasicMaterial({ color: 0x0b1120 });
      for (let zi = -1.7; zi <= 1.5; zi += 0.4) {
        for (let xi = -0.55; xi <= 0.55; xi += 0.36) {
          const slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.072, 0.16), slotMat);
          slot.position.set(xi, -0.36, zi);
          root.add(slot);
        }
      }
    }
  };

  if (method === 'A1' || method === 'A2') {
    // Paret tèrmicament aïllant (pladur + llana mineral groga)
    const directCable = method === 'A1' && variant === 'directe';
    const plasterMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.85,
      transparent: cutaway,
      opacity: cutaway ? 0.25 : 0.95,
    });
    const backBoard = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, wallLength), plasterMat);
    backBoard.position.set(-0.75, 0, -0.2);
    backBoard.receiveShadow = true;
    root.add(backBoard);

    const frontBoard = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, wallLength), plasterMat);
    frontBoard.position.set(0.75, 0, -0.2);
    root.add(frontBoard);

    // Llana mineral que omple la cambra, buidada només al pas del tub o del cable
    const woolMat = new THREE.MeshStandardMaterial({
      map: textures.wool,
      roughness: 0.95,
      transparent: true,
      opacity: cutaway ? 0.38 : 0.86,
    });
    const wool = new THREE.Mesh(
      createSlabWithConduitPassage(-0.66, 0.66, -wallHeight / 2, wallHeight / 2, wallLength - 0.05, 0, 0, directCable ? 0.26 : 0.43),
      woolMat
    );
    wool.position.z = -0.2;
    root.add(wool);

    if (directCable) {
      // A1: mànega encastada directament en contacte amb l'aïllament tèrmic
      const cable = createMulticoreCable(cableLength, 0.25, phase, metalMat, textures.pe);
      cable.position.set(0, 0, 0.15);
      root.add(cable);
    } else {
      // Tub corrugat encastat al centre de la llana mineral
      const conduit = createConduit(cableLength - 0.4, 0.38, 0x334155, true, cutaway);
      conduit.position.set(0, 0, -0.1);
      root.add(conduit);

      if (method === 'A1') {
        addUnipolarBundle(root, 0.14, 0.075, 0, 0);
      } else {
        const cable = createMulticoreCable(cableLength, 0.25, phase, metalMat, textures.pe);
        cable.position.set(0, 0, 0.15);
        root.add(cable);
      }
    }
  } else if (method === 'B1' || method === 'B2') {
    // B1 = conductors unipolars · B2 = mànega multiconductor; la canalització depèn de la modalitat
    const addCables = (x: number) => {
      if (method === 'B1') {
        addUnipolarBundle(root, 0.14, 0.075, x, 0);
      } else {
        const cable = createMulticoreCable(cableLength, 0.25, phase, metalMat, textures.pe);
        cable.position.set(x, 0, 0.15);
        root.add(cable);
      }
    };

    if (variant === 'superficial') {
      addMasonryWall();
      addCables(addSurfaceConduit());
    } else if (variant === 'canal') {
      addMasonryWall();
      addCables(addTrunking());
    } else {
      // Encastat: tub corrugat en regata; paret i arrebossat buidats al pas del tub
      // (radi del tub 0,38 + anelles corrugades) perquè a l'interior només hi hagi cables.
      const groove = { cx: -0.12, cy: 0, r: 0.43 };
      addMasonryWall(groove);
      const conduit = createConduit(cableLength - 0.4, 0.38, 0x475569, true, cutaway);
      conduit.position.set(groove.cx, 0, -0.1);
      root.add(conduit);
      addCables(groove.cx);
    }
  } else if (method === 'C') {
    if (variant === 'safata') {
      // Cable multiconductor sobre safata NO perforada (base contínua, sense ventilació inferior)
      addCableTray(false);
      const cable = createMulticoreCable(cableLength, 0.3, phase, metalMat, textures.pe);
      cable.position.set(0, -0.03, 0.15);
      root.add(cable);
    } else if (variant === 'encastat') {
      // Cable encastat directament a l'obra, sense tub (la paret es buida només al pas del cable)
      const pass = { cx: -0.55, cy: 0, r: 0.31 };
      addMasonryWall(pass);
      const cable = createMulticoreCable(cableLength, 0.3, phase, metalMat, textures.pe);
      cable.position.set(pass.cx, 0, 0.15);
      root.add(cable);
    } else {
      // Cable multiconductor fixat directament a la paret amb grapes
      addMasonryWall();
      const x = -0.08 + 0.3;
      const cable = createMulticoreCable(cableLength, 0.3, phase, metalMat, textures.pe);
      cable.position.set(x, 0, 0.15);
      root.add(cable);

      const clipMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.4, metalness: 0.4 });
      [-1.4, -0.2, 1.0].forEach((z) => {
        const clip = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 24, Math.PI * 1.15), clipMat);
        clip.rotation.z = -Math.PI * 0.58;
        clip.position.set(x, 0, z);
        root.add(clip);
      });
    }
  } else if (method === 'E' && variant === 'paret') {
    // E: cable multiconductor separat de la paret ≥ 0,3·D amb suports distanciadors
    addBackWall();
    const r = 0.33;
    const x = -1.5 + 0.47 + r; // separació lliure 0,47 ≥ 0,3·D
    const cable = createMulticoreCable(cableLength, r, phase, metalMat, textures.pe);
    cable.position.set(x, 0, 0.15);
    root.add(cable);

    [-1.3, 0.1, 1.4].forEach((z) => {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.22), steelMat);
      base.position.set(-1.46, 0, z);
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.07, 0.07), steelMat);
      rod.position.set(-1.5 + 0.47 / 2, 0, z);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(r + 0.03, 0.035, 10, 28), steelMat);
      collar.position.set(x, 0, z);
      root.add(base, rod, collar);
    });

    root.add(
      createDimensionIndicator(new THREE.Vector3(-1.48, 0, 1.85), new THREE.Vector3(-1.5 + 0.47, 0, 1.85), 0x38bdf8)
    );
  } else if (method === 'E' || method === 'F') {
    addCableTray(true);

    if (method === 'E') {
      // Cable multiconductor sobre safata perforada, separat de paret >= 0.3D
      const cable = createMulticoreCable(cableLength, 0.33, phase, metalMat, textures.pe);
      cable.position.set(0.05, 0.01, 0.15);
      root.add(cable);

      // Indicador de separació >= 0,3·D respecte de la paret
      const dim = createDimensionIndicator(
        new THREE.Vector3(-1.48, 0.01, 1.85),
        new THREE.Vector3(-0.3, 0.01, 1.85),
        0x38bdf8
      );
      root.add(dim);
    } else {
      // F: Cables unipolars en contacte mutu (en trèvol o en pla per 3x, junts per 2x)
      const r = 0.23;
      const yBase = -0.33 + r;
      if (phase === 'trifasic') {
        const flat = variant === 'pla';
        const c1 = createWireMesh(cableLength, r, 0x7c4a2d, metalMat, textures.pe);
        const c2 = createWireMesh(cableLength, r, 0x1f242c, metalMat, textures.pe);
        const c3 = createWireMesh(cableLength, r, 0x94a3b8, metalMat, textures.pe);
        if (flat) {
          c1.position.set(-2 * r, yBase, 0.15);
          c2.position.set(0, yBase, 0.15);
          c3.position.set(2 * r, yBase, 0.15);
        } else {
          c1.position.set(-r, yBase, 0.15);
          c2.position.set(r, yBase, 0.15);
          c3.position.set(0, yBase + r * Math.sqrt(3), 0.15);
        }
        root.add(c1, c2, c3);
      } else {
        const c1 = createWireMesh(cableLength, r, 0x7c4a2d, metalMat, textures.pe);
        c1.position.set(-r, yBase, 0.15);
        const c2 = createWireMesh(cableLength, r, 0x2563eb, metalMat, textures.pe);
        c2.position.set(r, yBase, 0.15);
        root.add(c1, c2);
      }
      // Indicador de separació a paret >= D
      const dim = createDimensionIndicator(
        new THREE.Vector3(-1.48, 0.0, 1.85),
        new THREE.Vector3(-0.48, 0.0, 1.85),
        0x38bdf8
      );
      root.add(dim);
    }
  } else if (method === 'G') {
    // G: Cables unipolars separats mínim D a l'aire lliure sobre suports/abraçadores espaiades
    const r = 0.22;
    const spacing = r * 4.4; // distància centre-a-centre = 2D (espai lliure >= D)

    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.35 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.3 });

    // Carrils de suport horitzontals
    [-1.2, 1.1].forEach((z) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.18), railMat);
      rail.position.set(0, -0.42, z);
      root.add(rail);
    });

    const colors: number[] = [0x7c4a2d, 0x1f242c, 0x94a3b8];
    const xs = [-spacing, 0, spacing];
    xs.forEach((x, idx) => {
      const cable = createWireMesh(cableLength, r, colors[idx], metalMat, textures.pe);
      cable.position.set(x, 0, 0.15);
      root.add(cable);

      [-1.2, 1.1].forEach((z) => {
        const collar = new THREE.Mesh(new THREE.TorusGeometry(r + 0.04, 0.035, 10, 24), collarMat);
        collar.position.set(x, 0, z);
        root.add(collar);
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.1), collarMat);
        stem.position.set(x, -0.28, z);
        root.add(stem);
      });
    });

    // Indicadors de separació >= D entre cables
    root.add(
      createDimensionIndicator(
        new THREE.Vector3(-spacing + r, 0.45, 1.8),
        new THREE.Vector3(-r, 0.45, 1.8),
        0x34d399
      ),
      createDimensionIndicator(
        new THREE.Vector3(r, 0.45, 1.8),
        new THREE.Vector3(spacing - r, 0.45, 1.8),
        0x34d399
      )
    );
  } else if (method === 'D') {
    // D: Soterrat sota tub a 70 cm de profunditat (estratificació del terreny + cinta senyalització + tub vermell)
    const trenchW = 2.8;
    const trenchL = 3.9;

    // Llit de sorra (inferior)
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xd6b47c,
      roughness: 0.95,
      transparent: cutaway,
      opacity: cutaway ? 0.35 : 0.92,
    });
    // Llit de sorra amb el pas del tub buidat (radi 0,42 + anelles): l'interior del tub només conté el cable
    const sandBed = new THREE.Mesh(
      createSlabWithConduitPassage(-trenchW / 2, trenchW / 2, -0.35 - 1.15 / 2, -0.35 + 1.15 / 2, trenchL, 0, -0.25, 0.465),
      sandMat
    );
    sandBed.position.set(0, 0, -0.2);
    root.add(sandBed);

    // Terra compactada (intermèdia)
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.96,
      transparent: true,
      opacity: cutaway ? 0.28 : 0.85,
    });
    const soilLayer = new THREE.Mesh(new THREE.BoxGeometry(trenchW, 0.95, trenchL), soilMat);
    soilLayer.position.set(0, 0.72, -0.2);
    root.add(soilLayer);

    // Paviment superior
    const asphalt = new THREE.Mesh(
      new THREE.BoxGeometry(trenchW + 0.1, 0.22, trenchL + 0.06),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, transparent: cutaway, opacity: cutaway ? 0.4 : 1 })
    );
    asphalt.position.set(0, 1.32, -0.2);
    root.add(asphalt);

    // Cinta de senyalització groga "ATENCIÓ CABLE ELÈCTRIC"
    const tape = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.025, trenchL + 0.2),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
    );
    tape.position.set(0, 0.65, -0.1);
    root.add(tape);

    // Tub corrugat vermell de doble paret soterrat
    const redConduit = createConduit(cableLength - 0.35, 0.42, 0xdc2626, true, cutaway);
    redConduit.position.set(0, -0.25, -0.05);
    root.add(redConduit);

    // Cable 0,6/1 kV XLPE a l'interior del tub
    const cable = createMulticoreCable(cableLength, 0.27, phase, metalMat, textures.pe);
    cable.position.set(0, -0.25, 0.2);
    root.add(cable);

    // Cota de profunditat 70 cm
    root.add(
      createDimensionIndicator(
        new THREE.Vector3(1.62, 1.32, 1.5),
        new THREE.Vector3(1.62, -0.25, 1.5),
        0xf59e0b
      )
    );
  }

  // Mapa tèrmic: l'aïllament i la coberta dels cables prenen el color de la temperatura estimada
  if (thermal) {
    const heatMat = new THREE.MeshStandardMaterial({
      color: thermal.color,
      emissive: thermal.color,
      emissiveIntensity: thermal.glow,
      roughness: 0.5,
      metalness: 0.05,
    });
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.userData.thermal) (o as THREE.Mesh).material = heatMat;
    });
  }

  return root;
}

export const Installation3DViewer: React.FC<Installation3DViewerProps> = ({
  selectedMethod,
  onSelectMethod,
  calcContext,
  onClearCalcContext,
  onCalculateWithMethod,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const autoRotateRef = useRef<boolean>(false);

  const [phase, setPhase] = useState<PhaseSystem>(calcContext?.phase ?? 'trifasic');
  const [material, setMaterial] = useState<ConductorMaterial>(calcContext?.material ?? 'Cu');
  const [thermalOn, setThermalOn] = useState<boolean>(Boolean(calcContext));
  const [insulation, setInsulation] = useState<InsulationType>(calcContext?.insulation ?? 'XLPE');
  const [ibA, setIbA] = useState<number>(calcContext?.serviceCurrentA ?? 60);
  const [section, setSection] = useState<StandardSection>(calcContext?.section ?? 16);
  const [cutaway, setCutaway] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('iso');
  const [variantByMethod, setVariantByMethod] = useState<Partial<Record<InstallationMethodId, string>>>({});

  const variants = METHOD_VARIANTS[selectedMethod];
  const activeVariant = variants?.find((v) => v.id === variantByMethod[selectedMethod]) ?? variants?.[0];
  const activeVariantId = activeVariant?.id;
  const selectVariant = (id: string) => setVariantByMethod((prev) => ({ ...prev, [selectedMethod]: id }));

  /**
   * Temperatura estimada del conductor (mateix model que la calculadora, GUÍA-BT-ANEXO 2):
   * T ≈ T_amb + (T_màx − T_amb)·(I_b / I_z)², amb I_z = I_taula·K_t·K_g
   */
  const estimateThermal = (m: InstallationMethodId): ThermalEstimate => {
    const meth = INSTALLATION_METHODS[m];
    const effPhase: PhaseSystem = m === 'G' ? 'trifasic' : phase;
    const effIns: InsulationType = m === 'D' ? 'XLPE' : insulation;
    const ambient =
      calcContext && INSTALLATION_METHODS[calcContext.method].isBuried === meth.isBuried ? calcContext.ambientTemp : meth.refTemp;
    const tMax = INSULATIONS[effIns].maxTemp;
    const itab = lookupBaseAmpacity(section, material, m, effPhase, effIns).ampacity;
    const kt = getTempCorrectionFactor(ambient, effIns, meth.isBuried);
    const kg = getGroupingFactor(m, calcContext?.groupedCircuits ?? 1).factor;
    if (itab === null || kt <= 0) {
      return { available: false, ambient, tMax, itab, kt, kg, iz: 0, ratio: 0, temp: 0, t: 0 };
    }
    const iz = itab * kt * kg;
    const ratio = ibA / iz;
    const temp = ambient + (tMax - ambient) * ratio * ratio;
    return { available: true, ambient, tMax, itab, kt, kg, iz, ratio, temp, t: (temp - ambient) / (tMax - ambient) };
  };

  const thermal = estimateThermal(selectedMethod);
  const thermalVisual = thermalOn && thermal.available ? thermal.t : null;

  const texturesRef = useRef<{ pe: THREE.Texture; brick: THREE.Texture; wool: THREE.Texture } | null>(null);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Inicialitza el renderer Three.js una sola vegada
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 540;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(...CAMERA_PRESETS.iso.pos);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.4;
    controls.maxDistance = 12;
    controls.target.set(...CAMERA_PRESETS.iso.target);
    controls.autoRotateSpeed = 1.6;
    controlsRef.current = controls;

    // Il·luminació tècnica d'estudi
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    rimLight.position.set(-6, 3, -5);
    scene.add(rimLight);

    // Graella de referència subtil al terra
    const grid = new THREE.GridHelper(12, 24, 0x334155, 0x1e293b);
    grid.position.y = -1.75;
    scene.add(grid);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    sceneGroupRef.current = dynamicGroup;

    texturesRef.current = {
      pe: createPeStripeTexture(),
      brick: createBrickTexture(),
      wool: createMineralWoolTexture(),
    };

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      texturesRef.current?.pe.dispose();
      texturesRef.current?.brick.dispose();
      texturesRef.current?.wool.dispose();
    };
  }, []);

  // Reconstrueix la geometria quan canvia el mètode, sistema, material o cutaway
  useEffect(() => {
    const group = sceneGroupRef.current;
    const textures = texturesRef.current;
    if (!group || !textures) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    const effectivePhase: PhaseSystem = selectedMethod === 'G' ? 'trifasic' : phase;
    const heat =
      thermalVisual === null
        ? null
        : { color: heatColor(thermalVisual), glow: 0.25 + 0.45 * Math.min(thermalVisual, HEAT_MAX_T) };
    const built = buildInstallationScene(selectedMethod, effectivePhase, material, cutaway, textures, activeVariantId, heat);
    group.add(built);
  }, [selectedMethod, phase, material, cutaway, activeVariantId, thermalVisual]);

  const applyCameraPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (cam && ctrl) {
      cam.position.set(...CAMERA_PRESETS[preset].pos);
      ctrl.target.set(...CAMERA_PRESETS[preset].target);
      ctrl.update();
    }
  };

  const info = INSTALLATION_METHODS[selectedMethod];

  // Comparativa d'intensitat admissible per a cable de referència 25 mm² Cu XLPE (3x) en tots els mètodes
  const comparisonBars = useMemo(() => {
    return METHOD_ORDER.map((m) => {
      const amp = lookupBaseAmpacity(25, material, m, 'trifasic', 'XLPE').ampacity ?? 0;
      return { method: m, code: INSTALLATION_METHODS[m].shortCode, amp };
    });
  }, [material]);

  // Mateix I_b i secció en tots els mètodes: com canvia la temperatura del conductor
  const thermalBars = thermalOn
    ? METHOD_ORDER.map((m) => ({ method: m, code: INSTALLATION_METHODS[m].shortCode, est: estimateThermal(m) }))
    : null;

  const maxComparisonAmp = Math.max(...comparisonBars.map((b) => b.amp), 1);

  return (
    <div>
      <div className="section-hero">
        <div>
          <span className="section-eyebrow">
            <Box size={13} /> Visualització interactiva 3D · Tabla 1 &amp; Tabla B
          </span>
          <h1 className="section-title">Tipus d’instal·lacions de la ITC-BT-19 en 3D</h1>
          <p className="section-lead">
            Explora en 3D com es disposen els cables i les canalitzacions en cada mètode de referència (<strong>A1, A2, B1, B2, C, E, F, G i D</strong>) i entén per què la ventilació i l’entorn condicionen la intensitat màxima admissible.
          </p>
        </div>
      </div>

      <div className="viewer-layout">
        {/* Left: 3D Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="canvas-frame">
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Top HUD */}
            <div className="canvas-overlay-top">
              <div className="canvas-hud-pill">
                <span className="mono" style={{ color: '#fbbf24', fontWeight: 800, marginRight: '0.45rem' }}>
                  {info.shortCode}
                </span>
                <span>{info.title}</span>
              </div>
              <div className="canvas-hud-pill" style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Arrossega per girar · Roda per fer zoom
              </div>

              {/* Modalitats del mètode (p. ex. B2: tub superficial o encastat) */}
            {variants && (
              <div className="canvas-variant-bar">
                <span className="canvas-variant-label">Modalitat</span>
                <div className="hud-btn-group">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      className={`hud-btn ${activeVariantId === v.id ? 'active' : ''}`}
                      onClick={() => selectVariant(v.id)}
                      title={v.description}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* Llegenda del mapa tèrmic */}
            {thermalOn && (
              <div className="heat-legend">
                {thermal.available ? (
                  <>
                    <div className="heat-legend-title">
                      <Thermometer size={13} /> T ≈ <strong>{thermal.temp.toFixed(0)} °C</strong>
                      <span style={{ color: thermal.ratio > 1 ? '#f0abfc' : '#94a3b8' }}>
                        {thermal.ratio > 1 ? ' · supera T_màx!' : ` · I_b/I_z = ${(thermal.ratio * 100).toFixed(0)} %`}
                      </span>
                    </div>
                    <div className="heat-legend-bar" style={{ background: HEAT_GRADIENT_CSS }}>
                      <span className="heat-legend-tick" style={{ left: `${(1 / HEAT_MAX_T) * 100}%` }} />
                      <span
                        className="heat-legend-marker"
                        style={{ left: `${(Math.min(thermal.t, HEAT_MAX_T) / HEAT_MAX_T) * 100}%` }}
                      />
                    </div>
                    <div className="heat-legend-scale">
                      <span>{thermal.ambient} °C</span>
                      <span style={{ marginLeft: 'auto', marginRight: `${(1 - 1 / HEAT_MAX_T) * 100 - 6}%` }}>
                        T_màx {thermal.tMax} °C
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="heat-legend-title">
                    <Thermometer size={13} /> Sense valor a la taula per a {ts(section).replace('{,}', ',')} mm² en {info.shortCode}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Controls HUD */}
            <div className="canvas-controls-bar">
              <div className="hud-btn-group">
                {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((p) => (
                  <button
                    key={p}
                    className={`hud-btn ${activePreset === p ? 'active' : ''}`}
                    onClick={() => applyCameraPreset(p)}
                  >
                    {CAMERA_PRESETS[p].label}
                  </button>
                ))}
              </div>

              <div className="hud-btn-group">
                <button
                  className={`hud-btn ${cutaway ? 'active' : ''}`}
                  onClick={() => setCutaway((c) => !c)}
                  title="Transparència / tall en secció per veure l'interior"
                >
                  <Eye size={13} /> Tall / Transparència
                </button>
                <button
                  className={`hud-btn ${autoRotate ? 'active' : ''}`}
                  onClick={() => setAutoRotate((r) => !r)}
                >
                  <RotateCw size={13} /> Gir
                </button>
              </div>
            </div>
          </div>

          {/* Comparativa visual de dissipació tèrmica (o temperatura per mètode si el mapa tèrmic és actiu) */}
          {thermalBars ? (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Thermometer size={17} color="var(--copper)" />
                  Temperatura del conductor segons el mètode (I_b = {ibA.toFixed(1).replace('.', ',')} A · {ts(section).replace('{,}', ',')} mm² · {material})
                </h3>
                <span className="badge badge-slate">Mateixa càrrega, diferent dissipació</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {thermalBars.map(({ method: m, code, est }) => {
                  const isSelected = m === selectedMethod;
                  const pct = est.available ? (Math.min(est.t, HEAT_MAX_T) / HEAT_MAX_T) * 100 : 0;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onSelectMethod(m)}
                      className={`compare-row ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="mono compare-code">{code}</span>
                      <div className="meter-track" style={{ height: 11, position: 'relative' }}>
                        <div className="meter-fill" style={{ width: `${pct}%`, background: `#${heatColor(est.t).getHexString()}` }} />
                        <span className="heat-limit-tick" style={{ left: `${(1 / HEAT_MAX_T) * 100}%` }} title="T_màx" />
                      </div>
                      <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', color: est.available && est.ratio > 1 ? '#c026d3' : undefined }}>
                        {est.available ? `${est.temp.toFixed(0)} °C` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '0.55rem' }}>
                La marca vertical indica T_màx de l’aïllament. «—»: la taula no dona valor per a aquesta secció i mètode.
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Flame size={17} color="var(--copper)" />
                  Impacte del mètode en la intensitat admissible (25 mm² · {material === 'Cu' ? 'Coure' : 'Alumini'} · 3x XLPE)
                </h3>
                <span className="badge badge-slate">40 °C aire / 25 °C terreny</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {comparisonBars.map((b) => {
                  const isSelected = b.method === selectedMethod;
                  const pct = (b.amp / maxComparisonAmp) * 100;
                  return (
                    <button
                      key={b.method}
                      type="button"
                      onClick={() => onSelectMethod(b.method)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '98px 1fr 58px',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.3rem 0.45rem',
                        borderRadius: '7px',
                        border: isSelected ? '1px solid var(--blue)' : '1px solid transparent',
                        background: isSelected ? 'var(--blue-soft)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span className="mono" style={{ fontSize: '0.8rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--blue)' : 'var(--ink)' }}>
                        {b.code}
                      </span>
                      <div className="meter-track" style={{ height: 11 }}>
                        <div
                          className="meter-fill"
                          style={{
                            width: `${pct}%`,
                            background: isSelected
                              ? 'linear-gradient(90deg, #1d4ed8, #3b82f6)'
                              : 'linear-gradient(90deg, #c2591a, #ea580c)',
                          }}
                        />
                      </div>
                      <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'right' }}>
                        {b.amp} A
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Method Selector & Technical Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: '0.7rem' }}>
              <h2 className="card-title">
                <Layers size={17} color="var(--blue)" />
                Selecciona el mètode
              </h2>
            </div>

            <div className="method-grid">
              {METHOD_ORDER.map((m) => {
                const item = INSTALLATION_METHODS[m];
                const isActive = m === selectedMethod;
                return (
                  <button
                    key={m}
                    title={item.title}
                    className={`method-tile ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectMethod(m)}
                  >
                    <div className="method-tile-code">{m}</div>
                    <div className="method-tile-sub">
                      {m === 'D'
                        ? 'Soterrat tub'
                        : m === 'A1'
                          ? 'Tub aïllant (1)'
                          : m === 'A2'
                            ? 'Tub aïllant (M)'
                            : m === 'B1'
                              ? 'Tub obra (1)'
                              : m === 'B2'
                                ? 'Tub obra (M)'
                                : m === 'C'
                                  ? 'Sobre paret'
                                  : m === 'E'
                                    ? 'Safata (M)'
                                    : m === 'F'
                                      ? 'Trèvol (1)'
                                      : 'Separats ≥D'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Opcions visuals del model 3D */}
            <div style={{ marginTop: '0.9rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div className="field-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sliders size={13} /> Configuració del cable en 3D
                </span>
              </div>
              <div className="segmented">
                <button
                  className={`seg-btn ${phase === 'trifasic' || selectedMethod === 'G' ? 'active' : ''}`}
                  onClick={() => setPhase('trifasic')}
                >
                  3x Trifàsic
                </button>
                <button
                  className={`seg-btn ${phase === 'monofasic' && selectedMethod !== 'G' ? 'active' : ''}`}
                  onClick={() => setPhase('monofasic')}
                  disabled={selectedMethod === 'G'}
                >
                  2x Monofàsic
                </button>
              </div>
              <div className="segmented">
                <button
                  className={`seg-btn ${material === 'Cu' ? 'active-copper' : ''}`}
                  onClick={() => setMaterial('Cu')}
                >
                  Ànima de Coure
                </button>
                <button
                  className={`seg-btn ${material === 'Al' ? 'active' : ''}`}
                  onClick={() => setMaterial('Al')}
                >
                  Ànima d’Alumini
                </button>
              </div>
            </div>
          </div>

          {/* Mapa tèrmic del conductor */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: thermalOn ? '0.7rem' : 0 }}>
              <h2 className="card-title">
                <Thermometer size={17} color="var(--copper)" />
                Mapa tèrmic del conductor
              </h2>
              <button
                type="button"
                className={`btn btn-sm ${thermalOn ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setThermalOn((v) => !v)}
                aria-pressed={thermalOn}
              >
                {thermalOn ? 'Activat' : 'Activar'}
              </button>
            </div>

            {!thermalOn && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                Pinta els cables segons la temperatura que assoleixen amb una càrrega donada i compara com dissipa la calor cada mètode.
              </p>
            )}

            {thermalOn && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {calcContext && (
                  <div className="alert alert-blue" style={{ fontSize: '0.78rem', alignItems: 'center' }}>
                    <span style={{ flex: 1 }}>
                      Cas de {calcContext.source === 'calculadora' ? 'la calculadora' : 'l’exercici'}: mètode{' '}
                      <strong>{INSTALLATION_METHODS[calcContext.method].shortCode}</strong>, I_b ={' '}
                      <strong>{calcContext.serviceCurrentA.toFixed(1).replace('.', ',')} A</strong>, S ={' '}
                      <strong>{ts(calcContext.section).replace('{,}', ',')} mm²</strong>
                      {calcContext.groupedCircuits > 1 && `, ${calcContext.groupedCircuits} circuits agrupats`}.
                    </span>
                    {onClearCalcContext && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={onClearCalcContext} title="Treu les dades del càlcul (temperatura i agrupació)">
                        Descartar
                      </button>
                    )}
                  </div>
                )}

                <div className="form-row">
                  <div className="field-group">
                    <label className="field-label" htmlFor="thermal-ib">
                      <span>Intensitat I_b (A)</span>
                    </label>
                    <input
                      id="thermal-ib"
                      type="number"
                      className="input mono"
                      min={0.5}
                      step={0.5}
                      value={Number(ibA.toFixed(2))}
                      onChange={(e) => setIbA(Math.max(0.1, Number(e.target.value) || 0.1))}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="thermal-section">
                      <span>Secció (mm²)</span>
                    </label>
                    <select
                      id="thermal-section"
                      className="select mono"
                      value={section}
                      onChange={(e) => setSection(Number(e.target.value) as StandardSection)}
                    >
                      {STANDARD_SECTIONS.map((sec) => (
                        <option key={sec} value={sec}>
                          {ts(sec).replace('{,}', ',')} mm²
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(20, Math.ceil((thermal.available ? thermal.iz : ibA) * 1.4))}
                  step={0.5}
                  value={ibA}
                  onChange={(e) => setIbA(Number(e.target.value))}
                  aria-label="Intensitat de servei"
                  style={{ width: '100%', accentColor: 'var(--copper)' }}
                />

                <div className="segmented">
                  {(['PVC', 'XLPE'] as InsulationType[]).map((insId) => (
                    <button
                      key={insId}
                      className={`seg-btn ${(selectedMethod === 'D' ? 'XLPE' : insulation) === insId ? 'active' : ''}`}
                      onClick={() => setInsulation(insId)}
                      disabled={selectedMethod === 'D' && insId === 'PVC'}
                    >
                      {INSULATIONS[insId].shortName}
                    </button>
                  ))}
                </div>

                {thermal.available ? (
                  <>
                    <div className="formula-box copper">
                      <Tex block>{String.raw`I_z = I_{\text{taula}}\cdot K_t\cdot K_g`}</Tex>
                      <Tex block>{String.raw`I_z = ${thermal.itab}\cdot ${tn(thermal.kt)}\cdot ${tn(thermal.kg)} = ${tn(thermal.iz, 1)}\ \text{A}`}</Tex>
                      <Tex block>{String.raw`T \approx T_{\text{amb}} + (T_{\text{màx}} - T_{\text{amb}})\left(\dfrac{I_b}{I_z}\right)^{2}`}</Tex>
                      <Tex block>{String.raw`T \approx ${thermal.ambient} + ${thermal.tMax - thermal.ambient}\cdot\left(\dfrac{${tn(ibA, 1)}}{${tn(thermal.iz, 1)}}\right)^{2} = \hl{${tn(thermal.temp, 1)}\ ^{\circ}\text{C}}`}</Tex>
                      <dl className="formula-legend">
                        <dt><Tex>T</Tex></dt>
                        <dd>Temperatura estimada del conductor en servei (°C)</dd>
                        <dt><Tex>{String.raw`T_{\text{amb}}`}</Tex></dt>
                        <dd>Temperatura {INSTALLATION_METHODS[selectedMethod].isBuried ? 'del terreny' : 'de l’aire'}: {thermal.ambient} °C</dd>
                        <dt><Tex>{String.raw`T_{\text{màx}}`}</Tex></dt>
                        <dd>Temperatura màxima admissible de l’aïllament: {thermal.tMax} °C</dd>
                        <dt><Tex>I_z</Tex></dt>
                        <dd>Intensitat admissible del cable en aquest mètode, amb correccions (A)</dd>
                        <dt><Tex>I_b</Tex></dt>
                        <dd>Intensitat que hi circula (A)</dd>
                      </dl>
                    </div>
                    <div className={`alert ${thermal.ratio > 1 ? 'alert-red' : thermal.t > 0.85 ? 'alert-amber' : 'alert-emerald'}`} style={{ fontSize: '0.8rem' }}>
                      <span>
                        {thermal.ratio > 1
                          ? `Sobrecàrrega: I_b supera I_z en un ${((thermal.ratio - 1) * 100).toFixed(0)} %. L’aïllament treballaria per sobre de ${thermal.tMax} °C i s’envelliria ràpidament: cal més secció o un mètode amb millor dissipació.`
                          : `El conductor treballa al ${(thermal.ratio * 100).toFixed(0)} % de la seva capacitat, amb un marge de ${(thermal.tMax - thermal.temp).toFixed(0)} °C fins a T_màx.`}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="alert alert-amber" style={{ fontSize: '0.8rem' }}>
                    <span>
                      La taula no dona intensitat admissible per a {ts(section).replace('{,}', ',')} mm² en el mètode {info.shortCode}
                      {selectedMethod === 'G' ? ' (el mètode G comença a 25 mm²)' : ''}. Tria una altra secció.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detall tècnic del mètode seleccionat */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.55rem' }}>
              <span className="badge badge-blue mono">Mètode {info.shortCode}</span>
              <span className={`badge ${info.dissipationRank >= 6 ? 'badge-emerald' : info.dissipationRank >= 4 ? 'badge-amber' : 'badge-red'}`}>
                Dissipació: {info.dissipationLabel}
              </span>
            </div>

            <h3 style={{ margin: '0 0 0.45rem', fontSize: '1.02rem' }}>{info.title}</h3>
            <p style={{ margin: '0 0 0.8rem', fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
              {info.summary}
            </p>

            {variants && activeVariant && (
              <div style={{ marginBottom: '0.8rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem' }}>
                  Modalitat representada en 3D ({variants.length} disponibles):
                </div>
                <div className="segmented" style={{ flexWrap: 'wrap' }}>
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      className={`seg-btn ${activeVariantId === v.id ? 'active' : ''}`}
                      onClick={() => selectVariant(v.id)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>{activeVariant.description}</p>
              </div>
            )}

            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem' }}>
              Sistemes inclosos (Tabla B · GUÍA-BT-19):
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.81rem', color: 'var(--ink-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {info.examples.map((ex, i) => {
                const variantForExample = variants?.find((v) => v.exampleIndex === i);
                const isShown = variantForExample !== undefined && variantForExample.id === activeVariantId;
                return (
                  <li key={i} style={isShown ? { color: 'var(--blue)', fontWeight: 700 } : undefined}>
                    {variantForExample ? (
                      <button type="button" className="example-link" onClick={() => selectVariant(variantForExample.id)} title="Veure aquesta modalitat en 3D">
                        {ex}
                      </button>
                    ) : (
                      ex
                    )}
                    {isShown && ' ← en 3D'}
                  </li>
                );
              })}
            </ul>

            {info.notes && (
              <div className="alert alert-blue" style={{ marginTop: '0.85rem', fontSize: '0.78rem' }}>
                <span>{info.notes}</span>
              </div>
            )}

            {/* Llegenda de colors del model 3D */}
            <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
              <strong style={{ color: 'var(--ink)' }}>Llegenda 3D:</strong> Marró/Negre/Gris = Fases · Blau = Neutre · Verd-groc = Protecció PE
              {selectedMethod === 'E' && ' · Línia blava = separació ≥ 0,3·D'}
              {selectedMethod === 'F' && ' · Línia blava = separació ≥ D a paret'}
              {selectedMethod === 'G' && ' · Línies verdes = separació ≥ D entre cables'}
              {selectedMethod === 'D' && ' · Línia taronja = profunditat 70 cm · Cinta groga = senyalització'}
              {thermalOn && ' · Mapa tèrmic actiu: el color dels cables indica la temperatura'}
            </div>

            {onCalculateWithMethod && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.85rem', width: '100%', justifyContent: 'center' }}
                onClick={() => onCalculateWithMethod(selectedMethod)}
              >
                <Calculator size={14} /> Calcular una secció amb el mètode {info.shortCode}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, Eye, Flame, Layers, RotateCw, Sliders } from 'lucide-react';
import {
  ConductorMaterial,
  INSTALLATION_METHODS,
  InstallationMethodId,
  METHOD_ORDER,
  PhaseSystem,
  lookupBaseAmpacity,
} from '../data/itcBt19';

interface Installation3DViewerProps {
  selectedMethod: InstallationMethodId;
  onSelectMethod: (method: InstallationMethodId) => void;
}

type CameraPreset = 'iso' | 'section' | 'front' | 'top';

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number]; label: string }> = {
  iso: { pos: [4.6, 3.1, 4.9], target: [0, 0.2, 0], label: 'Isomètrica' },
  section: { pos: [0.3, 0.45, 5.4], target: [0, 0.2, 0], label: 'Tall transversal' },
  front: { pos: [5.4, 0.9, 0.2], target: [0, 0.2, 0], label: 'Lateral' },
  top: { pos: [0.1, 6.2, 1.8], target: [0, 0, 0], label: 'Superior' },
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
  textures: { pe: THREE.Texture; brick: THREE.Texture; wool: THREE.Texture }
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

  if (method === 'A1' || method === 'A2') {
    // Paret tèrmicament aïllant (pladur + llana mineral groga + muntant metàl·lic)
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

    // Llana mineral tèrmica a l'interior
    const woolMat = new THREE.MeshStandardMaterial({
      map: textures.wool,
      roughness: 0.95,
      transparent: true,
      opacity: cutaway ? 0.38 : 0.86,
    });
    const woolTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.05, wallLength - 0.05), woolMat);
    woolTop.position.set(0, 1.05, -0.2);
    root.add(woolTop);

    const woolBottom = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.05, wallLength - 0.05), woolMat);
    woolBottom.position.set(0, -1.05, -0.2);
    root.add(woolBottom);

    const woolSideL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.05, wallLength - 0.05), woolMat);
    woolSideL.position.set(-0.52, 0, -0.2);
    root.add(woolSideL);

    const woolSideR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.05, wallLength - 0.05), woolMat);
    woolSideR.position.set(0.52, 0, -0.2);
    root.add(woolSideR);

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
  } else if (method === 'B1' || method === 'B2') {
    // Paret d'obra de maó + arrebossat gris
    const wallMat = new THREE.MeshStandardMaterial({
      map: textures.brick,
      roughness: 0.85,
      transparent: cutaway,
      opacity: cutaway ? 0.45 : 1,
    });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.1, wallHeight, wallLength), wallMat);
    wall.position.set(-0.75, 0, -0.2);
    wall.receiveShadow = true;
    root.add(wall);

    // Capa de guix/arrebossat frontal
    const plaster = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, wallHeight, wallLength),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9, transparent: cutaway, opacity: cutaway ? 0.3 : 1 })
    );
    plaster.position.set(-0.15, 0, -0.2);
    root.add(plaster);

    if (method === 'B1') {
      // Tub encastat parcialment en regata a la paret d'obra
      const conduit = createConduit(cableLength - 0.4, 0.38, 0x475569, true, cutaway);
      conduit.position.set(-0.12, 0, -0.1);
      root.add(conduit);
      addUnipolarBundle(root, 0.14, 0.075, -0.12, 0);
    } else {
      // B2: Tub rígid en muntatge superficial sobre paret amb abraçadores
      const conduit = createConduit(cableLength - 0.4, 0.36, 0x94a3b8, false, cutaway);
      conduit.position.set(0.29, 0, -0.1);
      root.add(conduit);

      // Abraçadores metàl·liques
      const clampMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.65, roughness: 0.35 });
      [-1.3, 0, 1.3].forEach((z) => {
        const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.04, 10, 24), clampMat);
        clamp.position.set(0.29, 0, z);
        root.add(clamp);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.95, 0.14), clampMat);
        foot.position.set(-0.04, 0, z);
        root.add(foot);
      });

      const cable = createMulticoreCable(cableLength, 0.25, phase, metalMat, textures.pe);
      cable.position.set(0.29, 0, 0.15);
      root.add(cable);
    }
  } else if (method === 'C') {
    // Paret d'obra + cable multiconductor fixat directament a la paret amb grapes
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, wallHeight, wallLength),
      new THREE.MeshStandardMaterial({ map: textures.brick, roughness: 0.85 })
    );
    wall.position.set(-0.85, 0, -0.2);
    wall.receiveShadow = true;
    root.add(wall);

    const plaster = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, wallHeight, wallLength),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.88 })
    );
    plaster.position.set(-0.28, 0, -0.2);
    root.add(plaster);

    const cable = createMulticoreCable(cableLength, 0.3, phase, metalMat, textures.pe);
    cable.position.set(0.09, 0, 0.15);
    root.add(cable);

    // Grapes / abraçadores directes a paret
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.4, metalness: 0.4 });
    [-1.4, -0.2, 1.0].forEach((z) => {
      const clip = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 24, Math.PI * 1.15), clipMat);
      clip.rotation.z = -Math.PI * 0.58;
      clip.position.set(0.09, 0, z);
      root.add(clip);
    });
  } else if (method === 'E' || method === 'F') {
    // Paret posterior + mènsules + safata perforada galvanitzada
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, wallHeight, wallLength),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
    );
    wall.position.set(-1.75, 0, -0.2);
    root.add(wall);

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.72,
      roughness: 0.32,
    });

    // Mènsules suport a paret
    [-1.3, 1.1].forEach((z) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.16), steelMat);
      bracket.position.set(-0.35, -0.45, z);
      root.add(bracket);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.24), steelMat);
      plate.position.set(-1.46, -0.45, z);
      root.add(plate);
    });

    // Safata perforada (base + ales laterals + ranures fosques visibles)
    const trayWidth = 1.65;
    const trayLen = 4.1;
    const trayBase = new THREE.Mesh(new THREE.BoxGeometry(trayWidth, 0.06, trayLen), steelMat);
    trayBase.position.set(0.0, -0.36, -0.15);
    trayBase.receiveShadow = true;
    root.add(trayBase);

    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, trayLen), steelMat);
    sideL.position.set(-trayWidth / 2, -0.18, -0.15);
    root.add(sideL);

    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, trayLen), steelMat);
    sideR.position.set(trayWidth / 2, -0.18, -0.15);
    root.add(sideR);

    // Ranures de ventilació (perforacions) sobre la base de la safata
    const slotMat = new THREE.MeshBasicMaterial({ color: 0x0b1120 });
    for (let zi = -1.7; zi <= 1.5; zi += 0.4) {
      for (let xi = -0.55; xi <= 0.55; xi += 0.36) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.072, 0.16), slotMat);
        slot.position.set(xi, -0.36, zi);
        root.add(slot);
      }
    }

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
      // F: Cables unipolars en contacte mutu (en trèvol per 3x, junts per 2x)
      const r = 0.23;
      if (phase === 'trifasic') {
        const c1 = createWireMesh(cableLength, r, 0x7c4a2d, metalMat, textures.pe);
        c1.position.set(-r, -0.33 + r, 0.15);
        const c2 = createWireMesh(cableLength, r, 0x1f242c, metalMat, textures.pe);
        c2.position.set(r, -0.33 + r, 0.15);
        const c3 = createWireMesh(cableLength, r, 0x94a3b8, metalMat, textures.pe);
        c3.position.set(0, -0.33 + r + r * Math.sqrt(3), 0.15);
        root.add(c1, c2, c3);
      } else {
        const c1 = createWireMesh(cableLength, r, 0x7c4a2d, metalMat, textures.pe);
        c1.position.set(-r, -0.33 + r, 0.15);
        const c2 = createWireMesh(cableLength, r, 0x2563eb, metalMat, textures.pe);
        c2.position.set(r, -0.33 + r, 0.15);
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
    const sandBed = new THREE.Mesh(new THREE.BoxGeometry(trenchW, 1.15, trenchL), sandMat);
    sandBed.position.set(0, -0.35, -0.2);
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

  return root;
}

export const Installation3DViewer: React.FC<Installation3DViewerProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const autoRotateRef = useRef<boolean>(false);

  const [phase, setPhase] = useState<PhaseSystem>('trifasic');
  const [material, setMaterial] = useState<ConductorMaterial>('Cu');
  const [cutaway, setCutaway] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('iso');

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
    const built = buildInstallationScene(selectedMethod, effectivePhase, material, cutaway, textures);
    group.add(built);
  }, [selectedMethod, phase, material, cutaway]);

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
            </div>

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

          {/* Comparativa visual de dissipació tèrmica */}
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

            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem' }}>
              Sistemes inclosos (Tabla B · GUÍA-BT-19):
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.81rem', color: 'var(--ink-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {info.examples.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

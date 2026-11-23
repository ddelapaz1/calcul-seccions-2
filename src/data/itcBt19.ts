export type ConductorMaterial = 'Cu' | 'Al';
export type InsulationType = 'PVC' | 'XLPE';
export type PhaseSystem = 'monofasic' | 'trifasic';
export type InstallationMethodId = 'A1' | 'A2' | 'B1' | 'B2' | 'C' | 'E' | 'F' | 'G' | 'D';

export const STANDARD_SECTIONS = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630,
] as const;

export type StandardSection = (typeof STANDARD_SECTIONS)[number];

export interface MaterialProperties {
  id: ConductorMaterial;
  name: string;
  symbol: string;
  rho20: number; // Ω·mm²/m
  rho70: number;
  rho90: number;
  gamma20: number; // m/(Ω·mm²) — GUÍA-BT-ANEXO 2 Tabla 3
  gamma70: number;
  gamma90: number;
  alpha: number; // °C⁻¹
  minSection: number; // mm² habitual reglamentari
  notes: string;
}

export const MATERIALS: Record<ConductorMaterial, MaterialProperties> = {
  Cu: {
    id: 'Cu',
    name: 'Coure',
    symbol: 'Cu',
    rho20: 0.018,
    rho70: 0.021,
    rho90: 0.023,
    gamma20: 56,
    gamma70: 48,
    gamma90: 44,
    alpha: 0.00392,
    minSection: 1.5,
    notes: 'Obligatori en habitatges i instal·lacions similars (oficines, locals comercials) segons ITC-BT-26.',
  },
  Al: {
    id: 'Al',
    name: 'Alumini',
    symbol: 'Al',
    rho20: 0.029,
    rho70: 0.033,
    rho90: 0.036,
    gamma20: 35,
    gamma70: 30,
    gamma90: 28,
    alpha: 0.00403,
    minSection: 16,
    notes: 'Habitual en instal·lacions industrials i línies d’elevada potència (seccions ≥ 16 mm² a l’aire).',
  },
};

export interface InsulationProperties {
  id: InsulationType;
  name: string;
  shortName: string;
  maxTemp: number; // °C en règim permanent
  shortCircuitTemp: number; // °C (< 5 s)
  examples: string;
}

export const INSULATIONS: Record<InsulationType, InsulationProperties> = {
  PVC: {
    id: 'PVC',
    name: 'Termoplàstic (PVC / Poliolefina Z1)',
    shortName: 'PVC / Z1 (70 °C)',
    maxTemp: 70,
    shortCircuitTemp: 160,
    examples: 'H07V-K, H07Z1-K (AS), ES07Z1-K (450/750 V), VV-K (0,6/1 kV)',
  },
  XLPE: {
    id: 'XLPE',
    name: 'Termoestable (XLPE / EPR)',
    shortName: 'XLPE / EPR (90 °C)',
    maxTemp: 90,
    shortCircuitTemp: 250,
    examples: 'RZ1-K (AS), RV-K, DZ1-K (0,6/1 kV)',
  },
};

export interface VoltageDropPreset {
  id: string;
  label: string;
  maxDropPct: number;
  itcRef: string;
  description: string;
  defaultPhase?: PhaseSystem;
}

export const VOLTAGE_DROP_PRESETS: VoltageDropPreset[] = [
  {
    id: 'habitatge',
    label: 'Circuit interior d’habitatge (3%)',
    maxDropPct: 3,
    itcRef: 'ITC-BT-19 (2.2.2)',
    description: 'Qualsevol circuit interior d’habitatge (enllumenat o força).',
    defaultPhase: 'monofasic',
  },
  {
    id: 'enllumenat',
    label: 'Altres instal·lacions — Enllumenat (3%)',
    maxDropPct: 3,
    itcRef: 'ITC-BT-19 (2.2.2)',
    description: 'Locals comercials, oficines o naus industrials (circuits d’enllumenat).',
  },
  {
    id: 'forca',
    label: 'Altres instal·lacions — Força / Altres usos (5%)',
    maxDropPct: 5,
    itcRef: 'ITC-BT-19 (2.2.2)',
    description: 'Motors, maquinària i preses de força en locals comercials o industrials.',
    defaultPhase: 'trifasic',
  },
  {
    id: 'trafo_enllumenat',
    label: 'Industrial amb transformador propi — Enllumenat (4,5%)',
    maxDropPct: 4.5,
    itcRef: 'ITC-BT-19 (2.2.2)',
    description: 'Origen a la sortida del transformador de distribució propi d’AT.',
  },
  {
    id: 'trafo_forca',
    label: 'Industrial amb transformador propi — Altres usos (6,5%)',
    maxDropPct: 6.5,
    itcRef: 'ITC-BT-19 (2.2.2)',
    description: 'Origen a la sortida del transformador de distribució propi d’AT.',
    defaultPhase: 'trifasic',
  },
  {
    id: 'di_unic',
    label: 'Derivació Individual — Únic usuari (1,5%)',
    maxDropPct: 1.5,
    itcRef: 'ITC-BT-15 / Anexo 2',
    description: 'Subministrament directe des de CPM fins a quadre general.',
  },
  {
    id: 'di_concentrats',
    label: 'Derivació Individual — Comptadors concentrats (1%)',
    maxDropPct: 1,
    itcRef: 'ITC-BT-15 / Anexo 2',
    description: 'Des d’una única centralització de comptadors fins a l’habitatge o local.',
  },
  {
    id: 'lga_concentrats',
    label: 'Línia General d’Alimentació — Comptadors concentrats (0,5%)',
    maxDropPct: 0.5,
    itcRef: 'ITC-BT-14 / Anexo 2',
    description: 'Sempre trifàsica, des de CGP fins a centralització única de comptadors.',
    defaultPhase: 'trifasic',
  },
];

export interface InstallationMethodInfo {
  id: InstallationMethodId;
  shortCode: string;
  table1Code: string;
  title: string;
  summary: string;
  cableKind: 'unipolar' | 'multiconductor' | 'ambdos';
  isBuried: boolean;
  refTemp: number; // °C
  dissipationRank: number; // 1 (pitjor) a 9 (millor)
  dissipationLabel: string;
  groupingRef: 1 | 2 | 3 | 4 | 5 | 'buried';
  examples: string[];
  notes?: string;
}

export const INSTALLATION_METHODS: Record<InstallationMethodId, InstallationMethodInfo> = {
  A1: {
    id: 'A1',
    shortCode: 'A1',
    table1Code: 'A',
    title: 'Conductors aïllats en tub encastat en paret aïllant',
    summary: 'Conductors unipolars dins de tub encastat en parets tèrmicament aïllants (pladur amb llana mineral, fusta, etc.).',
    cableKind: 'unipolar',
    isBuried: false,
    refTemp: 40,
    dissipationRank: 2,
    dissipationLabel: 'Molt baixa',
    groupingRef: 1,
    examples: [
      'Conductors unipolars aïllats en tubs encastats en parets tèrmicament aïllants',
      'Cables multiconductors encastats directament en parets tèrmicament aïllants',
      'Conductors unipolars aïllats en motllures o marcs de portes i finestres',
    ],
  },
  A2: {
    id: 'A2',
    shortCode: 'A2',
    table1Code: 'A2',
    title: 'Cable multiconductor en tub encastat en paret aïllant',
    summary: 'Cable multiconductor (mànega amb coberta) dins d’un tub encastat en una paret tèrmicament aïllant.',
    cableKind: 'multiconductor',
    isBuried: false,
    refTemp: 40,
    dissipationRank: 1,
    dissipationLabel: 'La més baixa',
    groupingRef: 1,
    examples: [
      'Cables multiconductors en tubs encastats en parets tèrmicament aïllants',
    ],
    notes: 'La doble barrera (coberta del cable + aire dins del tub + aïllament tèrmic de la paret) dificulta al màxim la dissipació de calor.',
  },
  B1: {
    id: 'B1',
    shortCode: 'B1',
    table1Code: 'B',
    title: 'Conductors aïllats en tub (superficial o encastat en obra)',
    summary: 'El mètode més habitual en habitatges i edificis: conductors unipolars en tub encastat en paret d’obra o en muntatge superficial.',
    cableKind: 'unipolar',
    isBuried: false,
    refTemp: 40,
    dissipationRank: 4,
    dissipationLabel: 'Mitjana',
    groupingRef: 1,
    examples: [
      'Conductors aïllats o cable unipolar en tubs encastats en obra de fàbrica',
      'Conductors aïllats en tub en muntatge superficial sobre paret (distància < 0,3 D)',
      'Conductors unipolars en canals protectores, canaletes o sòcols acanalats',
      'Cables unipolars en falsos sostres, terres tècnics o buits d’obra',
    ],
  },
  B2: {
    id: 'B2',
    shortCode: 'B2',
    table1Code: 'B2',
    title: 'Cable multiconductor en tub (superficial o encastat en obra)',
    summary: 'Cable multiconductor (mànega) allotjat en tub o canal protectora, tant encastat en obra com en muntatge superficial.',
    cableKind: 'multiconductor',
    isBuried: false,
    refTemp: 40,
    dissipationRank: 3,
    dissipationLabel: 'Baixa-mitjana',
    groupingRef: 1,
    examples: [
      'Cables multiconductors en tubs encastats en obra',
      'Cables multiconductors en tubs sobre paret o separats < 0,3 vegades el diàmetre del tub',
      'Cables multiconductors en canal protectora suspesa, encastada o sobre paret',
    ],
  },
  C: {
    id: 'C',
    shortCode: 'C',
    table1Code: 'C',
    title: 'Cables directament sobre paret o safata no perforada',
    summary: 'Cables multiconductors o unipolars fixats directament sobre paret/sostre o instal·lats sobre safata no perforada.',
    cableKind: 'multiconductor',
    isBuried: false,
    refTemp: 40,
    dissipationRank: 5,
    dissipationLabel: 'Bona',
    groupingRef: 2,
    examples: [
      'Cables unipolars o multiconductors sobre safates no perforades',
      'Cables fixats directament a la paret o sostre (o espaiats < 0,3 D)',
      'Cables encastats directament en parets d’obra (sense tub)',
    ],
  },
  E: {
    id: 'E',
    shortCode: 'E',
    table1Code: 'E',
    title: 'Cable multiconductor a l’aire lliure o safata perforada',
    summary: 'Cables multiconductors ventilats sobre safata perforada, de reixeta, d’escala o separats de la paret ≥ 0,3·D.',
    cableKind: 'multiconductor',
    isBuried: false,
    refTemp: 40,
    dissipationRank: 6,
    dissipationLabel: 'Alta',
    groupingRef: 4,
    examples: [
      'Cables multiconductors separats de la paret una distància ≥ 0,3·D',
      'Cables multiconductors sobre safates perforades (horitzontal o vertical)',
      'Cables multiconductors sobre safates de reixeta, d’escala o cable fiador',
    ],
  },
  F: {
    id: 'F',
    shortCode: 'F',
    table1Code: 'F',
    title: 'Cables unipolars en contacte mutu (aire / safata perforada)',
    summary: 'Cables unipolars en contacte entre si (en trèvol o pla) sobre safata perforada o separats de la paret ≥ D.',
    cableKind: 'unipolar',
    isBuried: false,
    refTemp: 40,
    dissipationRank: 7,
    dissipationLabel: 'Molt alta',
    groupingRef: 4,
    examples: [
      'Cables unipolars en contacte mutu separats de la paret una distància ≥ D',
      'Mateixos sistemes que el tipus E (safata perforada/reixeta/escala) per a cables unipolars (> 25 mm² en Taula 1)',
    ],
    notes: 'En la Tabla A de la GUÍA-BT-19 admet seccions des de 1,5 mm² (o ≥ 25 mm² per 2x XLPE / Tabla 1).',
  },
  G: {
    id: 'G',
    shortCode: 'G',
    table1Code: 'G',
    title: 'Cables unipolars separats mínim D a l’aire lliure',
    summary: 'Cables unipolars separats entre si almenys un diàmetre (≥ D) a l’aire lliure: màxima dissipació tèrmica (seccions ≥ 25 mm²).',
    cableKind: 'unipolar',
    isBuried: false,
    refTemp: 40,
    dissipationRank: 9,
    dissipationLabel: 'Òptima (màxima)',
    groupingRef: 5,
    examples: [
      'Cables unipolars (trifàsics) separats entre si com a mínim un diàmetre exterior D',
      'Instal·lacions industrials d’alta intensitat sobre suports o abraçadores espaiades',
    ],
    notes: 'Contemplat a la Tabla 1 de la ITC-BT-19 per a circuits trifàsics (3x) a partir de 25 mm² fins a 300 mm².',
  },
  D: {
    id: 'D',
    shortCode: 'D (Soterrat)',
    table1Code: 'Tabla D',
    title: 'Cables soterrats sota tub (0,6/1 kV, XLPE)',
    summary: 'Cables 0,6/1 kV amb aïllament XLPE dins de tub soterrat a 70 cm de profunditat (terreny 25 °C, 1,5 K·m/W).',
    cableKind: 'ambdos',
    isBuried: true,
    refTemp: 25,
    dissipationRank: 8,
    dissipationLabel: 'Alta (terreny 25 °C)',
    groupingRef: 'buried',
    examples: [
      'Línies generals d’alimentació (LGA) o derivacions individuals en tub enterrat',
      'Enllaços exteriors entre edificis o naus industrials a 70 cm de profunditat',
    ],
    notes: 'Tabla D de la GUÍA-BT-19 (aïllament termoestable XLPE 0,6/1 kV). No s’instal·larà més d’un circuit per tub.',
  },
};

export const METHOD_ORDER: InstallationMethodId[] = ['A2', 'A1', 'B2', 'B1', 'C', 'E', 'F', 'G', 'D'];

/**
 * Mapping de (mètode, sistema, aïllament) -> número de columna a la Tabla A (2..13) de GUÍA-BT-19.
 * 3x = trifàsic (3 conductors carregats), 2x = monofàsic (2 conductors carregats).
 */
export const TABLE_A_COLUMN_MAP: Record<
  Exclude<InstallationMethodId, 'G' | 'D'>,
  Record<PhaseSystem, Record<InsulationType, number>>
> = {
  A1: {
    trifasic: { PVC: 3, XLPE: 6 },
    monofasic: { PVC: 4, XLPE: 7 },
  },
  A2: {
    trifasic: { PVC: 2, XLPE: 5 },
    monofasic: { PVC: 3, XLPE: 6 },
  },
  B1: {
    trifasic: { PVC: 5, XLPE: 8 },
    monofasic: { PVC: 6, XLPE: 10 },
  },
  B2: {
    trifasic: { PVC: 4, XLPE: 7 },
    monofasic: { PVC: 5, XLPE: 8 },
  },
  C: {
    trifasic: { PVC: 6, XLPE: 9 },
    monofasic: { PVC: 8, XLPE: 11 },
  },
  E: {
    trifasic: { PVC: 7, XLPE: 10 },
    monofasic: { PVC: 9, XLPE: 12 },
  },
  F: {
    trifasic: { PVC: 8, XLPE: 11 },
    monofasic: { PVC: 10, XLPE: 13 },
  },
};

/**
 * Tabla A (GUÍA-BT-19 pàg. 9, UNE 20460-5-523:2004 Tabla A.52-1bis)
 * Intensitats màximes admissibles (A) per a COURE, no enterrats, 40 °C a l'aire.
 * Columnes 2 a 13.
 * Nota: per a 400 mm² col 9, el PDF ministerial imprimeix 699 (errata coneguda per 599; aquí s'usa 599 per coherència física amb col 8=552 i col 10=645).
 */
export const TABLE_A_COPPER: Record<StandardSection, Record<number, number | null>> = {
  1.5: { 2: 11, 3: 11.5, 4: 13, 5: 13.5, 6: 15, 7: 16, 8: 16.5, 9: 19, 10: 20, 11: 21, 12: 24, 13: null },
  2.5: { 2: 15, 3: 16, 4: 17.5, 5: 18.5, 6: 21, 7: 22, 8: 23, 9: 26, 10: 26.5, 11: 29, 12: 33, 13: null },
  4: { 2: 20, 3: 21, 4: 23, 5: 24, 6: 27, 7: 30, 8: 31, 9: 34, 10: 36, 11: 38, 12: 45, 13: null },
  6: { 2: 25, 3: 27, 4: 30, 5: 32, 6: 36, 7: 37, 8: 40, 9: 44, 10: 46, 11: 49, 12: 57, 13: null },
  10: { 2: 34, 3: 37, 4: 40, 5: 44, 6: 50, 7: 52, 8: 54, 9: 60, 10: 65, 11: 68, 12: 76, 13: null },
  16: { 2: 45, 3: 49, 4: 54, 5: 59, 6: 66, 7: 70, 8: 73, 9: 81, 10: 87, 11: 91, 12: 105, 13: null },
  25: { 2: 59, 3: 64, 4: 70, 5: 77, 6: 84, 7: 88, 8: 95, 9: 103, 10: 110, 11: 116, 12: 123, 13: 140 },
  35: { 2: null, 3: 77, 4: 86, 5: 96, 6: 104, 7: 110, 8: 119, 9: 127, 10: 137, 11: 144, 12: 154, 13: 174 },
  50: { 2: null, 3: 94, 4: 103, 5: 117, 6: 125, 7: 133, 8: 145, 9: 155, 10: 167, 11: 175, 12: 188, 13: 210 },
  70: { 2: null, 3: null, 4: null, 5: 149, 6: 160, 7: 171, 8: 185, 9: 199, 10: 214, 11: 224, 12: 244, 13: 269 },
  95: { 2: null, 3: null, 4: null, 5: 180, 6: 194, 7: 207, 8: 224, 9: 241, 10: 259, 11: 271, 12: 296, 13: 327 },
  120: { 2: null, 3: null, 4: null, 5: 208, 6: 225, 7: 240, 8: 260, 9: 280, 10: 301, 11: 314, 12: 348, 13: 380 },
  150: { 2: null, 3: null, 4: null, 5: 236, 6: 260, 7: 278, 8: 299, 9: 322, 10: 343, 11: 363, 12: 404, 13: 438 },
  185: { 2: null, 3: null, 4: null, 5: 268, 6: 297, 7: 317, 8: 341, 9: 368, 10: 391, 11: 415, 12: 464, 13: 500 },
  240: { 2: null, 3: null, 4: null, 5: 315, 6: 350, 7: 374, 8: 401, 9: 435, 10: 468, 11: 490, 12: 552, 13: 590 },
  300: { 2: null, 3: null, 4: null, 5: 361, 6: 401, 7: 430, 8: 461, 9: 500, 10: 538, 11: 563, 12: 638, 13: 678 },
  400: { 2: null, 3: null, 4: null, 5: 431, 6: 480, 7: 515, 8: 552, 9: 599, 10: 645, 11: 674, 12: 770, 13: 812 },
  500: { 2: null, 3: null, 4: null, 5: 493, 6: 551, 7: 592, 8: 633, 9: 687, 10: 741, 11: 774, 12: 889, 13: 931 },
  630: { 2: null, 3: null, 4: null, 5: 565, 6: 632, 7: 681, 8: 728, 9: 790, 10: 853, 11: 890, 12: 1028, 13: 1071 },
};

/**
 * Tabla A.52-1bis (UNE 20460-5-523:2004 / IEC 60364-5-52)
 * Intensitats màximes admissibles (A) per a ALUMINI, no enterrats, 40 °C a l'aire.
 * Seccions normalitzades d'alumini a partir de 16 mm² (fins a 630 mm²).
 */
export const TABLE_A_ALUMINIUM: Partial<Record<StandardSection, Record<number, number | null>>> = {
  16: { 2: 36, 3: 38, 4: 42, 5: 46, 6: 51, 7: 55, 8: 57, 9: 63, 10: 66, 11: 71, 12: 81, 13: null },
  25: { 2: 46, 3: 50, 4: 54, 5: 61, 6: 64, 7: 69, 8: 72, 9: 78, 10: 84, 11: 90, 12: 96, 13: 109 },
  35: { 2: null, 3: 61, 4: 67, 5: 75, 6: 78, 7: 86, 8: 89, 9: 97, 10: 104, 11: 109, 12: 120, 13: 136 },
  50: { 2: null, 3: 74, 4: 81, 5: 90, 6: 96, 7: 104, 8: 110, 9: 118, 10: 127, 11: 134, 12: 147, 13: 164 },
  70: { 2: null, 3: null, 4: null, 5: 115, 6: 125, 7: 133, 8: 143, 9: 153, 10: 165, 11: 174, 12: 190, 13: 210 },
  95: { 2: null, 3: null, 4: null, 5: 139, 6: 152, 7: 161, 8: 174, 9: 186, 10: 201, 11: 212, 12: 231, 13: 255 },
  120: { 2: null, 3: null, 4: null, 5: 161, 6: 176, 7: 187, 8: 201, 9: 215, 10: 233, 11: 246, 12: 271, 13: 296 },
  150: { 2: null, 3: null, 4: null, 5: 184, 6: 203, 7: 217, 8: 233, 9: 251, 10: 268, 11: 283, 12: 315, 13: 342 },
  185: { 2: null, 3: null, 4: null, 5: 209, 6: 232, 7: 247, 8: 266, 9: 287, 10: 305, 11: 324, 12: 362, 13: 390 },
  240: { 2: null, 3: null, 4: null, 5: 246, 6: 273, 7: 292, 8: 313, 9: 339, 10: 365, 11: 382, 12: 431, 13: 460 },
  300: { 2: null, 3: null, 4: null, 5: 282, 6: 313, 7: 335, 8: 360, 9: 390, 10: 420, 11: 439, 12: 498, 13: 529 },
  400: { 2: null, 3: null, 4: null, 5: 336, 6: 374, 7: 402, 8: 431, 9: 467, 10: 503, 11: 526, 12: 601, 13: 633 },
  500: { 2: null, 3: null, 4: null, 5: 385, 6: 430, 7: 462, 8: 494, 9: 536, 10: 578, 11: 604, 12: 693, 13: 726 },
  630: { 2: null, 3: null, 4: null, 5: 441, 6: 493, 7: 531, 8: 568, 9: 616, 10: 665, 11: 694, 12: 802, 13: 835 },
};

/**
 * Mètode G (Tabla 1 de la ITC-BT-19, columnes 9 i 11 — cables unipolars separats mínim D, 3x).
 * Per a alumini s'aplica l'equivalència normalitzada (≈ 0,78 · I_Cu).
 */
export const TABLE_G_COPPER: Partial<Record<StandardSection, { PVC: number; XLPE: number }>> = {
  25: { PVC: 116, XLPE: 166 },
  35: { PVC: 144, XLPE: 206 },
  50: { PVC: 175, XLPE: 250 },
  70: { PVC: 224, XLPE: 321 },
  95: { PVC: 271, XLPE: 391 },
  120: { PVC: 314, XLPE: 455 },
  150: { PVC: 363, XLPE: 525 },
  185: { PVC: 415, XLPE: 601 },
  240: { PVC: 490, XLPE: 711 },
  300: { PVC: 565, XLPE: 821 },
};

export const TABLE_G_ALUMINIUM: Partial<Record<StandardSection, { PVC: number; XLPE: number }>> = {
  25: { PVC: 90, XLPE: 129 },
  35: { PVC: 112, XLPE: 161 },
  50: { PVC: 137, XLPE: 195 },
  70: { PVC: 175, XLPE: 250 },
  95: { PVC: 211, XLPE: 305 },
  120: { PVC: 245, XLPE: 355 },
  150: { PVC: 283, XLPE: 410 },
  185: { PVC: 324, XLPE: 469 },
  240: { PVC: 382, XLPE: 555 },
  300: { PVC: 441, XLPE: 640 },
};

/**
 * Tabla D (GUÍA-BT-19 pàg. 12) — Cables soterrats sota tub (0,6/1 kV, XLPE).
 * Resistivitat tèrmica del terreny 1,5 K·m/W, temperatura del terreny 25 °C, profunditat 70 cm.
 */
export interface TableDRow {
  trifasicCu: number | null;
  trifasicAl: number | null;
  monofasicCu: number | null;
  monofasicAl: number | null;
}

export const TABLE_D_BURIED: Record<StandardSection, TableDRow> = {
  1.5: { trifasicCu: 23, trifasicAl: null, monofasicCu: 27, monofasicAl: null },
  2.5: { trifasicCu: 30, trifasicAl: 23, monofasicCu: 36, monofasicAl: 27 },
  4: { trifasicCu: 39, trifasicAl: 30, monofasicCu: 46, monofasicAl: 36 },
  6: { trifasicCu: 48, trifasicAl: 37, monofasicCu: 58, monofasicAl: 44 },
  10: { trifasicCu: 64, trifasicAl: 49, monofasicCu: 77, monofasicAl: 58 },
  16: { trifasicCu: 82, trifasicAl: 62, monofasicCu: 100, monofasicAl: 77 },
  25: { trifasicCu: 105, trifasicAl: 82, monofasicCu: 130, monofasicAl: 98 },
  35: { trifasicCu: 130, trifasicAl: 98, monofasicCu: 155, monofasicAl: 120 },
  50: { trifasicCu: 155, trifasicAl: 115, monofasicCu: 183, monofasicAl: 139 },
  70: { trifasicCu: 190, trifasicAl: 145, monofasicCu: 225, monofasicAl: 170 },
  95: { trifasicCu: 225, trifasicAl: 175, monofasicCu: 265, monofasicAl: 205 },
  120: { trifasicCu: 260, trifasicAl: 200, monofasicCu: 305, monofasicAl: 230 },
  150: { trifasicCu: 300, trifasicAl: 230, monofasicCu: 340, monofasicAl: 265 },
  185: { trifasicCu: 335, trifasicAl: 260, monofasicCu: 385, monofasicAl: 295 },
  240: { trifasicCu: 400, trifasicAl: 305, monofasicCu: 440, monofasicAl: 340 },
  300: { trifasicCu: 455, trifasicAl: 350, monofasicCu: 500, monofasicAl: 385 },
  400: { trifasicCu: 530, trifasicAl: 405, monofasicCu: 570, monofasicAl: 445 },
  500: { trifasicCu: 610, trifasicAl: 465, monofasicCu: 660, monofasicAl: 510 },
  630: { trifasicCu: 710, trifasicAl: 530, monofasicCu: 735, monofasicAl: 575 },
};

/**
 * Tabla E (GUÍA-BT-19 pàg. 13, UNE 20460-5-523:2004 Tabla A.52-3)
 * Factors de reducció per agrupament de circuits contigus (no enterrats).
 */
export const GROUPING_COUNTS_AIR = [1, 2, 3, 4, 6, 9, 12, 16, 20] as const;

export const TABLE_E_GROUPING: Record<1 | 2 | 3 | 4 | 5, { label: string; factors: Record<number, number> }> = {
  1: {
    label: 'Encastats o embutits (A1, A2, B1, B2)',
    factors: { 1: 1.0, 2: 0.8, 3: 0.7, 4: 0.7, 6: 0.55, 9: 0.5, 12: 0.45, 16: 0.4, 20: 0.4 },
  },
  2: {
    label: 'Capa única sobre paret, terra o safata no perforada (C)',
    factors: { 1: 1.0, 2: 0.85, 3: 0.8, 4: 0.75, 6: 0.7, 9: 0.7, 12: 0.7, 16: 0.7, 20: 0.7 },
  },
  3: {
    label: 'Capa única fixada sota sostre',
    factors: { 1: 0.95, 2: 0.8, 3: 0.7, 4: 0.7, 6: 0.65, 9: 0.6, 12: 0.6, 16: 0.6, 20: 0.6 },
  },
  4: {
    label: 'Capa única en safata perforada vertical o horitzontal (E, F)',
    factors: { 1: 1.0, 2: 0.9, 3: 0.8, 4: 0.75, 6: 0.75, 9: 0.7, 12: 0.7, 16: 0.7, 20: 0.7 },
  },
  5: {
    label: 'Capa única sobre safata d’escala o abraçadores (G)',
    factors: { 1: 1.0, 2: 0.85, 3: 0.8, 4: 0.8, 6: 0.8, 9: 0.8, 12: 0.8, 16: 0.8, 20: 0.8 },
  },
};

/**
 * Tabla H (GUÍA-BT-19 pàg. 14) — Factors de reducció per a tubs enterrats en contacte (un cable per tub).
 */
export const TABLE_H_BURIED_CONTACT: Record<number, number> = {
  1: 1.0,
  2: 0.85,
  3: 0.75,
  4: 0.7,
  5: 0.65,
  6: 0.6,
};

export const TABLE_C_SOIL_RESISTIVITY = [
  { resistivity: 0.4, description: 'Inundat' },
  { resistivity: 0.5, description: 'Molt humit' },
  { resistivity: 0.7, description: 'Humit' },
  { resistivity: 0.85, description: 'Poc humit' },
  { resistivity: 1.0, description: 'Sec' },
  { resistivity: 1.2, description: 'Argilós molt sec' },
  { resistivity: 1.5, description: 'Arenós molt sec (referència Tabla D)' },
  { resistivity: 2.0, description: 'De pedra arenisca' },
  { resistivity: 2.5, description: 'De pedra calcària (ref. A-52-2 bis)' },
  { resistivity: 3.0, description: 'De pedra granítica' },
];

export const CONDUCTOR_COLORS = [
  { role: 'Fase L1', colorName: 'Marró', hex: '#7c4a2d', textLight: true, note: 'Trifàsica i monofàsica' },
  { role: 'Fase L2', colorName: 'Negre', hex: '#1e242b', textLight: true, note: 'Trifàsica i monofàsica' },
  { role: 'Fase L3', colorName: 'Gris', hex: '#94a3b8', textLight: false, note: 'Trifàsica (3 fases)' },
  { role: 'Neutre (N)', colorName: 'Blau clar', hex: '#2563eb', textLight: true, note: 'Obligatori quan existeix neutre' },
  { role: 'Protecció (PE)', colorName: 'Verd-groc', hex: '#16a34a', stripeHex: '#facc15', textLight: false, note: 'Exclusiu per a protecció' },
];

/**
 * Consulta la intensitat màxima admissible nominal (sense factors de correcció) en A.
 */
export function lookupBaseAmpacity(
  section: StandardSection,
  material: ConductorMaterial,
  method: InstallationMethodId,
  phase: PhaseSystem,
  insulation: InsulationType
): { ampacity: number | null; sourceTable: string; columnLabel: string } {
  if (method === 'D') {
    const row = TABLE_D_BURIED[section];
    const key =
      phase === 'trifasic'
        ? material === 'Cu'
          ? 'trifasicCu'
          : 'trifasicAl'
        : material === 'Cu'
          ? 'monofasicCu'
          : 'monofasicAl';
    return {
      ampacity: row ? row[key] : null,
      sourceTable: 'Tabla D (GUÍA-BT-19 — Soterrat sota tub, XLPE, 25 °C)',
      columnLabel: `${phase === 'trifasic' ? '3' : '2'} XLPE · ${material === 'Cu' ? 'Coure' : 'Alumini'}`,
    };
  }

  if (method === 'G') {
    const table = material === 'Cu' ? TABLE_G_COPPER : TABLE_G_ALUMINIUM;
    const row = table[section];
    return {
      ampacity: row ? row[insulation] : null,
      sourceTable:
        material === 'Cu'
          ? 'Tabla 1 (ITC-BT-19 — Mètode G, 40 °C)'
          : 'UNE 20460-5-523 — Mètode G Alumini (40 °C)',
      columnLabel: `Col. ${insulation === 'PVC' ? '9 (3x PVC)' : '11 (3x XLPE/EPR)'}`,
    };
  }

  const col = TABLE_A_COLUMN_MAP[method][phase][insulation];
  const table = material === 'Cu' ? TABLE_A_COPPER : TABLE_A_ALUMINIUM;
  const row = table[section];
  return {
    ampacity: row ? (row[col] ?? null) : null,
    sourceTable:
      material === 'Cu'
        ? 'Tabla A (GUÍA-BT-19 / UNE 20460-5-523:2004, Coure 40 °C)'
        : 'Tabla A.52-1 bis (UNE 20460-5-523:2004, Alumini 40 °C)',
    columnLabel: `Columna ${col} (${method} · ${phase === 'trifasic' ? '3x' : '2x'} ${insulation})`,
  };
}

/**
 * Factor de correcció per temperatura ambient (respecte a la temperatura de referència de la taula:
 * 40 °C a l'aire o 25 °C en terreny).
 */
export function getTempCorrectionFactor(
  ambientTemp: number,
  insulation: InsulationType,
  isBuried: boolean
): number {
  const maxTemp = isBuried ? 90 : INSULATIONS[insulation].maxTemp;
  const refTemp = isBuried ? 25 : 40;
  if (ambientTemp === refTemp) return 1.0;
  if (ambientTemp >= maxTemp) return 0;
  const raw = Math.sqrt((maxTemp - ambientTemp) / (maxTemp - refTemp));
  return Math.round(raw * 100) / 100;
}

/**
 * Factor de reducció per agrupament de circuits segons Tabla E (aire) o Tabla H (soterrat en contacte).
 */
export function getGroupingFactor(
  method: InstallationMethodId,
  circuitCount: number
): { factor: number; sourceTable: string } {
  const n = Math.max(1, Math.round(circuitCount));
  if (n === 1) {
    return { factor: 1.0, sourceTable: 'Sense agrupació (1 circuit)' };
  }
  const ref = INSTALLATION_METHODS[method].groupingRef;
  if (ref === 'buried') {
    const clamped = Math.min(6, n);
    return {
      factor: TABLE_H_BURIED_CONTACT[clamped] ?? 0.6,
      sourceTable: `Tabla H (GUÍA-BT-19 — ${clamped} tubs enterrats en contacte)`,
    };
  }
  const tableRow = TABLE_E_GROUPING[ref];
  // Si el nombre exacte no és a la taula, s'agafa el valor immediatament superior (més conservador)
  const keys = Object.keys(tableRow.factors)
    .map(Number)
    .sort((a, b) => a - b);
  const matchedKey = keys.find((k) => k >= n) ?? keys[keys.length - 1];
  return {
    factor: tableRow.factors[matchedKey],
    sourceTable: `Tabla E Ref. ${ref} (GUÍA-BT-19 — ${n} circuits)`,
  };
}

/**
 * Secció mínima del conductor de protecció (PE) segons ITC-BT-19 Tabla 2 (mateix metall).
 */
export function calculateProtectiveSection(phaseSection: StandardSection): StandardSection {
  if (phaseSection <= 16) return phaseSection;
  if (phaseSection <= 35) return 16;
  const half = phaseSection / 2;
  const next = STANDARD_SECTIONS.find((s) => s >= half);
  return next ?? 300;
}

export function getNextStandardSection(minArea: number, minAllowed = 1.5): StandardSection | null {
  const target = Math.max(minArea, minAllowed);
  const found = STANDARD_SECTIONS.find((s) => s >= target - 1e-9);
  return found ?? null;
}

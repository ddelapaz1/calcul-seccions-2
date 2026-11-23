import {
  ConductorMaterial,
  INSTALLATION_METHODS,
  InstallationMethodId,
  InsulationType,
  PhaseSystem,
  StandardSection,
} from '../data/itcBt19';
import { CalculationInput, CalculationResult, calculateConductorSection } from './calculator';

export type ExerciseDifficulty = 'basic' | 'intermedi' | 'avancat';

export interface GeneratedExercise {
  id: string;
  difficulty: ExerciseDifficulty;
  title: string;
  statement: string;
  contextBadge: string;
  input: CalculationInput;
  solution: CalculationResult;
}

export interface StudentAnswers {
  serviceCurrentA: string;
  sectionByAmpacity: string;
  theoreticalSectionByDrop: string;
  finalSection: string;
  protectiveSection: string;
}

export interface FieldCheckResult {
  field: keyof StudentAnswers;
  label: string;
  correct: boolean;
  expectedDisplay: string;
  userValue: string;
  feedback: string;
}

export interface ExerciseGrade {
  allCorrect: boolean;
  score: number;
  total: number;
  fields: FieldCheckResult[];
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface ScenarioTemplate {
  title: string;
  contextBadge: string;
  phase: PhaseSystem;
  materials: ConductorMaterial[];
  insulations: InsulationType[];
  methods: InstallationMethodId[];
  powerRangeKw: [number, number];
  powerStepKw: number;
  lengthRangeM: [number, number];
  cosPhiOptions: number[];
  maxDropPct: number;
  allowGrouping: boolean;
  allowCustomTemp: boolean;
  describe: (pKw: number, len: number, method: InstallationMethodId, mat: ConductorMaterial, ins: InsulationType) => string;
}

const SCENARIOS: ScenarioTemplate[] = [
  {
    title: 'Circuit interior d’habitatge',
    contextBadge: 'Habitatge · 3%',
    phase: 'monofasic',
    materials: ['Cu'],
    insulations: ['PVC', 'XLPE'],
    methods: ['B1', 'A1', 'B2'],
    powerRangeKw: [2.2, 5.75],
    powerStepKw: 0.25,
    lengthRangeM: [12, 35],
    cosPhiOptions: [1.0, 0.9, 0.95],
    maxDropPct: 3,
    allowGrouping: true,
    allowCustomTemp: false,
    describe: (p, l, m, _mat, ins) =>
      `Es vol dimensionar un circuit interior monofàsic d’un habitatge (230 V) per alimentar una càrrega de ${p} kW a una distància de ${l} m, amb cable de coure i aïllament ${ins} instal·lat mitjançant el mètode ${m} (${INSTALLATION_METHODS[m].title.toLowerCase()}).`,
  },
  {
    title: 'Línia d’enllumenat en local comercial',
    contextBadge: 'Enllumenat · 3%',
    phase: 'trifasic',
    materials: ['Cu'],
    insulations: ['PVC', 'XLPE'],
    methods: ['B1', 'B2', 'C', 'E'],
    powerRangeKw: [6, 22],
    powerStepKw: 1,
    lengthRangeM: [20, 65],
    cosPhiOptions: [0.9, 0.95, 1.0],
    maxDropPct: 3,
    allowGrouping: true,
    allowCustomTemp: true,
    describe: (p, l, m, _mat, ins) =>
      `Calcula la secció d’una línia trifàsica (400 V) d’enllumenat d’un local comercial de ${p} kW i ${l} m de longitud, amb conductors de coure amb aïllament ${ins} i muntatge tipus ${m}.`,
  },
  {
    title: 'Línia de força en nau industrial (Coure o Alumini)',
    contextBadge: 'Força industrial · 5%',
    phase: 'trifasic',
    materials: ['Cu', 'Al'],
    insulations: ['XLPE', 'PVC'],
    methods: ['B1', 'B2', 'C', 'E', 'F'],
    powerRangeKw: [18, 95],
    powerStepKw: 2,
    lengthRangeM: [25, 110],
    cosPhiOptions: [0.8, 0.85, 0.9],
    maxDropPct: 5,
    allowGrouping: true,
    allowCustomTemp: true,
    describe: (p, l, m, mat, ins) =>
      `Una nau industrial necessita alimentar un quadre de força trifàsic (400 V) de ${p} kW situat a ${l} m del quadre general. S’utilitzen conductors d’${mat === 'Al' ? 'alumini' : 'coure'} amb aïllament ${ins} instal·lats segons el mètode ${m}.`,
  },
  {
    title: 'Alimentació industrial amb transformador propi',
    contextBadge: 'Trafo propi · 6,5%',
    phase: 'trifasic',
    materials: ['Al', 'Cu'],
    insulations: ['XLPE'],
    methods: ['E', 'F', 'C', 'B2'],
    powerRangeKw: [45, 160],
    powerStepKw: 5,
    lengthRangeM: [35, 140],
    cosPhiOptions: [0.85, 0.9],
    maxDropPct: 6.5,
    allowGrouping: true,
    allowCustomTemp: true,
    describe: (p, l, m, mat, ins) =>
      `Des de la sortida del transformador propi d’una indústria (400 V trifàsic) s’alimenta una línia de força de ${p} kW i ${l} m de longitud amb cable d’${mat === 'Al' ? 'alumini' : 'coure'} ${ins} en muntatge tipus ${m}.`,
  },
  {
    title: 'Derivació Individual (comptadors concentrats)',
    contextBadge: 'DI · 1%',
    phase: 'monofasic',
    materials: ['Cu'],
    insulations: ['PVC', 'XLPE'],
    methods: ['B1', 'B2'],
    powerRangeKw: [5.75, 9.2],
    powerStepKw: 1.15,
    lengthRangeM: [10, 32],
    cosPhiOptions: [1.0],
    maxDropPct: 1,
    allowGrouping: false,
    allowCustomTemp: false,
    describe: (p, l, m, _mat, ins) =>
      `Dimensiona la derivació individual monofàsica (230 V) per a un habitatge amb previsió de ${p} kW i ${l} m de recorregut des d’una centralització única de comptadors, amb cable de coure ${ins} (mètode ${m}).`,
  },
  {
    title: 'Línia soterrada sota tub entre edificis (Tabla D)',
    contextBadge: 'Soterrat · Tabla D',
    phase: 'trifasic',
    materials: ['Al', 'Cu'],
    insulations: ['XLPE'],
    methods: ['D'],
    powerRangeKw: [20, 110],
    powerStepKw: 5,
    lengthRangeM: [30, 120],
    cosPhiOptions: [0.85, 0.9, 0.95],
    maxDropPct: 5,
    allowGrouping: true,
    allowCustomTemp: true,
    describe: (p, l, _m, mat) =>
      `Calcula una línia trifàsica (400 V) de força de ${p} kW i ${l} m que discorre soterrada sota tub a 70 cm de profunditat (terreny de 1,5 K·m/W) amb cable d’${mat === 'Al' ? 'alumini' : 'coure'} 0,6/1 kV XLPE (Tabla D).`,
  },
];

export function generateRandomExercise(
  difficulty: ExerciseDifficulty,
  materialPreference: 'random' | ConductorMaterial = 'random'
): GeneratedExercise {
  for (let attempt = 0; attempt < 40; attempt++) {
    // Filtrar escenaris compatibles amb la preferència de material i dificultat
    const eligible = SCENARIOS.filter((s) => {
      if (materialPreference !== 'random' && !s.materials.includes(materialPreference)) {
        return false;
      }
      if (difficulty === 'basic' && s.methods.includes('D')) return false;
      return true;
    });

    const scenario = pick(eligible.length > 0 ? eligible : SCENARIOS);
    const material: ConductorMaterial =
      materialPreference !== 'random' && scenario.materials.includes(materialPreference)
        ? materialPreference
        : pick(scenario.materials);

    const method = pick(scenario.methods);
    const insulation: InsulationType = method === 'D' ? 'XLPE' : pick(scenario.insulations);
    const phase = scenario.phase;
    const voltage = phase === 'trifasic' ? 400 : 230;

    // Potència aleatòria en passos nets
    const steps = Math.max(1, Math.round((scenario.powerRangeKw[1] - scenario.powerRangeKw[0]) / scenario.powerStepKw));
    const pKwRaw = scenario.powerRangeKw[0] + randInt(0, steps) * scenario.powerStepKw;
    const pKw = Math.round(pKwRaw * 100) / 100;
    const powerW = Math.round(pKw * 1000);
    const lengthM = randInt(scenario.lengthRangeM[0], scenario.lengthRangeM[1]);
    const cosPhi = pick(scenario.cosPhiOptions);

    const isBuried = method === 'D';
    let ambientTemp = isBuried ? 25 : 40;
    let groupedCircuits = 1;

    if (difficulty === 'intermedi') {
      if (scenario.allowGrouping && Math.random() < 0.65) {
        groupedCircuits = pick([2, 3, 4]);
      } else if (scenario.allowCustomTemp && Math.random() < 0.45) {
        ambientTemp = isBuried ? pick([20, 30]) : pick([35, 45]);
      }
    } else if (difficulty === 'avancat') {
      if (scenario.allowGrouping) {
        groupedCircuits = pick([2, 3, 4, 6]);
      }
      if (scenario.allowCustomTemp) {
        ambientTemp = isBuried ? pick([20, 30, 35]) : pick([30, 45, 50]);
      }
    }

    const input: CalculationInput = {
      phase,
      voltage,
      powerW,
      cosPhi,
      lengthM,
      maxVoltageDropPct: scenario.maxDropPct,
      material,
      insulation,
      method,
      ambientTemp,
      groupedCircuits,
      useRealTempIteration: false,
    };

    const solution = calculateConductorSection(input);
    // Evitem exercicis fora de rang o amb secció > 240 mm² per mantenir-los didàctics
    if (solution.valid && solution.finalSection <= 240) {
      let extraText = '';
      if (groupedCircuits > 1) {
        extraText += ` El circuit discorre agrupat juntament amb ${groupedCircuits - 1} ${groupedCircuits === 2 ? 'altre circuit' : 'altres circuits'} (${groupedCircuits} en total).`;
      }
      if (ambientTemp !== (isBuried ? 25 : 40)) {
        extraText += ` La temperatura ${isBuried ? 'del terreny' : 'ambient de l’aire'} és de ${ambientTemp} °C.`;
      }

      return {
        id: `EX-${Date.now().toString(36).toUpperCase()}-${randInt(10, 99)}`,
        difficulty,
        title: scenario.title,
        contextBadge: `${scenario.contextBadge} · ${material === 'Cu' ? 'Coure' : 'Alumini'}`,
        statement: scenario.describe(pKw, lengthM, method, material, insulation) + extraText,
        input,
        solution,
      };
    }
  }

  // Fallback segur
  const fallbackInput: CalculationInput = {
    phase: 'trifasic',
    voltage: 400,
    powerW: 35000,
    cosPhi: 0.85,
    lengthM: 55,
    maxVoltageDropPct: 5,
    material: materialPreference === 'random' ? 'Al' : materialPreference,
    insulation: 'XLPE',
    method: 'C',
    ambientTemp: 40,
    groupedCircuits: 1,
    useRealTempIteration: false,
  };
  return {
    id: `EX-${Date.now().toString(36).toUpperCase()}`,
    difficulty,
    title: 'Línia trifàsica de força en nau industrial',
    contextBadge: `Força industrial · 5% · ${fallbackInput.material === 'Cu' ? 'Coure' : 'Alumini'}`,
    statement: `Calcula la secció d’una línia trifàsica (400 V) de 35 kW, cos φ = 0,85 i 55 m de longitud, amb cable d’${fallbackInput.material === 'Al' ? 'alumini' : 'coure'} XLPE instal·lat directament sobre paret (mètode C).`,
    input: fallbackInput,
    solution: calculateConductorSection(fallbackInput),
  };
}

function parseLocaleNumber(val: string): number {
  const cleaned = val.trim().replace(',', '.');
  return cleaned === '' ? NaN : Number(cleaned);
}

export function gradeExercise(exercise: GeneratedExercise, answers: StudentAnswers): ExerciseGrade {
  const sol = exercise.solution;
  const fields: FieldCheckResult[] = [];

  // 1. Intensitat de servei (tolerància ±2% o ±0,15 A)
  const userI = parseLocaleNumber(answers.serviceCurrentA);
  const tolI = Math.max(0.15, sol.serviceCurrentA * 0.025);
  const okI = !isNaN(userI) && Math.abs(userI - sol.serviceCurrentA) <= tolI;
  fields.push({
    field: 'serviceCurrentA',
    label: 'Intensitat de servei (I)',
    correct: okI,
    expectedDisplay: `${sol.serviceCurrentA.toFixed(2)} A`,
    userValue: answers.serviceCurrentA || '—',
    feedback: okI
      ? 'Correcte!'
      : `S’esperava ${sol.serviceCurrentA.toFixed(2)} A (${
          sol.effectivePhase === 'trifasic' ? 'I = P / (√3 · U · cos φ)' : 'I = P / (U · cos φ)'
        }).`,
  });

  // 2. Secció per intensitat admissible (match exacte de secció normalitzada)
  const userSi = parseLocaleNumber(answers.sectionByAmpacity);
  const okSi = !isNaN(userSi) && Math.abs(userSi - sol.sectionByAmpacity) < 0.01;
  fields.push({
    field: 'sectionByAmpacity',
    label: 'Secció per intensitat admissible (S_I)',
    correct: okSi,
    expectedDisplay: `${sol.sectionByAmpacity} mm²`,
    userValue: answers.sectionByAmpacity ? `${answers.sectionByAmpacity} mm²` : '—',
    feedback: okSi
      ? `Correcte! (${sol.baseAmpacityAtThermalSection} A base a ${sol.ampacityColumnLabel}).`
      : `S’esperava ${sol.sectionByAmpacity} mm² per a I' = ${sol.correctedCurrentA.toFixed(2)} A a ${sol.ampacityColumnLabel}.`,
  });

  // 3. Secció teòrica per caiguda de tensió (tolerància ±3% o ±0,12 mm²)
  const userSdu = parseLocaleNumber(answers.theoreticalSectionByDrop);
  const tolSdu = Math.max(0.12, sol.theoreticalSectionByDrop * 0.03);
  const okSdu = !isNaN(userSdu) && Math.abs(userSdu - sol.theoreticalSectionByDrop) <= tolSdu;
  fields.push({
    field: 'theoreticalSectionByDrop',
    label: 'Secció teòrica per caiguda de tensió (S_ΔU)',
    correct: okSdu,
    expectedDisplay: `${sol.theoreticalSectionByDrop.toFixed(2)} mm²`,
    userValue: answers.theoreticalSectionByDrop ? `${answers.theoreticalSectionByDrop} mm²` : '—',
    feedback: okSdu
      ? `Correcte! (amb γ = ${sol.gammaAtMaxTemp} m/Ω·mm² i e = ${sol.maxVoltageDropV.toFixed(2)} V).`
      : `S’esperava ${sol.theoreticalSectionByDrop.toFixed(2)} mm² usant γ = ${sol.gammaAtMaxTemp} m/Ω·mm² i e = ${sol.maxVoltageDropV.toFixed(2)} V.`,
  });

  // 4. Secció normalitzada final
  const userFinal = parseLocaleNumber(answers.finalSection);
  const okFinal = !isNaN(userFinal) && Math.abs(userFinal - sol.finalSection) < 0.01;
  fields.push({
    field: 'finalSection',
    label: 'Secció normalitzada final del conductor (S)',
    correct: okFinal,
    expectedDisplay: `${sol.finalSection} mm²`,
    userValue: answers.finalSection ? `${answers.finalSection} mm²` : '—',
    feedback: okFinal
      ? 'Correcte! Compleix simultàniament el criteri tèrmic i el de caiguda de tensió.'
      : `La secció normalitzada correcta és ${sol.finalSection} mm² (màxim entre S_I = ${sol.sectionByAmpacity} mm² i S_ΔU norm. = ${sol.sectionByDrop} mm²).`,
  });

  // 5. Secció del conductor de protecció (PE) — Tabla 2
  const userPe = parseLocaleNumber(answers.protectiveSection);
  const okPe = !isNaN(userPe) && Math.abs(userPe - sol.protectiveSection) < 0.01;
  fields.push({
    field: 'protectiveSection',
    label: 'Secció del conductor de protecció (PE)',
    correct: okPe,
    expectedDisplay: `${sol.protectiveSection} mm²`,
    userValue: answers.protectiveSection ? `${answers.protectiveSection} mm²` : '—',
    feedback: okPe
      ? 'Correcte segons la Tabla 2 de la ITC-BT-19!'
      : `Segons la Tabla 2 de la ITC-BT-19, per a S = ${sol.finalSection} mm² correspon PE = ${sol.protectiveSection} mm².`,
  });

  const score = fields.filter((f) => f.correct).length;
  return {
    allCorrect: score === fields.length,
    score,
    total: fields.length,
    fields,
  };
}

export function formatSectionLabel(s: StandardSection): string {
  return `${s.toString().replace('.', ',')} mm²`;
}

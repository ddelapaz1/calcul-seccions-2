import {
  ConductorMaterial,
  INSULATIONS,
  INSTALLATION_METHODS,
  InstallationMethodId,
  InsulationType,
  MATERIALS,
  PhaseSystem,
  STANDARD_SECTIONS,
  StandardSection,
  calculateProtectiveSection,
  getGroupingFactor,
  getNextStandardSection,
  getTempCorrectionFactor,
  lookupBaseAmpacity,
} from '../data/itcBt19';

export interface CalculationInput {
  phase: PhaseSystem;
  voltage: number; // 230 V (monofàsic) o 400 V (trifàsic)
  powerW: number; // Potència activa P en watts (W)
  cosPhi: number; // Factor de potència (0.5 .. 1.0)
  lengthM: number; // Longitud de la línia L en metres (m)
  maxVoltageDropPct: number; // % màxim admissible (ex. 3, 5, 1, 0.5...)
  material: ConductorMaterial;
  insulation: InsulationType;
  method: InstallationMethodId;
  ambientTemp: number; // °C (40 aire / 25 terreny per defecte)
  groupedCircuits: number; // Nombre de circuits agrupats (1 = sense agrupació)
  useRealTempIteration?: boolean; // 2a iteració GUÍA-BT-ANEXO 2 fórmula [17]
}

export interface RealTempCheck {
  candidateSection: StandardSection;
  candidateAmpacity: number;
  estimatedTempC: number;
  gammaReal: number;
  voltageDropV: number;
  voltageDropPct: number;
  complies: boolean;
}

export interface CalculationResult {
  valid: boolean;
  error?: string;
  input: CalculationInput;
  effectiveInsulation: InsulationType;
  effectivePhase: PhaseSystem;

  // Pas 1: Intensitat de servei
  serviceCurrentA: number;

  // Pas 2: Factors de correcció i intensitat corregida
  tempFactorKt: number;
  groupingFactorKg: number;
  groupingSource: string;
  combinedFactorK: number;
  correctedCurrentA: number; // I' = Ib / (Kt * Kg)

  // Pas 3: Criteri d'intensitat màxima admissible (tèrmic)
  ampacitySourceTable: string;
  ampacityColumnLabel: string;
  sectionByAmpacity: StandardSection;
  baseAmpacityAtThermalSection: number;
  effectiveAmpacityAtThermalSection: number;

  // Pas 4: Criteri de caiguda de tensió (GUÍA-BT-ANEXO 2)
  maxVoltageDropV: number;
  gammaAtMaxTemp: number; // γ70 o γ90 de Tabla 3
  maxOperatingTempC: number;
  theoreticalSectionByDrop: number;
  sectionByDrop: StandardSection;
  realTempIteration?: RealTempCheck;

  // Pas 5: Secció definitiva i comprovacions finals
  finalSection: StandardSection;
  governingCriterion: 'ampacity' | 'voltageDrop' | 'equal';
  finalBaseAmpacity: number;
  finalEffectiveAmpacity: number;
  finalVoltageDropV: number;
  finalVoltageDropPct: number;
  finalEstimatedTempC: number;
  thermalUtilizationPct: number;
  voltageDropUtilizationPct: number;

  // Pas 6: Neutre, Protecció (PE) i observacions
  neutralSection: StandardSection;
  protectiveSection: StandardSection;
  warnings: string[];
}

export function getGammaAtTemperature(
  material: ConductorMaterial,
  tempC: number,
  useTableValueForNominal = true
): number {
  const mat = MATERIALS[material];
  if (useTableValueForNominal) {
    if (Math.abs(tempC - 70) < 0.01) return mat.gamma70;
    if (Math.abs(tempC - 90) < 0.01) return mat.gamma90;
    if (Math.abs(tempC - 20) < 0.01) return mat.gamma20;
  }
  // Conductivitat contínua basada en ρ20 i α (GUÍA-BT-ANEXO 2 fórmula [11])
  // Ajustada per coincidir amb γ20 de la Tabla 3
  return mat.gamma20 / (1 + mat.alpha * (tempC - 20));
}

export function getReactanceFactor(section: number): number {
  // GUÍA-BT-ANEXO 2 Tabla 1: X ≈ 0 per S <= 120 mm², 0.15R (150), 0.20R (185), 0.25R (240+)
  if (section <= 120) return 0;
  if (section <= 150) return 0.15;
  if (section <= 185) return 0.2;
  return 0.25;
}

export function computeVoltageDropV(
  section: number,
  gamma: number,
  powerW: number,
  lengthM: number,
  voltage: number,
  phase: PhaseSystem,
  cosPhi: number
): number {
  const factor = phase === 'monofasic' ? 2 : 1;
  const rLine = lengthM / (gamma * section);
  const xRatio = getReactanceFactor(section);
  const tanPhi = cosPhi < 1 ? Math.tan(Math.acos(cosPhi)) : 0;
  const effectiveR = rLine * (1 + xRatio * tanPhi);
  return (factor * effectiveR * powerW) / voltage;
}

export function calculateConductorSection(rawInput: CalculationInput): CalculationResult {
  const warnings: string[] = [];

  // Mètode D (Tabla D) és específic per a XLPE 0,6/1 kV
  const effectiveInsulation: InsulationType = rawInput.method === 'D' ? 'XLPE' : rawInput.insulation;
  if (rawInput.method === 'D' && rawInput.insulation === 'PVC') {
    warnings.push(
      'La Tabla D (soterrat sota tub) de la GUÍA-BT-19 correspon a cables 0,6/1 kV amb aïllament termoestable XLPE (90 °C).'
    );
  }

  // Mètode G (Tabla 1 ITC-BT-19) només defineix circuits trifàsics (3x)
  const effectivePhase: PhaseSystem = rawInput.method === 'G' ? 'trifasic' : rawInput.phase;
  if (rawInput.method === 'G' && rawInput.phase === 'monofasic') {
    warnings.push('El mètode G de la Tabla 1 de la ITC-BT-19 aplica a circuits trifàsics (3x) a partir de 25 mm².');
  }

  const voltage = rawInput.voltage || (effectivePhase === 'trifasic' ? 400 : 230);
  const input: CalculationInput = {
    ...rawInput,
    phase: effectivePhase,
    insulation: effectiveInsulation,
    voltage,
  };

  const methodInfo = INSTALLATION_METHODS[input.method];
  const matInfo = MATERIALS[input.material];
  const maxOperatingTempC = INSULATIONS[effectiveInsulation].maxTemp;

  // Validacions bàsiques
  if (input.powerW <= 0 || input.lengthM <= 0 || input.cosPhi <= 0 || input.cosPhi > 1 || input.maxVoltageDropPct <= 0) {
    return makeError(input, effectiveInsulation, effectivePhase, 'Els paràmetres d’entrada han de ser valors positius vàlids (0 < cos φ ≤ 1).');
  }

  const tempFactorKt = getTempCorrectionFactor(input.ambientTemp, effectiveInsulation, methodInfo.isBuried);
  if (tempFactorKt <= 0) {
    return makeError(
      input,
      effectiveInsulation,
      effectivePhase,
      `La temperatura ambient (${input.ambientTemp} °C) no pot igualar ni superar la temperatura màxima de l’aïllament (${maxOperatingTempC} °C).`
    );
  }

  // Pas 1: Intensitat de servei Ib
  const serviceCurrentA =
    effectivePhase === 'trifasic'
      ? input.powerW / (Math.sqrt(3) * voltage * input.cosPhi)
      : input.powerW / (voltage * input.cosPhi);

  // Pas 2: Factors de correcció
  const { factor: groupingFactorKg, sourceTable: groupingSource } = getGroupingFactor(
    input.method,
    input.groupedCircuits
  );
  const combinedFactorK = tempFactorKt * groupingFactorKg;
  const correctedCurrentA = serviceCurrentA / combinedFactorK;

  // Pas 3: Criteri tèrmic (intensitat màxima admissible)
  let sectionByAmpacity: StandardSection | null = null;
  let baseAmpacityAtThermalSection = 0;
  let ampacitySourceTable = '';
  let ampacityColumnLabel = '';

  const minAllowedSection =
    input.method === 'D' && input.material === 'Al' ? 2.5 : matInfo.minSection;

  for (const s of STANDARD_SECTIONS) {
    if (s < minAllowedSection) continue;
    const lookup = lookupBaseAmpacity(s, input.material, input.method, effectivePhase, effectiveInsulation);
    if (!ampacitySourceTable) {
      ampacitySourceTable = lookup.sourceTable;
      ampacityColumnLabel = lookup.columnLabel;
    }
    if (lookup.ampacity !== null && lookup.ampacity >= correctedCurrentA - 1e-9) {
      sectionByAmpacity = s;
      baseAmpacityAtThermalSection = lookup.ampacity;
      ampacitySourceTable = lookup.sourceTable;
      ampacityColumnLabel = lookup.columnLabel;
      break;
    }
  }

  if (sectionByAmpacity === null) {
    return makeError(
      input,
      effectiveInsulation,
      effectivePhase,
      `La intensitat corregida (${correctedCurrentA.toFixed(1)} A) supera la capacitat màxima d’un sol conductor per al mètode ${input.method}. Caldria instal·lar conductors en paral·lel.`
    );
  }

  const effectiveAmpacityAtThermalSection = baseAmpacityAtThermalSection * combinedFactorK;

  // Pas 4: Criteri de caiguda de tensió (GUÍA-BT-ANEXO 2)
  const maxVoltageDropV = (input.maxVoltageDropPct / 100) * voltage;
  const gammaAtMaxTemp = getGammaAtTemperature(input.material, maxOperatingTempC, true);
  const phaseFactor = effectivePhase === 'monofasic' ? 2 : 1;

  // Fórmula simplificada [15] i [16] de GUÍA-BT-ANEXO 2
  const theoreticalSectionByDrop =
    (phaseFactor * input.powerW * input.lengthM) / (gammaAtMaxTemp * maxVoltageDropV * voltage);

  let sectionByDrop = getNextStandardSection(theoreticalSectionByDrop, minAllowedSection);

  // Assegurar que existeix a la taula d'intensitats per aquest mètode
  if (sectionByDrop !== null) {
    const startIdx = STANDARD_SECTIONS.indexOf(sectionByDrop);
    let foundValid: StandardSection | null = null;
    for (let i = startIdx; i < STANDARD_SECTIONS.length; i++) {
      const candidate = STANDARD_SECTIONS[i];
      const checkAmp = lookupBaseAmpacity(candidate, input.material, input.method, effectivePhase, effectiveInsulation).ampacity;
      if (checkAmp === null) continue;
      // Si S > 120 mm², verifiquem també incloent la reactància (Tabla 1 Anexo 2)
      const dv = computeVoltageDropV(
        candidate,
        gammaAtMaxTemp,
        input.powerW,
        input.lengthM,
        voltage,
        effectivePhase,
        input.cosPhi
      );
      if (dv <= maxVoltageDropV + 1e-6) {
        foundValid = candidate;
        break;
      }
    }
    sectionByDrop = foundValid;
  }

  if (sectionByDrop === null) {
    return makeError(
      input,
      effectiveInsulation,
      effectivePhase,
      `La secció necessària per caiguda de tensió (${theoreticalSectionByDrop.toFixed(1)} mm²) supera el màxim normalitzat per a un sol conductor en aquest mètode. Caldria reduir longitud o usar conductors en paral·lel.`
    );
  }

  // Segona iteració opcional (temperatura real del conductor, fórmula [17] GUÍA-BT-ANEXO 2)
  let realTempIteration: RealTempCheck | undefined;
  let finalSection: StandardSection = sectionByAmpacity >= sectionByDrop ? sectionByAmpacity : sectionByDrop;

  if (input.useRealTempIteration && sectionByDrop > sectionByAmpacity) {
    const dropIdx = STANDARD_SECTIONS.indexOf(sectionByDrop);
    const thermalIdx = STANDARD_SECTIONS.indexOf(sectionByAmpacity);
    if (dropIdx > thermalIdx) {
      const candidate = STANDARD_SECTIONS[dropIdx - 1];
      const candBaseAmp = lookupBaseAmpacity(candidate, input.material, input.method, effectivePhase, effectiveInsulation).ampacity;
      if (candBaseAmp !== null) {
        const candEffAmp = candBaseAmp * combinedFactorK;
        if (candEffAmp >= serviceCurrentA) {
          const t0 = input.ambientTemp;
          const ratio = serviceCurrentA / candEffAmp;
          const estTemp = t0 + (maxOperatingTempC - t0) * ratio * ratio;
          const gammaReal = getGammaAtTemperature(input.material, estTemp, false);
          const dvReal = computeVoltageDropV(
            candidate,
            gammaReal,
            input.powerW,
            input.lengthM,
            voltage,
            effectivePhase,
            input.cosPhi
          );
          const dvPctReal = (dvReal / voltage) * 100;
          const complies = dvReal <= maxVoltageDropV + 1e-6;
          realTempIteration = {
            candidateSection: candidate,
            candidateAmpacity: candEffAmp,
            estimatedTempC: estTemp,
            gammaReal,
            voltageDropV: dvReal,
            voltageDropPct: dvPctReal,
            complies,
          };
          if (complies) {
            finalSection = candidate;
          }
        }
      }
    }
  }

  const governingCriterion: 'ampacity' | 'voltageDrop' | 'equal' =
    sectionByAmpacity > sectionByDrop
      ? 'ampacity'
      : sectionByDrop > sectionByAmpacity
        ? 'voltageDrop'
        : 'equal';

  const finalBaseAmpacity =
    lookupBaseAmpacity(finalSection, input.material, input.method, effectivePhase, effectiveInsulation).ampacity ??
    baseAmpacityAtThermalSection;
  const finalEffectiveAmpacity = finalBaseAmpacity * combinedFactorK;

  const loadRatio = serviceCurrentA / finalEffectiveAmpacity;
  const finalEstimatedTempC = input.ambientTemp + (maxOperatingTempC - input.ambientTemp) * loadRatio * loadRatio;

  const gammaUsedForFinalDrop =
    realTempIteration && realTempIteration.complies ? realTempIteration.gammaReal : gammaAtMaxTemp;
  const finalVoltageDropV = computeVoltageDropV(
    finalSection,
    gammaUsedForFinalDrop,
    input.powerW,
    input.lengthM,
    voltage,
    effectivePhase,
    input.cosPhi
  );
  const finalVoltageDropPct = (finalVoltageDropV / voltage) * 100;

  const thermalUtilizationPct = (serviceCurrentA / finalEffectiveAmpacity) * 100;
  const voltageDropUtilizationPct = (finalVoltageDropPct / input.maxVoltageDropPct) * 100;

  // Pas 6: Neutre i conductor de protecció (PE)
  const neutralSection = finalSection;
  const protectiveSection = calculateProtectiveSection(finalSection);

  if (input.material === 'Al' && input.maxVoltageDropPct === 3 && effectivePhase === 'monofasic') {
    warnings.push('Recorda que segons la ITC-BT-26 en habitatges i oficines els conductors han de ser de coure.');
  }
  if (finalSection > 120) {
    warnings.push(
      `Per a seccions superiors a 120 mm² (${finalSection} mm²), s’ha inclòs la contribució de la reactància inductiva (Tabla 1 GUÍA-BT-ANEXO 2).`
    );
  }
  if (input.groupedCircuits > 1) {
    warnings.push(
      'Els factors de reducció per agrupació no s’apliquen si els circuits discorren paral·lels menys de 2 m (ex. sortida d’un quadre).'
    );
  }

  return {
    valid: true,
    input,
    effectiveInsulation,
    effectivePhase,
    serviceCurrentA,
    tempFactorKt,
    groupingFactorKg,
    groupingSource,
    combinedFactorK,
    correctedCurrentA,
    ampacitySourceTable,
    ampacityColumnLabel,
    sectionByAmpacity,
    baseAmpacityAtThermalSection,
    effectiveAmpacityAtThermalSection,
    maxVoltageDropV,
    gammaAtMaxTemp,
    maxOperatingTempC,
    theoreticalSectionByDrop,
    sectionByDrop,
    realTempIteration,
    finalSection,
    governingCriterion,
    finalBaseAmpacity,
    finalEffectiveAmpacity,
    finalVoltageDropV,
    finalVoltageDropPct,
    finalEstimatedTempC,
    thermalUtilizationPct,
    voltageDropUtilizationPct,
    neutralSection,
    protectiveSection,
    warnings,
  };
}

function makeError(
  input: CalculationInput,
  effectiveInsulation: InsulationType,
  effectivePhase: PhaseSystem,
  error: string
): CalculationResult {
  return {
    valid: false,
    error,
    input,
    effectiveInsulation,
    effectivePhase,
    serviceCurrentA: 0,
    tempFactorKt: 1,
    groupingFactorKg: 1,
    groupingSource: '',
    combinedFactorK: 1,
    correctedCurrentA: 0,
    ampacitySourceTable: '',
    ampacityColumnLabel: '',
    sectionByAmpacity: 1.5,
    baseAmpacityAtThermalSection: 0,
    effectiveAmpacityAtThermalSection: 0,
    maxVoltageDropV: 0,
    gammaAtMaxTemp: 48,
    maxOperatingTempC: 70,
    theoreticalSectionByDrop: 0,
    sectionByDrop: 1.5,
    finalSection: 1.5,
    governingCriterion: 'equal',
    finalBaseAmpacity: 0,
    finalEffectiveAmpacity: 0,
    finalVoltageDropV: 0,
    finalVoltageDropPct: 0,
    finalEstimatedTempC: 40,
    thermalUtilizationPct: 0,
    voltageDropUtilizationPct: 0,
    neutralSection: 1.5,
    protectiveSection: 1.5,
    warnings: [],
  };
}

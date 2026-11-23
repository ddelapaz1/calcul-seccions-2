import { describe, expect, it } from 'vitest';
import { calculateConductorSection } from './calculator';
import { generateRandomExercise, gradeExercise } from './exerciseGenerator';
import { calculateProtectiveSection } from '../data/itcBt19';

describe('REBT ITC-BT-19 & GUÍA-BT-ANEXO 2 Calculation Engine', () => {
  it('reprodueix l’Exemple 2 del GUÍA-BT-ANEXO 2 (DI 5750 W, 10 m, 1%, PVC, B1 → 6 mm²)', () => {
    const res = calculateConductorSection({
      phase: 'monofasic',
      voltage: 230,
      powerW: 5750,
      cosPhi: 1.0,
      lengthM: 10,
      maxVoltageDropPct: 1,
      material: 'Cu',
      insulation: 'PVC',
      method: 'B1',
      ambientTemp: 40,
      groupedCircuits: 1,
    });
    expect(res.valid).toBe(true);
    expect(res.serviceCurrentA).toBeCloseTo(25, 2);
    expect(res.theoreticalSectionByDrop).toBeCloseTo(4.53, 2);
    expect(res.sectionByDrop).toBe(6);
    expect(res.finalSection).toBe(6);
    expect(res.finalBaseAmpacity).toBe(36);
    expect(res.protectiveSection).toBe(6);
  });

  it('reprodueix l’Exemple 3 del GUÍA-BT-ANEXO 2 (DI 5750 W, 22 m → 10 mm² i Circuit C2 3680 W, 30 m → 4 mm²)', () => {
    const di = calculateConductorSection({
      phase: 'monofasic',
      voltage: 230,
      powerW: 5750,
      cosPhi: 1.0,
      lengthM: 22,
      maxVoltageDropPct: 1,
      material: 'Cu',
      insulation: 'PVC',
      method: 'B1',
      ambientTemp: 40,
      groupedCircuits: 1,
    });
    expect(di.valid).toBe(true);
    expect(di.theoreticalSectionByDrop).toBeCloseTo(9.96, 1);
    expect(di.finalSection).toBe(10);
    expect(di.finalBaseAmpacity).toBe(50);

    const c2 = calculateConductorSection({
      phase: 'monofasic',
      voltage: 230,
      powerW: 3680,
      cosPhi: 1.0,
      lengthM: 30,
      maxVoltageDropPct: 3,
      material: 'Cu',
      insulation: 'PVC',
      method: 'B1',
      ambientTemp: 40,
      groupedCircuits: 1,
    });
    expect(c2.valid).toBe(true);
    expect(c2.serviceCurrentA).toBeCloseTo(16, 2);
    expect(c2.theoreticalSectionByDrop).toBeCloseTo(2.9, 1);
    expect(c2.finalSection).toBe(4);
    expect(c2.finalBaseAmpacity).toBe(27);
  });

  it('reprodueix l’Exemple 5 del GUÍA-BT-ANEXO 2 (DI 9200 W, 35 m → 35 mm² simplificat i 25 mm² amb 2a iteració)', () => {
    const simple = calculateConductorSection({
      phase: 'monofasic',
      voltage: 230,
      powerW: 9200,
      cosPhi: 1.0,
      lengthM: 35,
      maxVoltageDropPct: 1,
      material: 'Cu',
      insulation: 'PVC',
      method: 'B1',
      ambientTemp: 40,
      groupedCircuits: 1,
      useRealTempIteration: false,
    });
    expect(simple.valid).toBe(true);
    expect(simple.theoreticalSectionByDrop).toBeCloseTo(25.35, 1);
    expect(simple.finalSection).toBe(35);

    const iterated = calculateConductorSection({
      phase: 'monofasic',
      voltage: 230,
      powerW: 9200,
      cosPhi: 1.0,
      lengthM: 35,
      maxVoltageDropPct: 1,
      material: 'Cu',
      insulation: 'PVC',
      method: 'B1',
      ambientTemp: 40,
      groupedCircuits: 1,
      useRealTempIteration: true,
    });
    expect(iterated.valid).toBe(true);
    expect(iterated.realTempIteration?.complies).toBe(true);
    expect(iterated.finalSection).toBe(25);
  });

  it('calcula correctament conductors d’Alumini soterrats (Tabla D) i amb agrupació', () => {
    const res = calculateConductorSection({
      phase: 'trifasic',
      voltage: 400,
      powerW: 70000,
      cosPhi: 0.9,
      lengthM: 60,
      maxVoltageDropPct: 5,
      material: 'Al',
      insulation: 'XLPE',
      method: 'D',
      ambientTemp: 25,
      groupedCircuits: 2,
    });
    expect(res.valid).toBe(true);
    expect(res.groupingFactorKg).toBe(0.85);
    expect(res.serviceCurrentA).toBeCloseTo(112.26, 1);
    expect(res.correctedCurrentA).toBeCloseTo(132.07, 1);
    // Tabla D 3 XLPE Al: 50 mm² = 115 A, 70 mm² = 145 A >= 132.07 A
    expect(res.sectionByAmpacity).toBe(70);
    expect(res.finalSection).toBe(70);
    expect(res.protectiveSection).toBe(35);
  });

  it('aplica correctament la Tabla 2 per a conductors de protecció PE', () => {
    expect(calculateProtectiveSection(2.5)).toBe(2.5);
    expect(calculateProtectiveSection(16)).toBe(16);
    expect(calculateProtectiveSection(25)).toBe(16);
    expect(calculateProtectiveSection(35)).toBe(16);
    expect(calculateProtectiveSection(50)).toBe(25);
    expect(calculateProtectiveSection(95)).toBe(50);
    expect(calculateProtectiveSection(150)).toBe(95);
  });

  it('genera exercicis aleatoris vàlids de Coure i Alumini i els corregeix correctament', () => {
    const exCu = generateRandomExercise('basic', 'Cu');
    const exAl = generateRandomExercise('avancat', 'Al');

    expect(exCu.solution.valid).toBe(true);
    expect(exCu.input.material).toBe('Cu');
    expect(exAl.solution.valid).toBe(true);
    expect(exAl.input.material).toBe('Al');

    const perfectGrade = gradeExercise(exAl, {
      serviceCurrentA: exAl.solution.serviceCurrentA.toFixed(2),
      sectionByAmpacity: String(exAl.solution.sectionByAmpacity),
      theoreticalSectionByDrop: exAl.solution.theoreticalSectionByDrop.toFixed(2),
      finalSection: String(exAl.solution.finalSection),
      protectiveSection: String(exAl.solution.protectiveSection),
    });
    expect(perfectGrade.allCorrect).toBe(true);
    expect(perfectGrade.score).toBe(5);

    const wrongGrade = gradeExercise(exAl, {
      serviceCurrentA: '1.0',
      sectionByAmpacity: '1.5',
      theoreticalSectionByDrop: '0.1',
      finalSection: '1.5',
      protectiveSection: '1.5',
    });
    expect(wrongGrade.allCorrect).toBe(false);
    expect(wrongGrade.score).toBeLessThan(5);
  });
});

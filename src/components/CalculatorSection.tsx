import React, { useMemo, useState } from 'react';
import { Box, Calculator, RotateCcw, Sparkles, Table2 } from 'lucide-react';
import {
  ConductorMaterial,
  INSTALLATION_METHODS,
  InstallationMethodId,
  InsulationType,
  METHOD_ORDER,
  PhaseSystem,
  VOLTAGE_DROP_PRESETS,
} from '../data/itcBt19';
import {
  CalculationInput,
  CalculationResult,
  PROTECTION_RATINGS,
  ProtectionDevice,
  calculateConductorSection,
} from '../engine/calculator';
import { StepByStepView } from './StepByStepView';
import { ReferenceTablesPanel } from './ReferenceTablesPanel';
import { Tex } from './Tex';

interface CalculatorSectionProps {
  input: CalculationInput;
  onInputChange: React.Dispatch<React.SetStateAction<CalculationInput>>;
  /** Obre el visor 3D amb aquest càlcul (mapa tèrmic) o, si el càlcul no és vàlid, només el mètode */
  onInspectIn3D: (result: CalculationResult) => void;
}

/** Aplica un canvi de mètode d'instal·lació a les dades d'entrada (temperatura de referència, XLPE en D, trifàsic en G) */
export function applyMethodToInput(prev: CalculationInput, method: InstallationMethodId): CalculationInput {
  const info = INSTALLATION_METHODS[method];
  return {
    ...prev,
    method,
    ambientTemp: info.refTemp,
    insulation: method === 'D' ? 'XLPE' : prev.insulation,
    phase: method === 'G' ? 'trifasic' : prev.phase,
    voltage: method === 'G' ? 400 : prev.voltage,
  };
}

export const DEFAULT_INPUT: CalculationInput = {
  phase: 'trifasic',
  voltage: 400,
  powerW: 25000,
  cosPhi: 0.85,
  lengthM: 45,
  maxVoltageDropPct: 5,
  material: 'Cu',
  insulation: 'XLPE',
  method: 'B1',
  ambientTemp: 40,
  groupedCircuits: 1,
  useRealTempIteration: false,
};

const QUICK_EXAMPLES: { label: string; input: CalculationInput }[] = [
  {
    label: 'Habitatge C2 (3,68 kW · 30 m)',
    input: {
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
      useRealTempIteration: false,
    },
  },
  {
    label: 'DI Bàsica (5,75 kW · 22 m · 1%)',
    input: {
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
      useRealTempIteration: false,
    },
  },
  {
    label: 'Força Industrial Al (55 kW · 65 m)',
    input: {
      phase: 'trifasic',
      voltage: 400,
      powerW: 55000,
      cosPhi: 0.85,
      lengthM: 65,
      maxVoltageDropPct: 5,
      material: 'Al',
      insulation: 'XLPE',
      method: 'E',
      ambientTemp: 40,
      groupedCircuits: 2,
      useRealTempIteration: false,
    },
  },
  {
    label: 'Soterrat Tabla D Al (80 kW · 85 m)',
    input: {
      phase: 'trifasic',
      voltage: 400,
      powerW: 80000,
      cosPhi: 0.9,
      lengthM: 85,
      maxVoltageDropPct: 5,
      material: 'Al',
      insulation: 'XLPE',
      method: 'D',
      ambientTemp: 25,
      groupedCircuits: 1,
      useRealTempIteration: false,
    },
  },
];

export const CalculatorSection: React.FC<CalculatorSectionProps> = ({ input, onInputChange: setInput, onInspectIn3D }) => {
  const [powerUnit, setPowerUnit] = useState<'kW' | 'W'>('kW');
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(() => calculateConductorSection(input), [input]);

  const updatePhase = (phase: PhaseSystem) => {
    setInput((prev) => ({
      ...prev,
      phase,
      voltage: phase === 'trifasic' ? 400 : 230,
    }));
  };

  const updateMethod = (method: InstallationMethodId) => {
    setInput((prev) => applyMethodToInput(prev, method));
  };

  const displayPower = powerUnit === 'kW' ? Number((input.powerW / 1000).toFixed(3)) : input.powerW;

  const handlePowerChange = (val: string) => {
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setInput((prev) => ({
        ...prev,
        powerW: powerUnit === 'kW' ? Math.round(num * 1000) : Math.round(num),
      }));
    }
  };

  const matchingPreset = VOLTAGE_DROP_PRESETS.find((p) => p.maxDropPct === input.maxVoltageDropPct)?.id ?? 'custom';

  return (
    <div>
      <div className="section-hero">
        <div>
          <span className="section-eyebrow">
            <Calculator size={13} /> Resolució didàctica pas a pas
          </span>
          <h1 className="section-title">Calculadora de secció de conductors</h1>
          <p className="section-lead">
            Selecciona les condicions de la instal·lació i segueix el desenvolupament complet de cada fórmula i consulta de taula segons la ITC-BT-19 i el GUÍA-BT-ANEXO 2.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {QUICK_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              className="btn btn-outline btn-sm"
              onClick={() => setInput(ex.input)}
            >
              <Sparkles size={13} color="var(--copper)" />
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="calc-layout">
        {/* Left: Input Form */}
        <div className="card" style={{ position: 'sticky', top: '4.75rem' }}>
          <div className="card-header">
            <h2 className="card-title">Condicions de la instal·lació</h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setInput(DEFAULT_INPUT)}
              title="Restablir valors per defecte"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="form-stack">
            {/* Sistema */}
            <div className="field-group">
              <label className="field-label">
                <span>Sistema elèctric</span>
                <span className="field-hint mono">{input.voltage} V</span>
              </label>
              <div className="segmented">
                <button
                  className={`seg-btn ${input.phase === 'monofasic' ? 'active' : ''}`}
                  onClick={() => updatePhase('monofasic')}
                  disabled={input.method === 'G'}
                >
                  Monofàsic (230 V)
                </button>
                <button
                  className={`seg-btn ${input.phase === 'trifasic' ? 'active' : ''}`}
                  onClick={() => updatePhase('trifasic')}
                >
                  Trifàsic (400 V)
                </button>
              </div>
            </div>

            {/* Potència + cos phi */}
            <div className="form-row">
              <div className="field-group">
                <label className="field-label">
                  <span>Potència (P)</span>
                  <button
                    type="button"
                    onClick={() => setPowerUnit((u) => (u === 'kW' ? 'W' : 'kW'))}
                    style={{
                      border: 'none',
                      background: 'var(--blue-soft)',
                      color: 'var(--blue)',
                      borderRadius: 5,
                      padding: '0.05rem 0.4rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {powerUnit} ⇄
                  </button>
                </label>
                <input
                  type="number"
                  className="input mono"
                  min={powerUnit === 'kW' ? 0.1 : 100}
                  step={powerUnit === 'kW' ? 0.5 : 100}
                  value={displayPower}
                  onChange={(e) => handlePowerChange(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <span>Factor potència (<Tex>\cos\varphi</Tex>)</span>
                </label>
                <input
                  type="number"
                  className="input mono"
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={input.cosPhi}
                  onChange={(e) =>
                    setInput((p) => ({ ...p, cosPhi: Math.min(1, Math.max(0.5, Number(e.target.value) || 0.85)) }))
                  }
                />
              </div>
            </div>

            {/* Longitud + Caiguda màx */}
            <div className="form-row">
              <div className="field-group">
                <label className="field-label">
                  <span>Longitud (L)</span>
                  <span className="field-hint">metres</span>
                </label>
                <input
                  type="number"
                  className="input mono"
                  min={1}
                  max={500}
                  step={1}
                  value={input.lengthM}
                  onChange={(e) => setInput((p) => ({ ...p, lengthM: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <span>Caiguda màx. (%)</span>
                  <span className="field-hint mono">
                    {((input.maxVoltageDropPct / 100) * input.voltage).toFixed(1)} V
                  </span>
                </label>
                <input
                  type="number"
                  className="input mono"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={input.maxVoltageDropPct}
                  onChange={(e) =>
                    setInput((p) => ({ ...p, maxVoltageDropPct: Math.max(0.1, Number(e.target.value) || 3) }))
                  }
                />
              </div>
            </div>

            {/* Preset tipus instal·lació / caiguda */}
            <div className="field-group">
              <label className="field-label">Límit reglamentari de caiguda de tensió</label>
              <select
                className="select"
                value={matchingPreset}
                onChange={(e) => {
                  const found = VOLTAGE_DROP_PRESETS.find((p) => p.id === e.target.value);
                  if (found) {
                    setInput((prev) => ({ ...prev, maxVoltageDropPct: found.maxDropPct }));
                  }
                }}
              >
                {VOLTAGE_DROP_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
                {matchingPreset === 'custom' && (
                  <option value="custom">Personalitzat ({input.maxVoltageDropPct}%)</option>
                )}
              </select>
            </div>

            {/* Material + Aïllament */}
            <div className="form-row">
              <div className="field-group">
                <label className="field-label">Material conductor</label>
                <div className="segmented">
                  {(['Cu', 'Al'] as ConductorMaterial[]).map((m) => (
                    <button
                      key={m}
                      className={`seg-btn ${input.material === m ? (m === 'Cu' ? 'active-copper' : 'active') : ''}`}
                      onClick={() => setInput((p) => ({ ...p, material: m }))}
                    >
                      {m === 'Cu' ? 'Coure (Cu)' : 'Alumini (Al)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Aïllament</label>
                <div className="segmented">
                  {(['PVC', 'XLPE'] as InsulationType[]).map((ins) => (
                    <button
                      key={ins}
                      className={`seg-btn ${result.effectiveInsulation === ins ? 'active' : ''}`}
                      onClick={() => setInput((p) => ({ ...p, insulation: ins }))}
                      disabled={input.method === 'D' && ins === 'PVC'}
                    >
                      {ins === 'PVC' ? 'PVC (70°)' : 'XLPE (90°)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mètode d'instal·lació */}
            <div className="field-group">
              <label className="field-label">
                <span>Tipus d’instal·lació (ITC-BT-19)</span>
                <button
                  type="button"
                  onClick={() => onInspectIn3D(result)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--blue)',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: 0,
                  }}
                >
                  <Box size={13} /> Veure en 3D
                </button>
              </label>
              <select
                className="select"
                value={input.method}
                onChange={(e) => updateMethod(e.target.value as InstallationMethodId)}
              >
                {METHOD_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {INSTALLATION_METHODS[m].shortCode} — {INSTALLATION_METHODS[m].title}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperatura + Circuits agrupats */}
            <div className="form-row">
              <div className="field-group">
                <label className="field-label">
                  <span>{INSTALLATION_METHODS[input.method].isBuried ? 'Temp. terreny' : 'Temp. ambient'}</span>
                  <span className="field-hint mono">{input.ambientTemp} °C</span>
                </label>
                <input
                  type="number"
                  className="input mono"
                  min={10}
                  max={result.effectiveInsulation === 'PVC' ? 65 : 80}
                  step={5}
                  value={input.ambientTemp}
                  onChange={(e) => setInput((p) => ({ ...p, ambientTemp: Number(e.target.value) || 40 }))}
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <span>Circuits agrupats</span>
                  <span className="field-hint">Tabla {input.method === 'D' ? 'H' : 'E'}</span>
                </label>
                <select
                  className="select mono"
                  value={input.groupedCircuits}
                  onChange={(e) => setInput((p) => ({ ...p, groupedCircuits: Number(e.target.value) }))}
                >
                  {(input.method === 'D' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 6, 9, 12, 16, 20]).map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? '1 (sense agrupació)' : `${n} circuits`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Protecció contra sobrecàrregues */}
            <div className="field-group">
              <label className="field-label">
                <span>Protecció (ITC-BT-22)</span>
                <span className="field-hint">I_b ≤ I_n ≤ I_z</span>
              </label>
              <div className="form-row">
                <div className="segmented">
                  {(['magnetotermic', 'fusible'] as ProtectionDevice[]).map((d) => (
                    <button
                      key={d}
                      className={`seg-btn ${(input.protectionDevice ?? 'magnetotermic') === d ? 'active' : ''}`}
                      onClick={() =>
                        setInput((p) => ({
                          ...p,
                          protectionDevice: d,
                          // Si el calibre triat no existeix per al nou dispositiu, torna a automàtic
                          protectionRatingA:
                            p.protectionRatingA && PROTECTION_RATINGS[d].includes(p.protectionRatingA) ? p.protectionRatingA : undefined,
                        }))
                      }
                    >
                      {d === 'magnetotermic' ? 'Magnetotèrmic' : 'Fusible gG'}
                    </button>
                  ))}
                </div>
                <select
                  className="select mono"
                  value={input.protectionRatingA ?? 'auto'}
                  onChange={(e) =>
                    setInput((p) => ({
                      ...p,
                      protectionRatingA: e.target.value === 'auto' ? undefined : Number(e.target.value),
                    }))
                  }
                  aria-label="Intensitat nominal de la protecció"
                >
                  <option value="auto">
                    I_n automàtica{result.protection?.ratingA && !input.protectionRatingA ? ` (${result.protection.ratingA} A)` : ''}
                  </option>
                  {PROTECTION_RATINGS[input.protectionDevice ?? 'magnetotermic'].map((r) => (
                    <option key={r} value={r}>
                      I_n = {r} A
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggle 2a iteració temperatura real */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.55rem',
                padding: '0.6rem 0.7rem',
                borderRadius: '8px',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(input.useRealTempIteration)}
                onChange={(e) => setInput((p) => ({ ...p, useRealTempIteration: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>2a iteració a temperatura real</strong> (GUÍA-BT-ANEXO 2, fórm. [17]): comprova si la secció inferior compleix la caiguda de tensió en treballar per sota de {result.maxOperatingTempC} °C.
              </span>
            </label>
          </div>
        </div>

        {/* Right: Didactic Step-by-Step Solution + Highlighted Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <StepByStepView result={result} onViewIn3D={result.valid ? () => onInspectIn3D(result) : undefined} />

          <div className="card">
            <div className="card-header" style={{ marginBottom: showTable ? '1rem' : 0 }}>
              <h3 className="card-title">
                <Table2 size={17} color="var(--blue)" />
                Comprova el valor exacte a la taula normativa
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowTable((s) => !s)}>
                {showTable ? 'Amagar taula' : 'Mostrar taula ressaltada'}
              </button>
            </div>
            {showTable && result.valid && (
              <ReferenceTablesPanel
                key={`${input.material}-${input.method}-${result.effectivePhase}-${result.effectiveInsulation}-${result.sectionByAmpacity}`}
                highlightMaterial={input.material}
                highlightMethod={input.method}
                highlightPhase={result.effectivePhase}
                highlightInsulation={result.effectiveInsulation}
                highlightSection={result.sectionByAmpacity}
                initialTab={input.method === 'D' ? 'buried' : 'air'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

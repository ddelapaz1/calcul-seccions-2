import React, { useState } from 'react';
import {
  ConductorMaterial,
  GROUPING_COUNTS_AIR,
  INSTALLATION_METHODS,
  InstallationMethodId,
  InsulationType,
  PhaseSystem,
  STANDARD_SECTIONS,
  StandardSection,
  TABLE_A_ALUMINIUM,
  TABLE_A_COLUMN_MAP,
  TABLE_A_COPPER,
  TABLE_D_BURIED,
  TABLE_E_GROUPING,
  TABLE_G_ALUMINIUM,
  TABLE_G_COPPER,
  TABLE_H_BURIED_CONTACT,
  VOLTAGE_DROP_PRESETS,
} from '../data/itcBt19';

interface ReferenceTablesPanelProps {
  highlightMaterial?: ConductorMaterial;
  highlightMethod?: InstallationMethodId;
  highlightPhase?: PhaseSystem;
  highlightInsulation?: InsulationType;
  highlightSection?: StandardSection;
  initialTab?: 'air' | 'buried' | 'grouping' | 'drops' | 'pe';
}

const AIR_COLUMNS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
const AIR_METHODS: Exclude<InstallationMethodId, 'G' | 'D'>[] = ['A1', 'A2', 'B1', 'B2', 'C', 'E', 'F'];

export const ReferenceTablesPanel: React.FC<ReferenceTablesPanelProps> = ({
  highlightMaterial = 'Cu',
  highlightMethod,
  highlightPhase,
  highlightInsulation,
  highlightSection,
  initialTab = 'air',
}) => {
  const [tab, setTab] = useState<'air' | 'buried' | 'grouping' | 'drops' | 'pe'>(
    highlightMethod === 'D' ? 'buried' : initialTab
  );
  const [mat, setMat] = useState<ConductorMaterial>(highlightMaterial);

  const activeCol =
    highlightMethod &&
    highlightMethod !== 'D' &&
    highlightMethod !== 'G' &&
    highlightPhase &&
    highlightInsulation
      ? TABLE_A_COLUMN_MAP[highlightMethod][highlightPhase][highlightInsulation]
      : undefined;

  const airTable = mat === 'Cu' ? TABLE_A_COPPER : TABLE_A_ALUMINIUM;
  const gTable = mat === 'Cu' ? TABLE_G_COPPER : TABLE_G_ALUMINIUM;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        <div className="segmented" style={{ maxWidth: '640px' }}>
          <button className={`seg-btn ${tab === 'air' ? 'active' : ''}`} onClick={() => setTab('air')}>
            Aire 40 °C (Tabla A / G)
          </button>
          <button className={`seg-btn ${tab === 'buried' ? 'active' : ''}`} onClick={() => setTab('buried')}>
            Soterrats (Tabla D)
          </button>
          <button className={`seg-btn ${tab === 'grouping' ? 'active' : ''}`} onClick={() => setTab('grouping')}>
            Agrupació (E / H)
          </button>
          <button className={`seg-btn ${tab === 'drops' ? 'active' : ''}`} onClick={() => setTab('drops')}>
            Caiguda tensió
          </button>
          <button className={`seg-btn ${tab === 'pe' ? 'active' : ''}`} onClick={() => setTab('pe')}>
            Protecció PE
          </button>
        </div>

        {tab === 'air' && (
          <div className="segmented" style={{ width: '210px' }}>
            <button
              className={`seg-btn ${mat === 'Cu' ? 'active-copper' : ''}`}
              onClick={() => setMat('Cu')}
            >
              Coure (Cu)
            </button>
            <button
              className={`seg-btn ${mat === 'Al' ? 'active' : ''}`}
              onClick={() => setMat('Al')}
            >
              Alumini (Al)
            </button>
          </div>
        )}
      </div>

      {tab === 'air' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
            <strong>
              {mat === 'Cu'
                ? 'Tabla A (GUÍA-BT-19 / UNE 20460-5-523:2004, Coure a 40 °C a l’aire)'
                : 'Tabla A.52-1 bis (UNE 20460-5-523:2004, Alumini a 40 °C a l’aire, seccions ≥ 16 mm²)'}
            </strong>
            . Els circuits trifàsics s’indiquen com <span className="mono">3x</span> i els monofàsics com <span className="mono">2x</span>. Aïllament Z1 (poliolefina) equivalent a PVC.
          </div>

          <div className="table-wrap">
            <table className="data-table mono">
              <thead>
                <tr>
                  <th>Mètode</th>
                  {AIR_COLUMNS.map((c) => (
                    <th key={c} className={activeCol === c ? 'cell-col-hl' : ''}>
                      Col {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AIR_METHODS.map((m) => (
                  <tr key={m} className={highlightMethod === m ? 'cell-row-hl' : ''}>
                    <td>{m}</td>
                    {AIR_COLUMNS.map((c) => {
                      const map = TABLE_A_COLUMN_MAP[m];
                      let label = '';
                      if (map.trifasic.PVC === c) label = '3x PVC';
                      else if (map.monofasic.PVC === c) label = '2x PVC';
                      else if (map.trifasic.XLPE === c) label = '3x XLPE';
                      else if (map.monofasic.XLPE === c) label = '2x XLPE';
                      const isMatch =
                        highlightMethod === m && activeCol === c && highlightMaterial === mat;
                      return (
                        <td
                          key={c}
                          className={isMatch ? 'cell-exact-hl' : activeCol === c ? 'cell-col-hl' : ''}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {label}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <th style={{ background: '#e2e8f0' }}>Secció (mm²)</th>
                  {AIR_COLUMNS.map((c) => (
                    <th key={c} className={activeCol === c ? 'cell-col-hl' : ''}>
                      {c}
                    </th>
                  ))}
                </tr>
                {STANDARD_SECTIONS.filter((s) => (mat === 'Al' ? s >= 16 : true)).map((s) => {
                  const row = airTable[s];
                  const isRowHl = highlightSection === s && highlightMaterial === mat && highlightMethod !== 'G' && highlightMethod !== 'D';
                  return (
                    <tr key={s} className={isRowHl ? 'cell-row-hl' : ''}>
                      <td>{s.toString().replace('.', ',')}</td>
                      {AIR_COLUMNS.map((c) => {
                        const val = row?.[c] ?? null;
                        const isExact = isRowHl && activeCol === c;
                        return (
                          <td
                            key={c}
                            className={isExact ? 'cell-exact-hl' : activeCol === c ? 'cell-col-hl' : ''}
                          >
                            {val !== null ? val.toString().replace('.', ',') : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mètode G (Tabla 1 ITC-BT-19) */}
          <div className="table-wrap">
            <table className="data-table mono">
              <thead>
                <tr>
                  <th>Mètode G — Unipolars separats mínim D (3x, {mat === 'Cu' ? 'Coure' : 'Alumini'}, 40 °C)</th>
                  {[25, 35, 50, 70, 95, 120, 150, 185, 240, 300].map((s) => (
                    <th key={s}>{s} mm²</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>3x PVC (Col. 9 Tabla 1)</td>
                  {([25, 35, 50, 70, 95, 120, 150, 185, 240, 300] as StandardSection[]).map((s) => {
                    const isExact =
                      highlightMethod === 'G' &&
                      highlightInsulation === 'PVC' &&
                      highlightSection === s &&
                      highlightMaterial === mat;
                    return (
                      <td key={s} className={isExact ? 'cell-exact-hl' : ''}>
                        {gTable[s]?.PVC ?? '—'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td>3x XLPE / EPR (Col. 11 Tabla 1)</td>
                  {([25, 35, 50, 70, 95, 120, 150, 185, 240, 300] as StandardSection[]).map((s) => {
                    const isExact =
                      highlightMethod === 'G' &&
                      highlightInsulation === 'XLPE' &&
                      highlightSection === s &&
                      highlightMaterial === mat;
                    return (
                      <td key={s} className={isExact ? 'cell-exact-hl' : ''}>
                        {gTable[s]?.XLPE ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'buried' && (
        <div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: 0 }}>
            <strong>Tabla D (GUÍA-BT-19, pàg. 12)</strong> — Intensitat admissible (A) per a cables <strong>soterrats sota tub</strong> (0,6/1 kV, XLPE). Condicions: resistivitat tèrmica del terreny 1,5 K·m/W, temperatura del terreny 25 °C, profunditat 70 cm.
          </p>
          <div className="table-wrap">
            <table className="data-table mono">
              <thead>
                <tr>
                  <th>Secció (mm²)</th>
                  <th>3 XLPE · Coure</th>
                  <th>3 XLPE · Alumini</th>
                  <th>2 XLPE · Coure</th>
                  <th>2 XLPE · Alumini</th>
                </tr>
              </thead>
              <tbody>
                {STANDARD_SECTIONS.map((s) => {
                  const r = TABLE_D_BURIED[s];
                  const isRow = highlightMethod === 'D' && highlightSection === s;
                  return (
                    <tr key={s} className={isRow ? 'cell-row-hl' : ''}>
                      <td>{s.toString().replace('.', ',')}</td>
                      <td className={isRow && highlightPhase === 'trifasic' && highlightMaterial === 'Cu' ? 'cell-exact-hl' : ''}>
                        {r.trifasicCu ?? '—'}
                      </td>
                      <td className={isRow && highlightPhase === 'trifasic' && highlightMaterial === 'Al' ? 'cell-exact-hl' : ''}>
                        {r.trifasicAl ?? '—'}
                      </td>
                      <td className={isRow && highlightPhase === 'monofasic' && highlightMaterial === 'Cu' ? 'cell-exact-hl' : ''}>
                        {r.monofasicCu ?? '—'}
                      </td>
                      <td className={isRow && highlightPhase === 'monofasic' && highlightMaterial === 'Al' ? 'cell-exact-hl' : ''}>
                        {r.monofasicAl ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'grouping' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: 0 }}>
              <strong>Tabla E (GUÍA-BT-19 / UNE 20460-5-523 Tabla A.52-3)</strong> — Factors de reducció per agrupació de circuits contigus (no s’aplica si el tram paral·lel és &lt; 2 m).
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Disposició (Ref.)</th>
                    {GROUPING_COUNTS_AIR.map((n) => (
                      <th key={n} className="mono">
                        {n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {([1, 2, 3, 4, 5] as const).map((ref) => {
                    const row = TABLE_E_GROUPING[ref];
                    const isActiveRef =
                      highlightMethod && INSTALLATION_METHODS[highlightMethod].groupingRef === ref;
                    return (
                      <tr key={ref} className={isActiveRef ? 'cell-row-hl' : ''}>
                        <td style={{ whiteSpace: 'normal', minWidth: '240px' }}>
                          Ref. {ref}: {row.label}
                        </td>
                        {GROUPING_COUNTS_AIR.map((n) => (
                          <td key={n} className="mono">
                            {row.factors[n].toFixed(2).replace('.', ',')}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: 0 }}>
              <strong>Tabla H (GUÍA-BT-19)</strong> — Agrupació de cables en <strong>tubs enterrats en contacte</strong> (un cable/circuit per tub):
            </p>
            <div className="table-wrap">
              <table className="data-table mono">
                <thead>
                  <tr>
                    <th>N.º de tubs en contacte</th>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <th key={n}>{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Factor de reducció (distància nul·la)</td>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <td key={n}>{TABLE_H_BURIED_CONTACT[n].toFixed(2).replace('.', ',')}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'drops' && (
        <div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: 0 }}>
            <strong>Límits reglamentaris de caiguda de tensió</strong> (ITC-BT-14, ITC-BT-15, ITC-BT-19 i GUÍA-BT-ANEXO 2 Tabla 6):
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipus de circuit / tram</th>
                  <th>Normativa</th>
                  <th className="mono">Màxim (%)</th>
                  <th className="mono">Trifàsic (400 V)</th>
                  <th className="mono">Monofàsic (230 V)</th>
                </tr>
              </thead>
              <tbody>
                {VOLTAGE_DROP_PRESETS.map((p) => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'normal' }}>{p.label}</td>
                    <td>{p.itcRef}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      {p.maxDropPct.toString().replace('.', ',')} %
                    </td>
                    <td className="mono">{((p.maxDropPct / 100) * 400).toFixed(2).replace('.', ',')} V</td>
                    <td className="mono">
                      {p.id.startsWith('lga')
                        ? '—'
                        : `${((p.maxDropPct / 100) * 230).toFixed(2).replace('.', ',')} V`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'pe' && (
        <div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: 0 }}>
            <strong>Tabla 2 (ITC-BT-19, apartat 2.3)</strong> — Seccions mínimes dels conductors de protecció (PE) quan són del mateix metall que els conductors de fase:
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Secció dels conductors de fase S (mm²)</th>
                  <th>Secció mínima del conductor de protecció PE (mm²)</th>
                  <th>Exemples normalitzats</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">S ≤ 16</td>
                  <td className="mono" style={{ fontWeight: 700 }}>S (*)</td>
                  <td className="mono">1,5 → 1,5 · 2,5 → 2,5 · 6 → 6 · 16 → 16</td>
                </tr>
                <tr>
                  <td className="mono">16 &lt; S ≤ 35</td>
                  <td className="mono" style={{ fontWeight: 700 }}>16</td>
                  <td className="mono">25 → 16 · 35 → 16</td>
                </tr>
                <tr>
                  <td className="mono">S &gt; 35</td>
                  <td className="mono" style={{ fontWeight: 700 }}>S / 2</td>
                  <td className="mono">50 → 25 · 70 → 35 · 95 → 50 · 120 → 70 · 150 → 95</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.6rem' }}>
            (*) Mínim 2,5 mm² si el conductor de protecció no forma part de la canalització d’alimentació i té protecció mecànica; 4 mm² si no té protecció mecànica.
          </p>
        </div>
      )}
    </div>
  );
};

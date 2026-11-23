import React from 'react';
import { ArrowRight, BookOpen, Cable, Flame, Gauge, ShieldAlert, Thermometer, Zap } from 'lucide-react';
import { CONDUCTOR_COLORS, INSULATIONS, MATERIALS } from '../data/itcBt19';
import { ReferenceTablesPanel } from './ReferenceTablesPanel';

interface TheorySectionProps {
  onGoToCalculator: () => void;
  onGoToViewer: () => void;
}

export const TheorySection: React.FC<TheorySectionProps> = ({ onGoToCalculator, onGoToViewer }) => {
  return (
    <div>
      <div className="section-hero">
        <div>
          <span className="section-eyebrow">
            <BookOpen size={13} /> REBT · RD 842/2002 · ITC-BT-19 &amp; GUÍA-BT-ANEXO 2
          </span>
          <h1 className="section-title">Procediment per al càlcul de seccions de conductors</h1>
          <p className="section-lead">
            Determinar la secció reglamentària d’un cable consisteix a trobar la secció normalitzada mínima que satisfà simultàniament els tres criteris de seguretat i funcionament: <strong>escalfament</strong>, <strong>caiguda de tensió</strong> i <strong>curtcircuit</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onGoToCalculator}>
            Provar la calculadora <ArrowRight size={15} />
          </button>
          <button className="btn btn-outline" onClick={onGoToViewer}>
            Veure mètodes en 3D
          </button>
        </div>
      </div>

      {/* 3 Criteris Reglamentaris */}
      <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-copper">
              <Flame size={13} /> Criteri 1
            </span>
            <h3 style={{ margin: 0, fontSize: '0.98rem' }}>Intensitat màxima admissible</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
            En règim permanent, el conductor no ha de superar mai la temperatura màxima del seu aïllament (<strong>70 °C</strong> en PVC/Z1 o <strong>90 °C</strong> en XLPE/EPR). Depèn del material, del mètode d’instal·lació, la temperatura ambient i l’agrupació de circuits.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-blue">
              <Gauge size={13} /> Criteri 2
            </span>
            <h3 style={{ margin: 0, fontSize: '0.98rem' }}>Caiguda de tensió</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
            La diferència de tensió entre l’origen de la instal·lació i qualsevol receptor no pot superar els límits de la ITC-BT-19 (<strong>3%</strong> habitatges i enllumenat, <strong>5%</strong> força, <strong>4,5%/6,5%</strong> amb trafo propi). Sol ser determinant en línies llargues.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-amber">
              <ShieldAlert size={13} /> Criteri 3
            </span>
            <h3 style={{ margin: 0, fontSize: '0.98rem' }}>Curtcircuit i proteccions</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
            En curtcircuit (&lt; 5 s), el cable no pot superar <strong>160 °C</strong> (termoplàstics) o <strong>250 °C</strong> (termoestables). En baixa tensió queda garantit per la coordinació amb l’interruptor automàtic o fusible i la impedància de la línia.
          </p>
        </div>
      </div>

      {/* Procediment detallat en 6 passos */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Zap size={18} color="var(--blue)" />
            Seqüència de càlcul pas a pas
          </h2>
          <span className="badge badge-slate">ITC-BT-19 + GUÍA-BT-ANEXO 2</span>
        </div>

        <div className="grid-2">
          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">1</span>
                <h4 className="step-title">Intensitat de servei (I_b)</h4>
              </div>
              <span className="badge badge-slate">Monofàsic vs Trifàsic</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              A partir de la potència activa prevista <strong>P</strong> (W), la tensió nominal <strong>U</strong> (230 V o 400 V) i el factor de potència <strong>cos φ</strong>:
            </p>
            <div className="formula-box">
              <div>Monofàsic (230 V): I_b = P / (U · cos φ)</div>
              <div style={{ marginTop: '0.2rem' }}>Trifàsic (400 V):  I_b = P / (√3 · U · cos φ)</div>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              En trifàsic, per a una mateixa potència, la intensitat es divideix per tres respecte del sistema monofàsic equivalent.
            </p>
          </div>

          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">2</span>
                <h4 className="step-title">Factors de correcció (K_t i K_g)</h4>
              </div>
              <span className="badge badge-copper">Condicions reals</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              Les taules de la ITC-BT-19 estan calculades per a <strong>40 °C a l’aire</strong> (o <strong>25 °C en terreny</strong>) i <strong>1 sol circuit</strong>. Si canvien les condicions:
            </p>
            <div className="formula-box copper">
              <div>K_t = √((T_màx − T_amb) / (T_màx − T_ref))</div>
              <div style={{ marginTop: '0.2rem' }}>I' = I_b / (K_t · K_g)   (K_g de Tabla E o Tabla H)</div>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              No s’aplica K_g quan els circuits discorren paral·lels menys de 2 m.
            </p>
          </div>

          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">3</span>
                <h4 className="step-title">Secció per criteri tèrmic (S_I)</h4>
              </div>
              <span className="badge badge-blue">Taules A, G o D</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              Amb el mètode d’instal·lació (<strong>A1, A2, B1, B2, C, E, F, G</strong> o soterrat <strong>D</strong>), el nombre de conductors carregats (2x o 3x) i el tipus d’aïllament (PVC o XLPE), localitzem la columna a la taula i escollim la primera secció normalitzada amb <strong>I_taula ≥ I'</strong>.
            </p>
            <div className="formula-box">
              Condició tèrmica:  I_taula(S_I) · K_t · K_g ≥ I_b
            </div>
          </div>

          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">4</span>
                <h4 className="step-title">Secció per caiguda de tensió (S_ΔU)</h4>
              </div>
              <span className="badge badge-emerald">Anexo 2</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              Amb la caiguda màxima en volts <strong>e = (% / 100) · U</strong>, la longitud <strong>L</strong> (m) i la conductivitat <strong>γ</strong> a la temperatura de servei:
            </p>
            <div className="formula-box emerald">
              <div>Monofàsic: S_ΔU = (2 · P · L) / (γ · e · U)</div>
              <div style={{ marginTop: '0.2rem' }}>Trifàsic:  S_ΔU = (P · L) / (γ · e · U)</div>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              Opcionalment (2a iteració), es pot recalcular la temperatura real T = T_0 + (T_màx − T_0)·(I / I_màx)² per optimitzar seccions ajustades.
            </p>
          </div>

          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">5</span>
                <h4 className="step-title">Secció definitiva normalitzada</h4>
              </div>
              <span className="badge badge-slate">Normalització</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              S’escull la <strong>més gran</strong> de les dues seccions i s’arrodoneix a la secció normalitzada comercial immediatament superior:
            </p>
            <div className="formula-box">
              1,5 · 2,5 · 4 · 6 · 10 · 16 · 25 · 35 · 50 · 70 · 95 · 120 · 150 · 185 · 240 · 300 mm²
            </div>
          </div>

          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">6</span>
                <h4 className="step-title">Neutre, Protecció (PE) i colors</h4>
              </div>
              <span className="badge badge-slate">ITC-BT-19 2.2.4 &amp; 2.3</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              El neutre té com a mínim la mateixa secció que les fases (harmònics i desequilibris). El conductor PE segueix la <strong>Tabla 2</strong> (S si S≤16, 16 si 16&lt;S≤35, S/2 si S&gt;35).
            </p>
            <div className="wire-swatches">
              {CONDUCTOR_COLORS.map((c) => (
                <span key={c.role} className="wire-pill" style={{ fontSize: '0.73rem' }}>
                  <span
                    className={`wire-dot ${c.stripeHex ? 'pe' : ''}`}
                    style={c.stripeHex ? undefined : { backgroundColor: c.hex }}
                  />
                  {c.role}: {c.colorName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Propietats dels materials i aïllaments */}
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Cable size={17} color="var(--copper)" /> Material conductor: Coure vs Alumini
            </h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Propietat</th>
                  <th className="mono">Coure (Cu)</th>
                  <th className="mono">Alumini (Al)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Conductivitat γ a 20 °C</td>
                  <td className="mono">{MATERIALS.Cu.gamma20} m/Ω·mm²</td>
                  <td className="mono">{MATERIALS.Al.gamma20} m/Ω·mm²</td>
                </tr>
                <tr>
                  <td>Conductivitat γ a 70 °C (PVC/Z1)</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{MATERIALS.Cu.gamma70} m/Ω·mm²</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{MATERIALS.Al.gamma70} m/Ω·mm²</td>
                </tr>
                <tr>
                  <td>Conductivitat γ a 90 °C (XLPE/EPR)</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{MATERIALS.Cu.gamma90} m/Ω·mm²</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{MATERIALS.Al.gamma90} m/Ω·mm²</td>
                </tr>
                <tr>
                  <td>Resistivitat ρ a 20 °C</td>
                  <td className="mono">0,018 Ω·mm²/m</td>
                  <td className="mono">0,029 Ω·mm²/m</td>
                </tr>
                <tr>
                  <td>Coeficient α</td>
                  <td className="mono">0,00392 °C⁻¹</td>
                  <td className="mono">0,00403 °C⁻¹</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: 0 }}>
            <strong>Nota reglamentària:</strong> {MATERIALS.Cu.notes} {MATERIALS.Al.notes}
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Thermometer size={17} color="var(--blue)" /> Aïllaments i temperatura màxima
            </h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipus d’aïllament</th>
                  <th className="mono">T_màx permanent</th>
                  <th className="mono">T_màx curtcircuit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ whiteSpace: 'normal' }}>
                    <strong>{INSULATIONS.PVC.name}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 400 }}>
                      {INSULATIONS.PVC.examples}
                    </div>
                  </td>
                  <td className="mono" style={{ fontWeight: 700 }}>{INSULATIONS.PVC.maxTemp} °C</td>
                  <td className="mono">{INSULATIONS.PVC.shortCircuitTemp} °C</td>
                </tr>
                <tr>
                  <td style={{ whiteSpace: 'normal' }}>
                    <strong>{INSULATIONS.XLPE.name}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 400 }}>
                      {INSULATIONS.XLPE.examples}
                    </div>
                  </td>
                  <td className="mono" style={{ fontWeight: 700 }}>{INSULATIONS.XLPE.maxTemp} °C</td>
                  <td className="mono">{INSULATIONS.XLPE.shortCircuitTemp} °C</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: 0 }}>
            Un cable XLPE (90 °C) admet més intensitat que un cable PVC (70 °C) de la mateixa secció, però a plena càrrega té una conductivitat lleugerament inferior (γ₉₀ = 44 vs γ₇₀ = 48 en Cu) perquè la resistència augmenta amb la temperatura.
          </p>
        </div>
      </div>

      {/* Taules de referència interactives */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Taules oficials de referència (ITC-BT-19 / GUÍA-BT-19)</h2>
        </div>
        <ReferenceTablesPanel />
      </div>
    </div>
  );
};

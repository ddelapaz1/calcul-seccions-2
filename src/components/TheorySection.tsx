import React from 'react';
import { ArrowRight, BookOpen, Cable, Flame, Gauge, ShieldAlert, Thermometer, Zap } from 'lucide-react';
import { CONDUCTOR_COLORS, INSULATIONS, MATERIALS } from '../data/itcBt19';
import { ReferenceTablesPanel } from './ReferenceTablesPanel';
import { Tex } from './Tex';

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
      <div className="grid-3 criteria-grid" style={{ marginBottom: '1.25rem' }}>
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
                <h4 className="step-title">Intensitat de servei (<Tex>I_b</Tex>)</h4>
              </div>
              <span className="badge badge-slate">Monofàsic vs Trifàsic</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              A partir de la potència activa prevista <Tex>P</Tex> (W), la tensió nominal <Tex>U</Tex> (230 V o 400 V) i el factor de potència <Tex>\cos\varphi</Tex>:
            </p>
            <div className="formula-box">
              <Tex block>{String.raw`\text{Monofàsic (230 V):}\quad I_b = \dfrac{P}{U\cos\varphi}`}</Tex>
              <Tex block>{String.raw`\text{Trifàsic (400 V):}\quad I_b = \dfrac{P}{\sqrt{3}\,U\cos\varphi}`}</Tex>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              En trifàsic, per a una mateixa potència, la intensitat es divideix per tres respecte del sistema monofàsic equivalent.
            </p>
          </div>

          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">2</span>
                <h4 className="step-title">Factors de correcció (<Tex>K_t</Tex> i <Tex>K_g</Tex>)</h4>
              </div>
              <span className="badge badge-copper">Condicions reals</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              Les taules de la ITC-BT-19 estan calculades per a <strong>40 °C a l’aire</strong> (o <strong>25 °C en terreny</strong>) i <strong>1 sol circuit</strong>. Si canvien les condicions:
            </p>
            <div className="formula-box copper">
              <Tex block>{String.raw`K_t = \sqrt{\dfrac{T_{\text{màx}} - T_{\text{amb}}}{T_{\text{màx}} - T_{\text{ref}}}}`}</Tex>
              <Tex block>{String.raw`I' = \dfrac{I_b}{K_t \cdot K_g}\qquad \text{(}K_g\text{ de la Tabla E o la Tabla H)}`}</Tex>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              No s’aplica <Tex>K_g</Tex> quan els circuits discorren paral·lels menys de 2 m.
            </p>
          </div>

          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">3</span>
                <h4 className="step-title">Secció per criteri tèrmic (<Tex>S_I</Tex>)</h4>
              </div>
              <span className="badge badge-blue">Taules A, G o D</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              Amb el mètode d’instal·lació (<strong>A1, A2, B1, B2, C, E, F, G</strong> o soterrat <strong>D</strong>), el nombre de conductors carregats (2x o 3x) i el tipus d’aïllament (PVC o XLPE), localitzem la columna a la taula i escollim la primera secció normalitzada amb <Tex>{String.raw`I_{\text{taula}} \geq I'`}</Tex>.
            </p>
            <div className="formula-box">
              <Tex block>{String.raw`\text{Condició tèrmica:}\quad I_{\text{taula}}(S_I)\cdot K_t \cdot K_g \geq I_b`}</Tex>
            </div>
          </div>

          <div className="step-card" style={{ boxShadow: 'none' }}>
            <div className="step-head">
              <div className="step-num-wrap">
                <span className="step-num">4</span>
                <h4 className="step-title">Secció per caiguda de tensió (<Tex>{String.raw`S_{\Delta U}`}</Tex>)</h4>
              </div>
              <span className="badge badge-emerald">Anexo 2</span>
            </div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              Amb la caiguda màxima en volts <Tex>{String.raw`e = \frac{\%}{100}\cdot U`}</Tex>, la longitud <Tex>L</Tex> (m) i la conductivitat <Tex>\gamma</Tex> a la temperatura de servei:
            </p>
            <div className="formula-box emerald">
              <Tex block>{String.raw`\text{Monofàsic:}\quad S_{\Delta U} = \dfrac{2\cdot P\cdot L}{\gamma\cdot e\cdot U}`}</Tex>
              <Tex block>{String.raw`\text{Trifàsic:}\quad S_{\Delta U} = \dfrac{P\cdot L}{\gamma\cdot e\cdot U}`}</Tex>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              Opcionalment (2a iteració), es pot recalcular la temperatura real <Tex>{String.raw`T = T_0 + (T_{\text{màx}} - T_0)\left(\frac{I}{I_{\text{màx}}}\right)^2`}</Tex> per optimitzar seccions ajustades.
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
              <Tex block>{String.raw`S = \max\left(S_I,\ S_{\Delta U}\right) \;\rightarrow\; \text{secció normalitzada superior}`}</Tex>
              <div style={{ marginTop: '0.2rem' }}>1,5 · 2,5 · 4 · 6 · 10 · 16 · 25 · 35 · 50 · 70 · 95 · 120 · 150 · 185 · 240 · 300 mm²</div>
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
              El neutre té com a mínim la mateixa secció que les fases (harmònics i desequilibris). El conductor PE segueix la <strong>Tabla 2</strong> (<Tex>{String.raw`S_{PE} = S`}</Tex> si <Tex>{String.raw`S \leq 16`}</Tex>; <Tex>{String.raw`S_{PE} = 16`}</Tex> si <Tex>{String.raw`16 < S \leq 35`}</Tex>; <Tex>{String.raw`S_{PE} = S/2`}</Tex> si <Tex>{String.raw`S > 35`}</Tex>).
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

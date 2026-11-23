import React from 'react';
import { AlertTriangle, CheckCircle2, Flame, Gauge, Shield, Zap } from 'lucide-react';
import { CalculationResult } from '../engine/calculator';
import { CONDUCTOR_COLORS, INSULATIONS, INSTALLATION_METHODS, MATERIALS } from '../data/itcBt19';
import { Tex, tn, ts } from './Tex';

interface StepByStepViewProps {
  result: CalculationResult;
}

const fmt = (n: number, dec = 2) => n.toFixed(dec).replace('.', ',');

export const StepByStepView: React.FC<StepByStepViewProps> = ({ result }) => {
  if (!result.valid) {
    return (
      <div className="alert alert-red">
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>No es pot calcular la secció:</strong> {result.error}
        </div>
      </div>
    );
  }

  const { input } = result;
  const mat = MATERIALS[input.material];
  const ins = INSULATIONS[result.effectiveInsulation];
  const meth = INSTALLATION_METHODS[input.method];
  const isTri = result.effectivePhase === 'trifasic';

  const activeColors = isTri
    ? CONDUCTOR_COLORS
    : [CONDUCTOR_COLORS[0], CONDUCTOR_COLORS[3], CONDUCTOR_COLORS[4]];

  return (
    <div>
      {/* KPI Result Banner */}
      <div className="result-banner">
        <div>
          <div className="kpi-label">Secció normalitzada</div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>
            {result.finalSection.toString().replace('.', ',')} mm²
          </div>
          <div className="kpi-sub">
            {mat.name} ({mat.symbol}) · {result.effectiveInsulation}
          </div>
        </div>
        <div>
          <div className="kpi-label">Criteri determinant</div>
          <div className="kpi-value" style={{ fontSize: '1.1rem', marginTop: '0.35rem' }}>
            {result.governingCriterion === 'voltageDrop'
              ? 'Caiguda de tensió'
              : result.governingCriterion === 'ampacity'
                ? 'Intensitat admissible'
                : 'Ambdós per igual'}
          </div>
          <div className="kpi-sub">
            <Tex>{String.raw`S_I = ${ts(result.sectionByAmpacity)}\ \text{mm}^2`}</Tex> · <Tex>{String.raw`S_{\Delta U} = ${ts(result.sectionByDrop)}\ \text{mm}^2`}</Tex>
          </div>
        </div>
        <div>
          <div className="kpi-label">Caiguda de tensió real</div>
          <div className="kpi-value">
            {fmt(result.finalVoltageDropPct, 2)} %
          </div>
          <div className="kpi-sub">
            {fmt(result.finalVoltageDropV, 2)} V de màx. {fmt(result.maxVoltageDropV, 2)} V ({input.maxVoltageDropPct}%)
          </div>
        </div>
        <div>
          <div className="kpi-label">Neutre i Protecció</div>
          <div className="kpi-value" style={{ fontSize: '1.15rem', marginTop: '0.3rem' }}>
            N: {result.neutralSection} · PE: {result.protectiveSection} mm²
          </div>
          <div className="kpi-sub">
            I_màx ef. = {fmt(result.finalEffectiveAmpacity, 1)} A (I_b = {fmt(result.serviceCurrentA, 1)} A)
          </div>
        </div>
      </div>

      {/* Utilization Meters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="grid-2">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Flame size={15} color="var(--copper)" /> Sol·licitació tèrmica (I_b / I_màx)
              </span>
              <span className="mono" style={{ fontWeight: 700 }}>
                {fmt(result.thermalUtilizationPct, 1)}% ({fmt(result.serviceCurrentA, 1)} / {fmt(result.finalEffectiveAmpacity, 1)} A)
              </span>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{
                  width: `${Math.min(100, result.thermalUtilizationPct)}%`,
                  background: result.thermalUtilizationPct > 85 ? '#ea580c' : '#0f766e',
                }}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '0.3rem' }}>
              Temperatura estimada del conductor en servei: <strong className="mono">{fmt(result.finalEstimatedTempC, 1)} °C</strong> (màx. {result.maxOperatingTempC} °C)
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Gauge size={15} color="var(--blue)" /> Caiguda de tensió (ΔU / ΔU_màx)
              </span>
              <span className="mono" style={{ fontWeight: 700 }}>
                {fmt(result.voltageDropUtilizationPct, 1)}% ({fmt(result.finalVoltageDropPct, 2)}% / {input.maxVoltageDropPct}%)
              </span>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{
                  width: `${Math.min(100, result.voltageDropUtilizationPct)}%`,
                  background: result.voltageDropUtilizationPct > 88 ? '#d97706' : '#1d4ed8',
                }}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '0.3rem' }}>
              Marge disponible fins al límit reglamentari: <strong className="mono">{fmt(result.maxVoltageDropV - result.finalVoltageDropV, 2)} V</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings if any */}
      {result.warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {result.warnings.map((w, i) => (
            <div key={i} className="alert alert-amber">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step-by-step didactic breakdown */}
      <div className="steps-list">
        {/* Step 1 */}
        <div className="step-card">
          <div className="step-head">
            <div className="step-num-wrap">
              <span className="step-num">1</span>
              <h4 className="step-title">Càlcul de la intensitat de servei prevista (<Tex>I_b</Tex>)</h4>
            </div>
            <span className="step-result-pill"><Tex>{String.raw`I_b = ${tn(result.serviceCurrentA)}\ \text{A}`}</Tex></span>
          </div>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
            Partim de la potència activa <strong>P = {input.powerW.toLocaleString('ca-ES')} W</strong> ({fmt(input.powerW / 1000, 2)} kW), la tensió nominal <strong>U = {input.voltage} V</strong> ({isTri ? 'sistema trifàsic' : 'sistema monofàsic'}) i el factor de potència <strong>cos φ = {fmt(input.cosPhi, 2)}</strong>:
          </p>
          <div className="formula-box">
            <Tex block>
              {isTri
                ? String.raw`I_b = \dfrac{P}{\sqrt{3}\,U\cos\varphi} = \dfrac{${input.powerW}}{\sqrt{3}\cdot ${input.voltage}\cdot ${tn(input.cosPhi)}} = \hl{${tn(result.serviceCurrentA)}\ \text{A}}`
                : String.raw`I_b = \dfrac{P}{U\cos\varphi} = \dfrac{${input.powerW}}{${input.voltage}\cdot ${tn(input.cosPhi)}} = \hl{${tn(result.serviceCurrentA)}\ \text{A}}`}
            </Tex>
          </div>
        </div>

        {/* Step 2 */}
        <div className="step-card">
          <div className="step-head">
            <div className="step-num-wrap">
              <span className="step-num">2</span>
              <h4 className="step-title">Factors de correcció (temperatura i agrupació)</h4>
            </div>
            <span className="step-result-pill"><Tex>{String.raw`I' = ${tn(result.correctedCurrentA)}\ \text{A}`}</Tex></span>
          </div>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
            Si la temperatura {meth.isBuried ? 'del terreny' : 'ambient de l’aire'} difereix de la temperatura de referència de la taula ({meth.refTemp} °C) o si hi ha diversos circuits agrupats, corregim la intensitat a buscar a la taula dividint pels factors <Tex>K_t</Tex> i <Tex>K_g</Tex>:
          </p>
          <div className="formula-box copper">
            <div className="formula-note">
              Temperatura {input.ambientTemp} °C · referència {meth.refTemp} °C · <Tex>{String.raw`T_{\text{màx}} = ${result.maxOperatingTempC}\ ^{\circ}\text{C}`}</Tex>
            </div>
            <Tex block>{String.raw`K_t = \sqrt{\dfrac{T_{\text{màx}} - T_{\text{amb}}}{T_{\text{màx}} - T_{\text{ref}}}} = \sqrt{\dfrac{${result.maxOperatingTempC} - ${input.ambientTemp}}{${result.maxOperatingTempC} - ${meth.refTemp}}} = \hl{${tn(result.tempFactorKt)}}`}</Tex>
            <div className="formula-note">
              <Tex>K_g</Tex> ({result.groupingSource}) = <strong>{fmt(result.groupingFactorKg, 2)}</strong>
            </div>
            <Tex block>{String.raw`I' = \dfrac{I_b}{K_t\cdot K_g} = \dfrac{${tn(result.serviceCurrentA)}}{${tn(result.tempFactorKt)}\cdot ${tn(result.groupingFactorKg)}} = \hl{${tn(result.correctedCurrentA)}\ \text{A}}`}</Tex>
          </div>
        </div>

        {/* Step 3 */}
        <div className="step-card">
          <div className="step-head">
            <div className="step-num-wrap">
              <span className="step-num">3</span>
              <h4 className="step-title">Criteri 1: Intensitat màxima admissible (escalfament)</h4>
            </div>
            <span className="step-result-pill"><Tex>{String.raw`S_I = ${ts(result.sectionByAmpacity)}\ \text{mm}^2`}</Tex></span>
          </div>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
            Consultem la <strong>{result.ampacitySourceTable}</strong> per al mètode <strong>{meth.shortCode}</strong> ({meth.title.toLowerCase()}), conductor de <strong>{mat.name}</strong> i aïllament <strong>{ins.shortName}</strong>:
          </p>
          <div className="formula-box">
            <div>Columna de consulta: <strong>{result.ampacityColumnLabel}</strong></div>
            <div style={{ marginTop: '0.25rem' }}>
              Primera secció normalitzada amb <Tex>{String.raw`I_{\text{taula}} \geq I' = ${tn(result.correctedCurrentA)}\ \text{A}`}</Tex>:
            </div>
            <Tex block>{String.raw`S_I = \hl{${ts(result.sectionByAmpacity)}\ \text{mm}^2}\qquad I_{\text{taula}} = ${result.baseAmpacityAtThermalSection}\ \text{A}`}</Tex>
            <Tex block>{String.raw`I_{\text{màx,ef}} = I_{\text{taula}}\cdot K_t\cdot K_g = ${tn(result.effectiveAmpacityAtThermalSection, 1)}\ \text{A} \geq I_b = ${tn(result.serviceCurrentA)}\ \text{A}`}</Tex>
          </div>
        </div>

        {/* Step 4 */}
        <div className="step-card">
          <div className="step-head">
            <div className="step-num-wrap">
              <span className="step-num">4</span>
              <h4 className="step-title">Criteri 2: Caiguda de tensió màxima admissible</h4>
            </div>
            <span className="step-result-pill"><Tex>{String.raw`S_{\Delta U} = ${ts(result.sectionByDrop)}\ \text{mm}^2`}</Tex></span>
          </div>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
            Segons la ITC-BT-19 (2.2.2) i el <strong>GUÍA-BT-ANEXO 2</strong>, la caiguda de tensió màxima admesa és del <strong>{input.maxVoltageDropPct}%</strong> de {input.voltage} V (<Tex>{String.raw`e = ${tn(result.maxVoltageDropV)}\ \text{V}`}</Tex>). Prenem la conductivitat del {mat.name.toLowerCase()} a temperatura màxima de servei ({result.maxOperatingTempC} °C): <Tex>{String.raw`\gamma = ${ts(result.gammaAtMaxTemp)}\ \text{m}/(\Omega\cdot\text{mm}^2)`}</Tex>.
          </p>
          <div className="formula-box emerald">
            <Tex block>
              {isTri
                ? String.raw`S_{\Delta U} = \dfrac{P\cdot L}{\gamma\cdot e\cdot U} = \dfrac{${input.powerW}\cdot ${ts(input.lengthM)}}{${ts(result.gammaAtMaxTemp)}\cdot ${tn(result.maxVoltageDropV)}\cdot ${input.voltage}} = \hl{${tn(result.theoreticalSectionByDrop)}\ \text{mm}^2}`
                : String.raw`S_{\Delta U} = \dfrac{2\cdot P\cdot L}{\gamma\cdot e\cdot U} = \dfrac{2\cdot ${input.powerW}\cdot ${ts(input.lengthM)}}{${ts(result.gammaAtMaxTemp)}\cdot ${tn(result.maxVoltageDropV)}\cdot ${input.voltage}} = \hl{${tn(result.theoreticalSectionByDrop)}\ \text{mm}^2}`}
            </Tex>
            <div style={{ marginTop: '0.25rem' }}>
              Secció normalitzada immediatament superior: <strong>{result.sectionByDrop.toString().replace('.', ',')} mm²</strong>
            </div>
          </div>

          {result.realTempIteration && (
            <div
              className={`alert ${result.realTempIteration.complies ? 'alert-emerald' : 'alert-blue'}`}
              style={{ marginTop: '0.7rem' }}
            >
              <Zap size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Segona iteració a temperatura real (GUÍA-BT-ANEXO 2, fórmula [17]):</strong> provem la secció immediatament inferior (<strong>{result.realTempIteration.candidateSection} mm²</strong>, <Tex>{String.raw`I_{\text{màx}} = ${tn(result.realTempIteration.candidateAmpacity, 1)}\ \text{A}`}</Tex>). A la càrrega real, el conductor treballa a{' '}
                <strong className="mono">{fmt(result.realTempIteration.estimatedTempC, 1)} °C</strong> (<Tex>{String.raw`\gamma_{\text{real}} = ${tn(result.realTempIteration.gammaReal)}\ \text{m}/(\Omega\cdot\text{mm}^2)`}</Tex>), donant <Tex>\Delta U</Tex> ={' '}
                <strong className="mono">{fmt(result.realTempIteration.voltageDropV, 2)} V ({fmt(result.realTempIteration.voltageDropPct, 2)}%)</strong>.{' '}
                {result.realTempIteration.complies
                  ? `Com que no supera ${input.maxVoltageDropPct}%, es pot optimitzar a ${result.realTempIteration.candidateSection} mm²!`
                  : `Supera el límit del ${input.maxVoltageDropPct}%, per tant es manté ${result.sectionByDrop} mm².`}
              </div>
            </div>
          )}
        </div>

        {/* Step 5 */}
        <div className="step-card">
          <div className="step-head">
            <div className="step-num-wrap">
              <span className="step-num">5</span>
              <h4 className="step-title">Selecció definitiva de la secció normalitzada</h4>
            </div>
            <span className="step-result-pill" style={{ background: 'var(--emerald-soft)', color: 'var(--emerald)', borderColor: 'var(--emerald-border)' }}>
              S = {result.finalSection.toString().replace('.', ',')} mm²
            </span>
          </div>
          <p style={{ margin: '0 0 0.55rem', fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
            Cal escollir la <strong>secció més gran</strong> entre el criteri tèrmic i el de caiguda de tensió perquè el cable compleixi simultàniament totes les condicions reglamentàries (incloent la verificació de curtcircuit amb la protecció magnetotèrmica/fusible corresponent):
          </p>
          <div className="alert alert-emerald">
            <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <Tex>{String.raw`S_{\text{definitiva}} = \max(S_I,\ S_{\Delta U}) = \mathbf{${ts(result.finalSection)}\ mm^2}`}</Tex> ({mat.name}, {result.effectiveInsulation}). Intensitat admissible efectiva: <strong className="mono">{fmt(result.finalEffectiveAmpacity, 1)} A</strong> (≥ {fmt(result.serviceCurrentA, 2)} A) · Caiguda de tensió real: <strong className="mono">{fmt(result.finalVoltageDropV, 2)} V ({fmt(result.finalVoltageDropPct, 2)}%)</strong> (≤ {input.maxVoltageDropPct}%).
            </div>
          </div>
        </div>

        {/* Step 6 */}
        <div className="step-card">
          <div className="step-head">
            <div className="step-num-wrap">
              <span className="step-num">6</span>
              <h4 className="step-title">Conductor neutre, protecció (PE) i identificació per colors</h4>
            </div>
            <span className="step-result-pill">
              <Shield size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              PE = {result.protectiveSection.toString().replace('.', ',')} mm²
            </span>
          </div>
          <p style={{ margin: '0 0 0.65rem', fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>
            • <strong>Neutre (ITC-BT-19 2.2.2):</strong> secció mínima igual a la de fase ({result.neutralSection} mm²) per tenir en compte harmònics i desequilibris.<br />
            • <strong>Conductor de protecció PE (ITC-BT-19 Tabla 2):</strong> per a S = {result.finalSection} mm² del mateix metall, correspon{' '}
            <Tex>
              {result.finalSection <= 16
                ? String.raw`S_{PE} = S = ${ts(result.protectiveSection)}\ \text{mm}^2`
                : result.finalSection <= 35
                  ? String.raw`S_{PE} = 16\ \text{mm}^2\ \ (16 < S \leq 35)`
                  : String.raw`S_{PE} \geq S/2 = ${tn(result.finalSection / 2, 1)}\ \text{mm}^2 \rightarrow ${ts(result.protectiveSection)}\ \text{mm}^2`}
            </Tex>.<br />
            • <strong>Identificació obligatòria (ITC-BT-19 2.2.4):</strong>
          </p>
          <div className="wire-swatches">
            {activeColors.map((c) => (
              <span key={c.role} className="wire-pill">
                <span
                  className={`wire-dot ${c.stripeHex ? 'pe' : ''}`}
                  style={c.stripeHex ? undefined : { backgroundColor: c.hex }}
                />
                <span>
                  <strong>{c.role}:</strong> {c.colorName}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  HelpCircle,
  RefreshCw,
  Table2,
  X,
  XCircle,
} from 'lucide-react';
import {
  ConductorMaterial,
  INSULATIONS,
  INSTALLATION_METHODS,
  MATERIALS,
  STANDARD_SECTIONS,
} from '../data/itcBt19';
import {
  ExerciseDifficulty,
  ExerciseGrade,
  GeneratedExercise,
  StudentAnswers,
  formatSectionLabel,
  generateRandomExercise,
  gradeExercise,
} from '../engine/exerciseGenerator';
import type { CalculationResult } from '../engine/calculator';
import { StepByStepView } from './StepByStepView';
import { ReferenceTablesPanel } from './ReferenceTablesPanel';
import { Tex, tn } from './Tex';

const EMPTY_ANSWERS: StudentAnswers = {
  serviceCurrentA: '',
  sectionByAmpacity: '',
  theoreticalSectionByDrop: '',
  finalSection: '',
  protectiveSection: '',
};

interface ExercisesSectionProps {
  /** Obre la solució de l'exercici al visor 3D amb el mapa tèrmic */
  onInspectIn3D?: (result: CalculationResult) => void;
}

export const ExercisesSection: React.FC<ExercisesSectionProps> = ({ onInspectIn3D }) => {
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>('intermedi');
  const [materialPref, setMaterialPref] = useState<'random' | ConductorMaterial>('random');
  const [exercise, setExercise] = useState<GeneratedExercise>(() =>
    generateRandomExercise('intermedi', 'random')
  );
  const [answers, setAnswers] = useState<StudentAnswers>(EMPTY_ANSWERS);
  const [grade, setGrade] = useState<ExerciseGrade | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showTablesModal, setShowTablesModal] = useState(false);
  const [stats, setStats] = useState({ attempted: 0, perfect: 0, streak: 0 });
  const [gradedCurrentId, setGradedCurrentId] = useState<string | null>(null);

  const handleNewExercise = (
    nextDiff: ExerciseDifficulty = difficulty,
    nextMat: 'random' | ConductorMaterial = materialPref
  ) => {
    const next = generateRandomExercise(nextDiff, nextMat);
    setExercise(next);
    setAnswers(EMPTY_ANSWERS);
    setGrade(null);
    setShowHint(false);
    setShowSolution(false);
    setGradedCurrentId(null);
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const res = gradeExercise(exercise, answers);
    setGrade(res);
    if (gradedCurrentId !== exercise.id) {
      setGradedCurrentId(exercise.id);
      setStats((prev) => ({
        attempted: prev.attempted + 1,
        perfect: prev.perfect + (res.allCorrect ? 1 : 0),
        streak: res.allCorrect ? prev.streak + 1 : 0,
      }));
    }
  };

  const { input, solution } = exercise;
  const mat = MATERIALS[input.material];
  const ins = INSULATIONS[solution.effectiveInsulation];
  const meth = INSTALLATION_METHODS[input.method];

  const fieldFeedback = (key: keyof StudentAnswers) =>
    grade?.fields.find((f) => f.field === key);

  return (
    <div>
      <div className="section-hero">
        <div>
          <span className="section-eyebrow">
            <ClipboardCheck size={13} /> Pràctica autocorregible (Cu / Al)
          </span>
          <h1 className="section-title">Generador d’exercicis aleatoris</h1>
          <p className="section-lead">
            Resol l’exercici consultant les taules de la ITC-BT-19, introdueix els teus càlculs i la secció del cable normalitzat, i comprova a l’instant si el dimensionament és correcte.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div className="badge badge-emerald" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <Award size={15} />
            Encerts complets: <strong className="mono">{stats.perfect}/{stats.attempted}</strong>
            {stats.streak > 1 && <span> · Ratxa: {stats.streak}</span>}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowTablesModal(true)}>
            <Table2 size={15} /> Consultar Taules ITC-BT-19
          </button>
        </div>
      </div>

      {/* Controls de generació */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div className="field-label" style={{ marginBottom: '0.25rem' }}>Nivell de dificultat</div>
              <div className="segmented" style={{ width: '285px' }}>
                {(
                  [
                    ['basic', 'Bàsic'],
                    ['intermedi', 'Intermedi'],
                    ['avancat', 'Avançat'],
                  ] as const
                ).map(([d, label]) => (
                  <button
                    key={d}
                    className={`seg-btn ${difficulty === d ? 'active' : ''}`}
                    onClick={() => {
                      setDifficulty(d);
                      handleNewExercise(d, materialPref);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="field-label" style={{ marginBottom: '0.25rem' }}>Material conductor</div>
              <div className="segmented" style={{ width: '295px' }}>
                {(
                  [
                    ['random', 'Aleatori (Cu/Al)'],
                    ['Cu', 'Coure (Cu)'],
                    ['Al', 'Alumini (Al)'],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    className={`seg-btn ${materialPref === m ? (m === 'Cu' ? 'active-copper' : 'active') : ''}`}
                    onClick={() => {
                      setMaterialPref(m);
                      handleNewExercise(difficulty, m);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-copper" onClick={() => handleNewExercise()}>
            <RefreshCw size={15} /> Nou exercici aleatori
          </button>
        </div>
      </div>

      {/* Enunciat + Formulari de respostes */}
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: '1.25rem' }}>
        {/* Left: Exercise statement & parameter table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <BookOpen size={17} color="var(--blue)" />
              {exercise.title}
            </h2>
            <span className={`badge ${input.material === 'Cu' ? 'badge-copper' : 'badge-blue'}`}>
              {exercise.contextBadge}
            </span>
          </div>

          <p style={{ fontSize: '0.94rem', lineHeight: 1.65, color: 'var(--ink)', marginTop: 0 }}>
            {exercise.statement}
          </p>

          <div className="table-wrap" style={{ marginTop: '0.9rem' }}>
            <table className="data-table">
              <tbody>
                <tr>
                  <td>Sistema i tensió</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {input.phase === 'trifasic' ? 'Trifàsic 400 V (3x)' : 'Monofàsic 230 V (2x)'}
                  </td>
                </tr>
                <tr>
                  <td>Potència activa prevista (P)</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {(input.powerW / 1000).toFixed(2).replace('.', ',')} kW ({input.powerW.toLocaleString('ca-ES')} W)
                  </td>
                </tr>
                <tr>
                  <td>Factor de potència (<Tex>\cos\varphi</Tex>)</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {input.cosPhi.toFixed(2).replace('.', ',')}
                  </td>
                </tr>
                <tr>
                  <td>Longitud de la línia (L)</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {input.lengthM} m
                  </td>
                </tr>
                <tr>
                  <td>Caiguda de tensió màxima admissible</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {input.maxVoltageDropPct.toString().replace('.', ',')} % ({solution.maxVoltageDropV.toFixed(2).replace('.', ',')} V)
                  </td>
                </tr>
                <tr>
                  <td>Material i aïllament</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {mat.name} ({mat.symbol}) · {ins.shortName}
                  </td>
                </tr>
                <tr>
                  <td>Mètode d’instal·lació</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    <span className="mono">{meth.shortCode}</span> ({meth.table1Code})
                  </td>
                </tr>
                <tr>
                  <td>{meth.isBuried ? 'Temperatura del terreny' : 'Temperatura ambient'}</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {input.ambientTemp} °C {input.ambientTemp !== meth.refTemp ? `(ref. ${meth.refTemp} °C)` : '(referència)'}
                  </td>
                </tr>
                <tr>
                  <td>Circuits agrupats</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {input.groupedCircuits === 1 ? '1 (sense agrupació)' : `${input.groupedCircuits} circuits`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowHint((h) => !h)}
            >
              <HelpCircle size={14} /> {showHint ? 'Amagar pista' : 'Mostrar pista'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowTablesModal(true)}
            >
              <Table2 size={14} /> Obrir Taules ITC-BT-19
            </button>
          </div>

          {showHint && (
            <div className="alert alert-blue" style={{ marginTop: '0.8rem' }}>
              <HelpCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.82rem' }}>
                <strong>Pista:</strong> Usa la fórmula{' '}
                <Tex>
                  {input.phase === 'trifasic'
                    ? String.raw`I = \dfrac{P}{\sqrt{3}\,U\cos\varphi}`
                    : String.raw`I = \dfrac{P}{U\cos\varphi}`}
                </Tex>
                .{' '}
                {(solution.tempFactorKt !== 1 || solution.groupingFactorKg !== 1) && (
                  <>
                    Aplica els factors <Tex>{String.raw`K_t = ${tn(solution.tempFactorKt)}`}</Tex> i{' '}
                    <Tex>{String.raw`K_g = ${tn(solution.groupingFactorKg)}`}</Tex> abans de buscar a{' '}
                    <strong>{solution.ampacityColumnLabel}</strong>.{' '}
                  </>
                )}
                Per a caiguda de tensió, recorda que per a {mat.name} a {solution.maxOperatingTempC} °C la conductivitat és{' '}
                <Tex>{String.raw`\gamma = ${String(solution.gammaAtMaxTemp).replace('.', '{,}')}\ \text{m}/(\Omega\cdot\text{mm}^2)`}</Tex>.
              </div>
            </div>
          )}
        </div>

        {/* Right: Student Answer Form */}
        <form className="card" onSubmit={handleCheck}>
          <div className="card-header">
            <h2 className="card-title">Les teves respostes</h2>
            {grade && (
              <span className={`badge ${grade.allCorrect ? 'badge-emerald' : 'badge-amber'}`}>
                Resultat: {grade.score} / {grade.total}
              </span>
            )}
          </div>

          <div className="form-stack">
            {/* 1. Intensitat */}
            <div className="field-group">
              <label className="field-label">
                <span>1. Intensitat de servei <Tex>I</Tex> (A)</span>
                <span className="field-hint">Tolerància ±2,5%</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex. 42,50"
                className="input mono"
                value={answers.serviceCurrentA}
                onChange={(e) => setAnswers((a) => ({ ...a, serviceCurrentA: e.target.value }))}
              />
              {fieldFeedback('serviceCurrentA') && (
                <FeedbackLine item={fieldFeedback('serviceCurrentA')!} />
              )}
            </div>

            {/* 2. Secció per intensitat */}
            <div className="field-group">
              <label className="field-label">
                <span>2. Secció normalitzada per criteri d’intensitat <Tex>S_I</Tex> (mm²)</span>
              </label>
              <select
                className="select mono"
                value={answers.sectionByAmpacity}
                onChange={(e) => setAnswers((a) => ({ ...a, sectionByAmpacity: e.target.value }))}
              >
                <option value="">— Selecciona una secció —</option>
                {STANDARD_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {formatSectionLabel(s)}
                  </option>
                ))}
              </select>
              {fieldFeedback('sectionByAmpacity') && (
                <FeedbackLine item={fieldFeedback('sectionByAmpacity')!} />
              )}
            </div>

            {/* 3. Secció teòrica caiguda de tensió */}
            <div className="field-group">
              <label className="field-label">
                <span>3. Secció teòrica per caiguda de tensió <Tex>{String.raw`S_{\Delta U}`}</Tex> (mm²)</span>
                <span className="field-hint">Valor calculat amb decimals</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex. 12,45"
                className="input mono"
                value={answers.theoreticalSectionByDrop}
                onChange={(e) => setAnswers((a) => ({ ...a, theoreticalSectionByDrop: e.target.value }))}
              />
              {fieldFeedback('theoreticalSectionByDrop') && (
                <FeedbackLine item={fieldFeedback('theoreticalSectionByDrop')!} />
              )}
            </div>

            {/* 4. Secció normalitzada final */}
            <div className="field-group">
              <label className="field-label">
                <span>4. Secció normalitzada final del conductor actiu (mm²)</span>
              </label>
              <select
                className="select mono"
                value={answers.finalSection}
                onChange={(e) => setAnswers((a) => ({ ...a, finalSection: e.target.value }))}
              >
                <option value="">— Selecciona el cable normalitzat —</option>
                {STANDARD_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {formatSectionLabel(s)}
                  </option>
                ))}
              </select>
              {fieldFeedback('finalSection') && (
                <FeedbackLine item={fieldFeedback('finalSection')!} />
              )}
            </div>

            {/* 5. Conductor de protecció PE */}
            <div className="field-group">
              <label className="field-label">
                <span>5. Secció mínima del conductor de protecció PE (mm²)</span>
                <span className="field-hint">Tabla 2 ITC-BT-19</span>
              </label>
              <select
                className="select mono"
                value={answers.protectiveSection}
                onChange={(e) => setAnswers((a) => ({ ...a, protectiveSection: e.target.value }))}
              >
                <option value="">— Selecciona la secció PE —</option>
                {STANDARD_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {formatSectionLabel(s)}
                  </option>
                ))}
              </select>
              {fieldFeedback('protectiveSection') && (
                <FeedbackLine item={fieldFeedback('protectiveSection')!} />
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <CheckCircle2 size={16} /> Comprovar resultats
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowSolution((s) => !s)}
              >
                <Eye size={15} /> {showSolution ? 'Amagar resolució' : 'Veure resolució pas a pas'}
              </button>
            </div>

            {grade && (
              <div className={`alert ${grade.allCorrect ? 'alert-emerald' : 'alert-amber'}`}>
                {grade.allCorrect ? (
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <XCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                )}
                <div>
                  {grade.allCorrect ? (
                    <>
                      <strong>Excel·lent!</strong> Has encertat tots els càlculs i la selecció del cable normalitzat ({solution.finalSection} mm² {mat.symbol} + PE {solution.protectiveSection} mm²).
                    </>
                  ) : (
                    <>
                      Has encertat <strong>{grade.score} de {grade.total}</strong> apartats. Revisa els comentaris de cada camp o prem <em>Veure resolució pas a pas</em> per comprovar el procediment.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Resolució completa pas a pas */}
      {showSolution && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Resolució pas a pas de l’exercici</h3>
            <button className="btn btn-copper btn-sm" onClick={() => handleNewExercise()}>
              <RefreshCw size={14} /> Següent exercici
            </button>
          </div>
          <StepByStepView result={solution} onViewIn3D={onInspectIn3D ? () => onInspectIn3D(solution) : undefined} />
        </div>
      )}

      {/* Modal Taules ITC-BT-19 */}
      {showTablesModal && (
        <div className="modal-backdrop" onClick={() => setShowTablesModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">
                <Table2 size={18} color="var(--blue)" />
                Taules de referència ITC-BT-19 / GUÍA-BT-19
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowTablesModal(false)}>
                <X size={15} /> Tancar
              </button>
            </div>
            <ReferenceTablesPanel
              highlightMaterial={input.material}
              initialTab={input.method === 'D' ? 'buried' : 'air'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const FeedbackLine: React.FC<{ item: ExerciseGrade['fields'][number] }> = ({ item }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.35rem',
      fontSize: '0.77rem',
      color: item.correct ? 'var(--emerald)' : 'var(--red)',
      fontWeight: 600,
      marginTop: '0.15rem',
    }}
  >
    {item.correct ? (
      <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 2 }} />
    ) : (
      <XCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
    )}
    <span>{item.feedback}</span>
  </div>
);

import React, { useState } from 'react';
import { BookOpen, Box, Calculator, ClipboardCheck, Zap } from 'lucide-react';
import { InstallationMethodId } from './data/itcBt19';
import { TheorySection } from './components/TheorySection';
import { CalculatorSection } from './components/CalculatorSection';
import { ExercisesSection } from './components/ExercisesSection';
import { Installation3DViewer } from './components/Installation3DViewer';

type AppTab = 'theory' | 'calculator' | 'exercises' | 'viewer3d';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('theory');
  const [viewerMethod, setViewerMethod] = useState<InstallationMethodId>('B1');

  const handleInspectIn3D = (method: InstallationMethodId) => {
    setViewerMethod(method);
    setActiveTab('viewer3d');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">
              <Zap size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="brand-title">ITC-BT-19 · Càlcul de Seccions</h1>
              <div className="brand-subtitle">REBT (RD 842/2002) · GUÍA-BT-19 &amp; Anexo 2</div>
            </div>
          </div>

          <nav className="nav-tabs" aria-label="Apartats de l'aplicació">
            <button
              className={`nav-tab ${activeTab === 'theory' ? 'active' : ''}`}
              onClick={() => setActiveTab('theory')}
            >
              <BookOpen size={16} />
              <span>1. Procediment i Taules</span>
            </button>
            <button
              className={`nav-tab ${activeTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculator')}
            >
              <Calculator size={16} />
              <span>2. Calculadora Pas a Pas</span>
            </button>
            <button
              className={`nav-tab ${activeTab === 'exercises' ? 'active' : ''}`}
              onClick={() => setActiveTab('exercises')}
            >
              <ClipboardCheck size={16} />
              <span>3. Exercicis Aleatoris</span>
            </button>
            <button
              className={`nav-tab ${activeTab === 'viewer3d' ? 'active' : ''}`}
              onClick={() => setActiveTab('viewer3d')}
            >
              <Box size={16} />
              <span>4. Instal·lacions en 3D</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'theory' && (
          <TheorySection
            onGoToCalculator={() => setActiveTab('calculator')}
            onGoToViewer={() => setActiveTab('viewer3d')}
          />
        )}
        {activeTab === 'calculator' && (
          <CalculatorSection onInspectMethodIn3D={handleInspectIn3D} />
        )}
        {activeTab === 'exercises' && <ExercisesSection />}
        {activeTab === 'viewer3d' && (
          <Installation3DViewer
            selectedMethod={viewerMethod}
            onSelectMethod={setViewerMethod}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span>
            Basat en la documentació oficial del <strong>REBT (RD 842/2002)</strong>: ITC-BT-19, GUÍA-BT-19 (Rev. 2) i GUÍA-BT-ANEXO 2 (Rev. 2, febrer 2026).
          </span>
          <span className="mono">Coure (Cu) · Alumini (Al) · 230 V / 400 V</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

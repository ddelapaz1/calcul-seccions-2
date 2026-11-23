import React, { useState } from 'react';
import { BookOpen, Box, Calculator, ClipboardCheck, ExternalLink, FileText, Zap, type LucideIcon } from 'lucide-react';
import { InstallationMethodId } from './data/itcBt19';
import { TheorySection } from './components/TheorySection';
import { CalculatorSection } from './components/CalculatorSection';
import { ExercisesSection } from './components/ExercisesSection';
import { Installation3DViewer } from './components/Installation3DViewer';

type AppTab = 'theory' | 'calculator' | 'exercises' | 'viewer3d';

const TABS: { id: AppTab; label: string; icon: LucideIcon }[] = [
  { id: 'theory', label: 'Procediment i taules', icon: BookOpen },
  { id: 'calculator', label: 'Calculadora pas a pas', icon: Calculator },
  { id: 'exercises', label: 'Exercicis aleatoris', icon: ClipboardCheck },
  { id: 'viewer3d', label: 'Instal·lacions en 3D', icon: Box },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('theory');
  const [viewerMethod, setViewerMethod] = useState<InstallationMethodId>('B1');

  const goTo = (tab: AppTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInspectIn3D = (method: InstallationMethodId) => {
    setViewerMethod(method);
    goTo('viewer3d');
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
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`nav-tab ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => goTo(tab.id)}
                >
                  <span className="nav-icon">
                    <Icon size={15} />
                  </span>
                  <span className="nav-num">0{idx + 1}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <div className="tab-panel" key={activeTab}>
          {activeTab === 'theory' && (
            <TheorySection onGoToCalculator={() => goTo('calculator')} onGoToViewer={() => goTo('viewer3d')} />
          )}
          {activeTab === 'calculator' && <CalculatorSection onInspectMethodIn3D={handleInspectIn3D} />}
          {activeTab === 'exercises' && <ExercisesSection />}
          {activeTab === 'viewer3d' && (
            <Installation3DViewer selectedMethod={viewerMethod} onSelectMethod={setViewerMethod} />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span>
            Basat en la documentació oficial del <strong>REBT (RD 842/2002)</strong>: ITC-BT-19, GUÍA-BT-19 (Rev. 2) i
            GUÍA-BT-ANEXO 2 (Rev. 2, febrer 2026).
          </span>
          <span className="footer-links">
            <a
              href="https://github.com/ddelapaz1/calcul-seccions-2/tree/main/docs"
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={13} /> Documentació normativa
            </a>
            <a href="https://ddelapaz1.github.io/#modul-0962">
              <ExternalLink size={13} /> ddelapazhub · Mòdul 0962
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;

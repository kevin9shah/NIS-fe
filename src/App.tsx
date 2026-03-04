import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Training from './pages/Training.tsx';
import Detection from './pages/Detection.tsx';
import Explainability from './pages/Explainability.tsx';
import Simulation from './pages/Simulation.tsx';
import Alerts from './pages/Alerts.tsx';

export interface AppState {
  sessionId: string | null;
  modelId: string | null;
  predictions: any[] | null;
  qttaSummary: any | null;
  shapData: any | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    sessionId: null,
    modelId: null,
    predictions: null,
    qttaSummary: null,
    shapData: null,
  });

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark text-slate-300">
        <Navbar modelReady={!!state.modelId} />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home state={state} updateState={updateState} />} />
            <Route path="/training" element={<Training state={state} updateState={updateState} />} />
            <Route path="/detection" element={<Detection state={state} updateState={updateState} />} />
            <Route path="/explainability" element={<Explainability state={state} updateState={updateState} />} />
            <Route path="/simulation" element={<Simulation state={state} updateState={updateState} />} />
            <Route path="/alerts" element={<Alerts state={state} updateState={updateState} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import TopTicker from './components/TopTicker';
import { CurrencyProvider } from './context/CurrencyContext';
import Markets from './pages/Markets';
import News from './pages/News';

function App() {
  return (
    <CurrencyProvider>
      <Router>
        <div className="flex h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden relative selection:bg-blue-500/30">
          {/* Subtle background glow effect */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none"></div>
          
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            <TopTicker />
            
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
              <div className="max-w-7xl mx-auto w-full">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/markets" element={<Markets />} />
                  <Route path="/news" element={<News />} />
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;

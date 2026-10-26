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
        {/* Enterprise Standard Layout: Clean, solid, professional slate dark theme without AI glow orbs */}
        <div className="flex h-screen bg-[#0B0F19] text-slate-100 font-sans overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
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

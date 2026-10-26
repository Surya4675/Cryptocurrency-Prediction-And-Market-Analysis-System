import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Newspaper, Layers } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { CURRENCY_CONFIG } from '../utils/currencyConfig';

const Sidebar = () => {
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <aside className="w-64 bg-[#0d121f] border-r border-slate-800/90 flex flex-col hidden md:flex h-screen sticky top-0 z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/90">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mr-3">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-white tracking-tight leading-tight">
            CryptoSense
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Enterprise Analytics
          </span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        <NavLink 
          to="/" 
          end
          className={({isActive}) => `flex items-center px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            isActive 
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-2xs' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mr-3" />
          Dashboard
        </NavLink>
        <NavLink 
          to="/markets" 
          className={({isActive}) => `flex items-center px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            isActive 
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-2xs' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-3" />
          Markets
        </NavLink>
        <NavLink 
          to="/news" 
          className={({isActive}) => `flex items-center px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            isActive 
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-2xs' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Newspaper className="w-4 h-4 mr-3" />
          News Intelligence
        </NavLink>
      </nav>

      {/* Footer Controls */}
      <div className="p-4 border-t border-slate-800/90 space-y-3">
        <div className="flex items-center w-full px-3 py-2 bg-slate-900/90 rounded-lg border border-slate-800">
          <span className="text-slate-300 font-bold mr-2 text-xs">{CURRENCY_CONFIG[currency]?.symbol || '$'}</span>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent text-slate-300 outline-none w-full cursor-pointer text-xs font-semibold"
            title="Select Base Currency and Timezone"
          >
            {currencies.map(c => {
              const cfg = CURRENCY_CONFIG[c];
              return (
                <option key={c} value={c} className="bg-slate-900 text-slate-200">
                  {cfg?.flag ? `${cfg.flag} ` : ''}{c} ({cfg?.timeZoneLabel || c})
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Live Engine Active
          </span>
          <span className="text-slate-500">v2.4</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

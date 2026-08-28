import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Newspaper, Settings, Layers, DollarSign } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const Sidebar = () => {
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <aside className="w-64 glass-panel border-r-0 border-r-slate-800/50 flex flex-col hidden md:flex h-screen sticky top-0 rounded-none rounded-r-2xl z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
        <Layers className="w-8 h-8 text-blue-500 mr-3" />
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          CryptoSense
        </span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        <NavLink to="/" className={({isActive}) => `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/markets" className={({isActive}) => `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
          <TrendingUp className="w-5 h-5 mr-3" />
          Markets
        </NavLink>
        <NavLink to="/news" className={({isActive}) => `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
          <Newspaper className="w-5 h-5 mr-3" />
          News
        </NavLink>
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <div className="flex items-center w-full px-4 py-2 bg-gray-900 rounded-lg border border-gray-800">
          <span className="text-gray-400 font-bold mr-2 text-sm">{currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '¤'}</span>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent text-gray-300 outline-none w-full cursor-pointer text-sm font-medium"
          >
            {currencies.map(c => (
              <option key={c} value={c} className="bg-gray-900">{c}</option>
            ))}
          </select>
        </div>
        <button className="flex items-center w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

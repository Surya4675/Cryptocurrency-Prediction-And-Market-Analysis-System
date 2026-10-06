import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Sparkles, Flame, Coins, Shield, Layers } from 'lucide-react';
import { getCoinLogo, getFallbackCoinLogo } from '../utils/coinLogos';

const CATEGORIES = [
  { id: 'all', label: 'All 1,000' },
  { id: 'top50', label: 'Top 50', icon: Flame },
  { id: 'layer1', label: 'Layer 1', icon: Shield },
  { id: 'defi', label: 'DeFi', icon: Coins },
  { id: 'meme', label: 'Memes', icon: Sparkles },
  { id: 'layer2', label: 'Layer 2', icon: Layers }
];

const LAYER1_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'SUI', 'APT', 'TRX', 'TON', 'XRP', 'ATOM', 'FTM', 'ALGO', 'KAS', 'INJ']);
const DEFI_SYMBOLS = new Set(['UNI', 'AAVE', 'LINK', 'MKR', 'CRV', 'SNX', 'LDO', 'PENDLE', 'RUNE', 'COMP', 'SUSHI', 'JUP', 'DYDX', 'CAKE']);
const MEME_SYMBOLS = new Set(['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'BRETT', 'POPCAT', 'BOME', 'MEW', 'MOG', 'TURBO', 'NEIRO']);
const LAYER2_SYMBOLS = new Set(['ARB', 'OP', 'MATIC', 'POL', 'STRK', 'MNT', 'BLAST', 'ZK', 'IMX', 'METIS']);

const CoinSelector = ({ coins = [], selectedCoin, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Find currently selected coin details
  const currentCoin = useMemo(() => {
    return coins.find(c => (c.coin_id === selectedCoin || c.id === selectedCoin)) || {
      name: selectedCoin ? selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1) : 'Select Coin',
      symbol: selectedCoin ? selectedCoin.slice(0, 4).toUpperCase() : 'COIN',
      coin_id: selectedCoin
    };
  }, [coins, selectedCoin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input when opened
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter coins by category and search query
  const filteredCoins = useMemo(() => {
    let result = coins;

    if (activeCategory === 'top50') {
      result = result.slice(0, 50);
    } else if (activeCategory === 'layer1') {
      result = result.filter(c => LAYER1_SYMBOLS.has((c.symbol || '').toUpperCase()));
    } else if (activeCategory === 'defi') {
      result = result.filter(c => DEFI_SYMBOLS.has((c.symbol || '').toUpperCase()));
    } else if (activeCategory === 'meme') {
      result = result.filter(c => MEME_SYMBOLS.has((c.symbol || '').toUpperCase()));
    } else if (activeCategory === 'layer2') {
      result = result.filter(c => LAYER2_SYMBOLS.has((c.symbol || '').toUpperCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        (c.name || '').toLowerCase().includes(q) || 
        (c.symbol || '').toLowerCase().includes(q) ||
        (c.coin_id || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [coins, activeCategory, searchQuery]);

  const handleSelect = (coinId) => {
    if (typeof onChange === 'function') {
      onChange({ target: { value: coinId } });
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const triggerLogo = getCoinLogo(currentCoin.symbol, currentCoin.coin_id, currentCoin.image);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[#0d1322] hover:bg-[#141c30] text-gray-200 border border-gray-700/60 hover:border-blue-500/50 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <img 
          src={triggerLogo} 
          alt={currentCoin.symbol} 
          className="w-5 h-5 rounded-full object-contain bg-slate-900 border border-slate-700/60 p-0.5"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackCoinLogo(currentCoin.symbol);
          }}
        />
        <span className="font-medium text-white max-w-[110px] md:max-w-[140px] truncate">
          {currentCoin.name}
        </span>
        <span className="text-[10px] font-mono text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded">
          {currentCoin.symbol}
        </span>
        <Search className="w-3.5 h-3.5 text-gray-400 ml-1 hover:text-blue-400" />
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 max-w-[92vw] bg-[#0c101c] border border-gray-700/80 rounded-xl shadow-2xl shadow-black/80 z-50 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-3 border-b border-gray-800/80 bg-[#090d18]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 1,000 coins (e.g. BTC, ETH, SOL)..."
                className="w-full bg-[#121829] text-white text-xs pl-9 pr-8 py-2 rounded-lg border border-gray-700/60 focus:border-blue-500 focus:outline-none placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Counter Bar */}
          <div className="px-3 py-1.5 bg-[#0a0e1a] border-b border-gray-800/60 flex justify-between items-center text-[10px] text-gray-400 font-mono">
            <span>SHOWING {filteredCoins.length} OF {coins.length || 1000} ASSETS</span>
            <span className="text-gray-500">ESC to close</span>
          </div>

          {/* Scrollable Coin List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/40 overscroll-contain">
            {filteredCoins.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <p>No coins found matching "{searchQuery}"</p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="mt-2 text-blue-400 hover:underline text-[11px]"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredCoins.slice(0, 100).map((coin) => {
                const isSelected = (coin.coin_id === selectedCoin || coin.id === selectedCoin);
                return (
                  <button
                    key={coin.coin_id || coin.id}
                    onClick={() => handleSelect(coin.coin_id)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-950/40 text-blue-400 font-semibold'
                        : 'text-gray-200 hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate mr-2">
                      <img 
                        src={getCoinLogo(coin.symbol, coin.coin_id || coin.id, coin.image)} 
                        alt={coin.symbol} 
                        className="w-6 h-6 rounded-full object-contain bg-slate-900 border border-slate-700/80 p-0.5 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getFallbackCoinLogo(coin.symbol);
                        }}
                      />
                      <div className="truncate">
                        <div className="font-medium text-white truncate text-xs">
                          {coin.name}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 uppercase">
                          {coin.symbol}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinSelector;

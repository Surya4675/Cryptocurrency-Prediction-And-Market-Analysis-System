import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Search, 
  Activity, 
  Layers, 
  Flame, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Coins
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { marketApi } from '../api/client';
import { getCoinLogo, getFallbackCoinLogo } from '../utils/coinLogos';

const CATEGORY_MAP = {
  // Layer 1 / Layer 0
  bitcoin: 'Layer 1', btc: 'Layer 1',
  ethereum: 'Layer 1', eth: 'Layer 1',
  solana: 'Layer 1', sol: 'Layer 1',
  cardano: 'Layer 1', ada: 'Layer 1',
  binancecoin: 'Layer 1', bnb: 'Layer 1',
  ripple: 'Payment L1', xrp: 'Payment L1',
  'avalanche-2': 'Layer 1', avax: 'Layer 1',
  polkadot: 'Layer 0', dot: 'Layer 0',
  tron: 'Layer 1', trx: 'Layer 1',
  sui: 'Layer 1',
  monero: 'Privacy L1', xmr: 'Privacy L1',
  near: 'Layer 1',
  aptos: 'Layer 1', apt: 'Layer 1',
  kaspa: 'Layer 1', kas: 'Layer 1',
  cosmos: 'Layer 0', atom: 'Layer 0',
  stellar: 'Payment L1', xlm: 'Payment L1',
  'hedera-hashgraph': 'Enterprise L1', hbar: 'Enterprise L1',
  litecoin: 'Payment L1', ltc: 'Payment L1',
  zcash: 'Privacy L1', zec: 'Privacy L1',
  algorand: 'Layer 1', algo: 'Layer 1',
  fantom: 'Layer 1', ftm: 'Layer 1',
  ton: 'Layer 1', 'the-open-network': 'Layer 1',
  
  // DeFi
  uniswap: 'DeFi DEX', uni: 'DeFi DEX',
  chainlink: 'Oracle / DeFi', link: 'Oracle / DeFi',
  aave: 'DeFi Lending',
  maker: 'DeFi Stablecoin', mkr: 'DeFi Stablecoin',
  'curve-dao-token': 'DeFi DEX', crv: 'DeFi DEX',
  'lido-dao': 'Liquid Staking', ldo: 'Liquid Staking',
  'the-graph': 'DeFi Indexing', grt: 'DeFi Indexing',
  'jupiter-exchange-solana': 'DeFi DEX', jup: 'DeFi DEX',
  pendle: 'Yield Trading',
  'synthetix-network-token': 'Derivatives', snx: 'Derivatives',
  injective: 'DeFi L1', inj: 'DeFi L1',
  rune: 'DeFi DEX', thorchain: 'DeFi DEX',
  
  // Memes
  dogecoin: 'Meme', doge: 'Meme',
  'shiba-inu': 'Meme', shib: 'Meme',
  pepe: 'Meme',
  bonk: 'Meme',
  floki: 'Meme',
  dogwifcoin: 'Meme', wif: 'Meme', dogwifhat: 'Meme',
  'ape-and-pepe': 'Meme', brett: 'Meme', popcat: 'Meme',
  
  // Layer 2
  'polygon-ecosystem-token': 'Layer 2', matic: 'Layer 2', pol: 'Layer 2', 'matic-network': 'Layer 2', polygon: 'Layer 2',
  arbitrum: 'Layer 2', arb: 'Layer 2',
  optimism: 'Layer 2', op: 'Layer 2',
  'immutable-x': 'Gaming L2', imx: 'Gaming L2', immutable: 'Gaming L2',
  starknet: 'Layer 2', strk: 'Layer 2',
  mantle: 'Layer 2', mnt: 'Layer 2',
  blast: 'Layer 2', zksync: 'Layer 2', zk: 'Layer 2',
  loopring: 'Layer 2', lrc: 'Layer 2'
};

const CATEGORY_TABS = [
  { id: 'Top 50', label: 'Top 50' },
  { id: 'Layer 1', label: 'Layer 1 / L0' },
  { id: 'DeFi', label: 'DeFi' },
  { id: 'Meme', label: 'Meme Coins' },
  { id: 'Layer 2', label: 'Layer 2' },
  { id: 'Gainers', label: 'Top Gainers' },
  { id: 'Losers', label: 'Top Losers' },
  { id: 'Volume', label: 'High Volume' }
];

const Markets = () => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Top 50');
  const [totalAvailable, setTotalAvailable] = useState(1000);

  const fetchMarkets = async (searchQuery = '', isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (!coins.length) setLoading(true);

    try {
      const params = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
        params.limit = 100;
      } else {
        params.limit = 100;
      }

      const response = await marketApi.getSummary(params);
      if (response.data && response.data.coins) {
        setCoins(response.data.coins);
        if (response.data.total_available) {
          setTotalAvailable(response.data.total_available);
        }
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(() => fetchMarkets(searchTerm, true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Debounced server search for 1,000 coins when user types
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMarkets(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Client-side category filtering & sorting
  const processedCoins = useMemo(() => {
    let list = [...coins];

    if (activeCategory === 'Gainers') {
      list.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    } else if (activeCategory === 'Losers') {
      list.sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));
    } else if (activeCategory === 'Volume') {
      list.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
    } else if (activeCategory === 'Top 50') {
      list = list.slice(0, 50);
    } else {
      const actLower = activeCategory.toLowerCase();
      list = list.filter(coin => {
        const cid = (coin.coin_id || '').toLowerCase();
        const sym = (coin.symbol || '').toLowerCase();
        const cat = CATEGORY_MAP[cid] || CATEGORY_MAP[sym] || '';
        return cat.toLowerCase().includes(actLower);
      });
    }

    return list;
  }, [coins, activeCategory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Global Crypto Markets
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  LIVE STREAMING
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Monitoring <strong>{totalAvailable}+</strong> Cryptocurrencies with real-time institutional tick workflow.
              </p>
            </div>
          </div>
        </div>

        {/* Global Manual Refresh Button */}
        <button
          onClick={() => fetchMarkets(searchTerm, true)}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-[#0e1424] hover:bg-gray-800 text-gray-300 text-xs font-semibold border border-gray-700/60 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Sync Live</span>
        </button>
      </div>

      {/* Global Search Bar + Active Filters */}
      <div className="glass-panel rounded-xl p-4 space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search across 1,000 coins (e.g. Bitcoin, Pepe, SOL, Bonk)..."
            className="w-full bg-[#070b14] text-white text-xs pl-10 pr-10 py-2.5 rounded-lg border border-gray-800 focus:border-blue-500 focus:outline-none placeholder-gray-500 transition-colors shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-gray-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-400'
                    : 'bg-[#0a0f1d] text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-gray-400">
            Showing <strong className="text-white">{processedCoins.length}</strong> Active Assets
          </div>
        </div>
      </div>

      {/* Primary Markets Data Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-gray-800/80 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/80 bg-[#070b14]/90 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4 text-right">Spot Price</th>
                <th className="py-3.5 px-4 text-right">24H Change</th>
                <th className="py-3.5 px-4 text-right hidden sm:table-cell">24H High / Low</th>
                <th className="py-3.5 px-4 text-right hidden md:table-cell">24H Volume</th>
                <th className="py-3.5 px-4 text-right hidden lg:table-cell">Market Cap</th>
                <th className="py-3.5 px-4 text-center">Forecast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-xs font-medium">
              {loading && coins.length === 0 ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="8" className="py-4 px-4">
                      <div className="h-4 bg-gray-800/60 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : processedCoins.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-gray-400">
                    <Coins className="w-8 h-8 mx-auto mb-2 text-gray-600 opacity-60" />
                    <p className="text-sm font-semibold text-gray-300">No cryptocurrencies found</p>
                    <p className="text-xs text-gray-500 mt-1">Try another search term or reset category filters.</p>
                  </td>
                </tr>
              ) : (
                processedCoins.map((coin, index) => {
                  const rank = coin.market_cap_rank || (index + 1);
                  const isPositive = (coin.price_change_percentage_24h || 0) >= 0;
                  const categoryTag = CATEGORY_MAP[(coin.coin_id || '').toLowerCase()] || CATEGORY_MAP[(coin.symbol || '').toLowerCase()];
                  const logoSrc = getCoinLogo(coin.symbol, coin.coin_id, coin.image);

                  return (
                    <tr 
                      key={coin.coin_id || coin.symbol || index}
                      onClick={() => {
                        localStorage.setItem('selectedCoin', coin.coin_id || coin.symbol.toLowerCase());
                        navigate('/');
                      }}
                      className="hover:bg-blue-950/20 transition-colors cursor-pointer group"
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center font-mono text-gray-400 text-[11px] font-semibold">
                        {rank}
                      </td>

                      {/* Coin Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <img 
                            src={logoSrc} 
                            alt={coin.name} 
                            className="w-7 h-7 rounded-full object-contain bg-slate-900 border border-slate-700/60 p-0.5 shrink-0" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getFallbackCoinLogo(coin.symbol);
                            }}
                          />
                          <div>
                            <div className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors flex items-center space-x-1.5">
                              <span>{coin.name}</span>
                              {categoryTag && (
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono">
                                  {categoryTag}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono uppercase font-semibold">
                              {coin.symbol}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Spot Price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-100">
                        {formatPrice(coin.current_price)}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          isPositive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {isPositive ? '+' : ''}{(coin.price_change_percentage_24h || 0).toFixed(2)}%
                        </span>
                      </td>

                      {/* 24H High / Low */}
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-gray-400 hidden sm:table-cell">
                        <span className="text-emerald-400/90">{formatPrice(coin.high_24h)}</span>
                        <span className="mx-1 text-gray-600">/</span>
                        <span className="text-rose-400/90">{formatPrice(coin.low_24h)}</span>
                      </td>

                      {/* 24H Volume */}
                      <td className="py-3 px-4 text-right font-mono text-gray-300 hidden md:table-cell">
                        {formatPrice(coin.total_volume)}
                      </td>

                      {/* Market Cap */}
                      <td className="py-3 px-4 text-right font-mono text-gray-400 hidden lg:table-cell">
                        {formatPrice(coin.market_cap)}
                      </td>

                      {/* Action / Forecast CTA */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <span>Predict</span>
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Markets;

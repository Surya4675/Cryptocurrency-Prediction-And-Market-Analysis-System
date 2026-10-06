// Dedicated high-resolution authentic official cryptocurrency logo resolver
// Provides verified official CoinGecko PNG/SVG assets with instant CryptoIcons & SVG fallback

export const OFFICIAL_COIN_LOGOS = {
  // Layer 1 / Mainstream
  btc: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  bitcoin: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  eth: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  sol: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  bnb: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  binancecoin: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  xrp: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  ripple: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  ada: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  cardano: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  doge: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  dogecoin: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  trx: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  tron: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  avax: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'avalanche-2': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  dot: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  polkadot: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  sui: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
  near: 'https://assets.coingecko.com/coins/images/10365/large/near.png',
  apt: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  aptos: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  kas: 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png',
  kaspa: 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png',
  atom: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  cosmos: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  hbar: 'https://assets.coingecko.com/coins/images/3688/large/hbar.png',
  'hedera-hashgraph': 'https://assets.coingecko.com/coins/images/3688/large/hbar.png',
  ltc: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  litecoin: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  xlm: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  stellar: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  xmr: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
  monero: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',

  // Stables
  usdt: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  tether: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  usdc: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
  'usd-coin': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',

  // Layer 2
  matic: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  pol: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  'polygon-ecosystem-token': 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  'matic-network': 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  arb: 'https://assets.coingecko.com/coins/images/16547/large/arbitrum.png',
  arbitrum: 'https://assets.coingecko.com/coins/images/16547/large/arbitrum.png',
  op: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  optimism: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  mnt: 'https://assets.coingecko.com/coins/images/30980/large/token-logo.png',
  mantle: 'https://assets.coingecko.com/coins/images/30980/large/token-logo.png',
  imx: 'https://assets.coingecko.com/coins/images/17233/large/imx.png',
  'immutable-x': 'https://assets.coingecko.com/coins/images/17233/large/imx.png',
  immutable: 'https://assets.coingecko.com/coins/images/17233/large/imx.png',
  strk: 'https://assets.coingecko.com/coins/images/35279/large/starknet.png',
  starknet: 'https://assets.coingecko.com/coins/images/35279/large/starknet.png',

  // DeFi
  link: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  chainlink: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  uni: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  uniswap: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  aave: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
  mkr: 'https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png',
  maker: 'https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png',
  ldo: 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png',
  'lido-dao': 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png',
  inj: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  injective: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  crv: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  'curve-dao-token': 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  grt: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png',
  'the-graph': 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png',

  // Memes
  shib: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  'shiba-inu': 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  pepe: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.png',
  bonk: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg',
  floki: 'https://assets.coingecko.com/coins/images/16746/large/FLOKI.png',
  wif: 'https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg',
  dogwifhat: 'https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg',

  // AI & Modern
  render: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  'render-token': 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  tao: 'https://assets.coingecko.com/coins/images/31967/large/bittensor.png',
  bittensor: 'https://assets.coingecko.com/coins/images/31967/large/bittensor.png',
  fet: 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg',
  'fetch-ai': 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg',
  tia: 'https://assets.coingecko.com/coins/images/31967/large/celestia.png',
  celestia: 'https://assets.coingecko.com/coins/images/31967/large/celestia.png',
};

/**
 * Returns authentic official coin logo URL
 */
export function getCoinLogo(symbol = '', coinId = '', providedImage = null) {
  const sym = (symbol || '').toLowerCase().trim();
  const cid = (coinId || '').toLowerCase().trim();

  // If already an official image URL and not ui-avatars placeholder, use it
  if (providedImage && !providedImage.includes('ui-avatars.com') && providedImage.startsWith('http')) {
    return providedImage;
  }

  // 1. Direct verified CoinGecko CDN image
  if (sym && OFFICIAL_COIN_LOGOS[sym]) return OFFICIAL_COIN_LOGOS[sym];
  if (cid && OFFICIAL_COIN_LOGOS[cid]) return OFFICIAL_COIN_LOGOS[cid];

  // 2. High-res AtomicLabs Cryptocurrency Icons CDN (jsdelivr)
  if (sym) {
    return `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63539be1e374711a8554f31b8300d9257d25e5/128/color/${sym}.png`;
  }

  return getFallbackCoinLogo(symbol);
}

/**
 * Clean SVG fallback with elegant gradient and symbol letters
 */
export function getFallbackCoinLogo(symbol = 'CRYPTO') {
  const cleanSym = (symbol || 'C').slice(0, 4).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="19" fill="#0f172a" stroke="url(#g)" stroke-width="2"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" letter-spacing="-0.5px">${cleanSym}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

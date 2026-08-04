import React from 'react';

const CoinSelector = ({ coins, selectedCoin, onChange }) => {
  return (
    <select 
      value={selectedCoin} 
      onChange={onChange}
      className="bg-gray-800 text-white border border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {coins.map(coin => (
        <option key={coin.coin_id} value={coin.coin_id}>
          {coin.name} ({coin.symbol.toUpperCase()})
        </option>
      ))}
    </select>
  );
};

export default CoinSelector;

import React, { createContext, useState, useEffect, useContext } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'INR';
  });
  const [exchangeRates, setExchangeRates] = useState({ INR: 1 });
  const [loading, setLoading] = useState(true);

  // Supported currencies
  const currencies = ['USD', 'INR', 'CNY', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

  useEffect(() => {
    const fetchRates = async () => {
      // Fallback rates just in case the API goes down or is rate limited
      const fallbackRates = {
        INR: 1, USD: 0.012, CNY: 0.087, EUR: 0.011, 
        GBP: 0.0095, JPY: 1.85, AUD: 0.018, CAD: 0.016
      };
      
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
        if (!response.ok) throw new Error("API not ok");
        const data = await response.json();
        
        if (data && data.rates) {
          setExchangeRates(data.rates);
        } else {
          setExchangeRates(fallbackRates);
        }
        setLoading(false);
      } catch (error) {
        console.warn("Failed to fetch exchange rates, using fallbacks:", error);
        setExchangeRates(fallbackRates);
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  const formatCompactPrice = (baseInrAmount) => {
    if (baseInrAmount === null || baseInrAmount === undefined) return 'N/A';
    const num = Number(baseInrAmount);
    if (isNaN(num)) return 'N/A';
    
    const rate = exchangeRates[currency] || 1;
    const val = num * rate;
    
    const symbolMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$' };
    const sym = symbolMap[currency] || '$';

    if (Math.abs(val) >= 1_000_000_000) {
      return `${sym}${(val / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(val) >= 1_000_000) {
      return `${sym}${(val / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(val) >= 10_000) {
      return `${sym}${(val / 1_000).toFixed(1)}k`;
    }
    if (Math.abs(val) >= 1) {
      return `${sym}${val.toFixed(2)}`;
    }
    return `${sym}${val.toFixed(val < 0.01 ? 6 : 4)}`;
  };

  const formatPrice = (baseInrAmount, compact = false) => {
    if (baseInrAmount === null || baseInrAmount === undefined) return 'N/A';
    if (compact) return formatCompactPrice(baseInrAmount);
    
    const num = Number(baseInrAmount);
    if (isNaN(num)) return 'N/A';

    const rate = exchangeRates[currency] || 1;
    const convertedAmount = num * rate;
    const absVal = Math.abs(convertedAmount);
    
    let minDigits = 2;
    let maxDigits = 2;

    if (absVal >= 10000) {
      minDigits = 0;
      maxDigits = 0;
    } else if (absVal >= 1) {
      minDigits = 2;
      maxDigits = 2;
    } else if (absVal >= 0.01) {
      minDigits = 2;
      maxDigits = 4;
    } else if (absVal > 0) {
      minDigits = 2;
      maxDigits = 6;
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits
      }).format(convertedAmount);
    } catch (e) {
      const symbolMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$' };
      const sym = symbolMap[currency] || '$';
      return `${sym}${convertedAmount.toFixed(maxDigits)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencies, formatPrice, formatCompactPrice, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

import React, { createContext, useState, useEffect, useContext } from 'react';
import { CURRENCY_CONFIG } from '../utils/currencyConfig';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'INR';
  });
  const [exchangeRates, setExchangeRates] = useState({ INR: 1 });
  const [loading, setLoading] = useState(true);

  // Supported currencies
  const currencies = ['USD', 'INR', 'CNY', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

  const currencyConfig = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;
  const timeZone = currencyConfig.timeZone || 'Asia/Kolkata';
  const timeZoneLabel = currencyConfig.timeZoneLabel || 'IST';
  const regionName = currencyConfig.regionName || 'India';
  const country = currencyConfig.country || 'India';
  const flag = currencyConfig.flag || '🇮🇳';

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

  // Format date in active currency's timezone
  const formatDate = (date, options = {}) => {
    if (!date) return '';
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options
    });
  };

  // Format time in active currency's timezone
  const formatTime = (date, options = {}) => {
    if (!date) return '';
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      ...options
    });
  };

  const formatCompactPrice = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return 'N/A';
    
    const sym = currencyConfig.symbol || '$';

    if (Math.abs(num) >= 1_000_000_000_000) {
      return `${sym}${(num / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (Math.abs(num) >= 1_000_000_000) {
      return `${sym}${(num / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(num) >= 1_000_000) {
      return `${sym}${(num / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(num) >= 10_000) {
      return `${sym}${(num / 1_000).toFixed(1)}k`;
    }
    if (Math.abs(num) >= 1) {
      return `${sym}${num.toFixed(2)}`;
    }
    return `${sym}${num.toFixed(num < 0.01 ? 6 : 4)}`;
  };

  const formatPrice = (amount, compact = false) => {
    if (amount === null || amount === undefined) return 'N/A';
    if (compact) return formatCompactPrice(amount);
    
    const num = Number(amount);
    if (isNaN(num)) return 'N/A';

    const absVal = Math.abs(num);
    let minDigits = 2;
    let maxDigits = 2;

    if (absVal >= 10000) {
      minDigits = 0;
      maxDigits = 2;
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
      }).format(num);
    } catch {
      const sym = currencyConfig.symbol || '$';
      return `${sym}${num.toFixed(maxDigits)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      currencies, 
      currencyConfig,
      timeZone,
      timeZoneLabel,
      regionName,
      country,
      flag,
      formatDate,
      formatTime,
      formatPrice, 
      formatCompactPrice, 
      loading 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

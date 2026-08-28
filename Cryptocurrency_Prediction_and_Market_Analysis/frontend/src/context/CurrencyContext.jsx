import React, { createContext, useState, useEffect, useContext } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1 });
  const [loading, setLoading] = useState(true);

  // Supported currencies
  const currencies = ['USD', 'INR', 'CNY', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

  useEffect(() => {
    const fetchRates = async () => {
      // Fallback rates just in case the API goes down or is rate limited
      const fallbackRates = {
        USD: 1, INR: 83.50, CNY: 7.23, EUR: 0.92, 
        GBP: 0.79, JPY: 154.20, AUD: 1.53, CAD: 1.37
      };
      
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
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

  const formatPrice = (usdAmount) => {
    if (usdAmount === null || usdAmount === undefined) return 'N/A';
    
    const rate = exchangeRates[currency] || 1;
    const convertedAmount = usdAmount * rate;
    
    // Choose appropriate formatting options based on value
    const fractionDigits = convertedAmount < 0.01 ? 6 : convertedAmount < 1 ? 4 : 2;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(convertedAmount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencies, formatPrice, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

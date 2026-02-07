import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  JPY: { symbol: '¥', name: 'Japanese Yen', code: 'JPY' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', code: 'CHF' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', code: 'CNY' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', code: 'SEK' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', code: 'NZD' },
  MXN: { symbol: 'Mex$', name: 'Mexican Peso', code: 'MXN' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', code: 'SGD' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', code: 'HKD' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', code: 'NOK' },
  KRW: { symbol: '₩', name: 'South Korean Won', code: 'KRW' },
  TRY: { symbol: '₺', name: 'Turkish Lira', code: 'TRY' },
  RUB: { symbol: '₽', name: 'Russian Ruble', code: 'RUB' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', code: 'BRL' },
  ZAR: { symbol: 'R', name: 'South African Rand', code: 'ZAR' }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    // Load from localStorage or default to USD
    const saved = localStorage.getItem('preferredCurrency');
    return saved || 'USD';
  });

  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const formatAmount = (amount) => {
    const curr = CURRENCIES[currency];
    const numAmount = parseFloat(amount) || 0;
    
    // Format based on currency
    if (currency === 'JPY' || currency === 'KRW') {
      // No decimal places for JPY and KRW
      return `${curr.symbol}${numAmount.toFixed(0)}`;
    }
    
    return `${curr.symbol}${numAmount.toFixed(2)}`;
  };

  const value = {
    currency,
    setCurrency: updateCurrency,
    currencies: CURRENCIES,
    currencySymbol: CURRENCIES[currency].symbol,
    currencyCode: currency,
    formatAmount
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;

import React, { useState } from 'react';
import { DollarSign, Check } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency();
  const [showDropdown, setShowDropdown] = useState(false);

  const popularCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];
  const allCurrencies = Object.keys(currencies);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <DollarSign size={18} />
        <span className="font-semibold">{currency}</span>
        <span className="text-gray-600">({currencies[currency].symbol})</span>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            {/* Popular Currencies */}
            <div className="p-2 border-b">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1">Popular</div>
              {popularCurrencies.map(code => (
                <button
                  key={code}
                  onClick={() => {
                    setCurrency(code);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between ${
                    currency === code ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{code}</span>
                    <span className="text-gray-600 text-sm">{currencies[code].symbol}</span>
                    <span className="text-gray-500 text-xs">{currencies[code].name}</span>
                  </div>
                  {currency === code && <Check size={16} className="text-indigo-600" />}
                </button>
              ))}
            </div>

            {/* All Currencies */}
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1">All Currencies</div>
              {allCurrencies
                .filter(code => !popularCurrencies.includes(code))
                .map(code => (
                  <button
                    key={code}
                    onClick={() => {
                      setCurrency(code);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between ${
                      currency === code ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{code}</span>
                      <span className="text-gray-600 text-sm">{currencies[code].symbol}</span>
                      <span className="text-gray-500 text-xs">{currencies[code].name}</span>
                    </div>
                    {currency === code && <Check size={16} className="text-indigo-600" />}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CurrencySelector;
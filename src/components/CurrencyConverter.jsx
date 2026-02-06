import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [rate, setRate] = useState(null);
  const [converted, setConverted] = useState(null);

  const currencies = [
    'USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD', 'CAD', 
    'CHF', 'SGD', 'THB', 'MXN', 'BRL', 'ZAR'
  ];

  useEffect(() => {
    fetchRate();
  }, [from, to]);

  useEffect(() => {
    if (rate && amount) {
      setConverted((parseFloat(amount) * rate).toFixed(2));
    }
  }, [amount, rate]);

  const fetchRate = async () => {
    try {
      // FREE API: exchangerate-api.com (1500 requests/month free)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      const data = await response.json();
      setRate(data.rates[to]);
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
    }
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Currency Converter</h3>
      
      <div className="space-y-4">
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="100"
            />
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swap}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
          >
            <ArrowRightLeft size={20} className="text-gray-600" />
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Converted</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={converted || '0.00'}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
            />
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exchange Rate */}
        {rate && (
          <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            <span className="text-sm text-blue-900">
              1 {from} = {rate.toFixed(4)} {to}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Rates updated daily from exchangerate-api.com
      </div>
    </div>
  );
};

export default CurrencyConverter;

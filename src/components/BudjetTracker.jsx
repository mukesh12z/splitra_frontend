import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import api from '../services/api';

const BudgetTracker = ({ tripId, currency = 'USD' }) => {
  const [budget, setBudget] = useState({
    total: 0,
    daily: 0,
    categories: {}
  });
  const [expenses, setExpenses] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadData();
  }, [tripId]);

  const loadData = async () => {
    try {
      const response = await api.get(`/expenses?tripId=${tripId}`);
      const expenseData = response.data;
      setExpenses(expenseData);

      // Calculate spent by category
      const categorySpent = {};
      expenseData.forEach(exp => {
        categorySpent[exp.category] = (categorySpent[exp.category] || 0) + exp.amount;
      });

      // Check budget alerts
      const newAlerts = [];
      Object.entries(budget.categories).forEach(([category, limit]) => {
        const spent = categorySpent[category] || 0;
        const percentage = (spent / limit) * 100;
        
        if (percentage >= 90) {
          newAlerts.push({
            category,
            spent,
            limit,
            percentage,
            severity: percentage >= 100 ? 'danger' : 'warning'
          });
        }
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    }
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budgetPercentage = budget.total > 0 ? (totalSpent / budget.total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Budget Overview</h3>
        
        {/* Total Budget */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total Budget</span>
            <span className="text-sm font-semibold">
              {currency} {totalSpent.toFixed(2)} / {budget.total.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                budgetPercentage >= 100 ? 'bg-red-600' :
                budgetPercentage >= 80 ? 'bg-yellow-500' :
                'bg-green-600'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {budgetPercentage.toFixed(1)}% used
          </div>
        </div>

        {/* Daily Budget */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Daily Budget</div>
            <div className="text-2xl font-bold text-blue-900">
              {currency} {budget.daily.toFixed(2)}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 mb-1">Avg Daily Spent</div>
            <div className="text-2xl font-bold text-purple-900">
              {currency} {(totalSpent / Math.max(expenses.length, 1)).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-600" />
              Budget Alerts
            </h4>
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  alert.severity === 'danger'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{alert.category}</span>
                  <span className={`text-sm ${
                    alert.severity === 'danger' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {alert.percentage.toFixed(0)}% used
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {currency} {alert.spent.toFixed(2)} / {alert.limit.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      <button
        onClick={() => {/* Open budget setting modal */}}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
      >
        Set Budget Limits
      </button>
    </div>
  );
};

export default BudgetTracker;
import React, { useState, useEffect } from 'react';
import { Plus, X, DollarSign, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ExpensesTab({ group, currentUser, onUpdate }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);

  // Split type state
  const [splitType, setSplitType] = useState('equal');

  // Equal split state - array of selected member IDs
  const [equalMembers, setEqualMembers] = useState([]);

  // Percentage split state - object mapping userId to percentage
  const [percentageMap, setPercentageMap] = useState({});

  // Custom split state - object mapping userId to custom amount
  const [customMap, setCustomMap] = useState({});

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Food',
    paidBy: currentUser.id
  });

  const categories = ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Other'];

  useEffect(() => {
    fetchExpenses();
    fetchMembers();
  }, [group.id]);

  useEffect(() => {
    if (members.length > 0) {
      calculateSettlements();
    }
  }, [expenses, members]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/expenses/group/${group.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/groups/${group.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const membersList = response.data.members || response.data.GroupMembers || [];
      setMembers(membersList.map(m => m.user || m.User || m));
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const calculateSettlements = () => {
    const balances = {};
    
    members.forEach(member => {
      balances[member.id] = 0;
    });

    expenses.forEach(expense => {
      const splits = expense.ExpenseSplits || [];
      const paidBy = expense.paidBy;
      
      splits.forEach(split => {
        if (split.userId !== paidBy) {
          balances[split.userId] -= split.amount;
          balances[paidBy] += split.amount;
        }
      });
    });

    const settlements = [];
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([userId, balance]) => {
      if (balance < 0) {
        debtors.push({ userId, amount: Math.abs(balance) });
      } else if (balance > 0) {
        creditors.push({ userId, amount: balance });
      }
    });

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: amount
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    setSettlements(settlements);
  };

  // Handle tab switch - clear other tabs when switching
  const handleSplitTypeChange = (newType) => {
    setSplitType(newType);
    
    if (newType === 'equal') {
      // Clear percentage and custom
      setPercentageMap({});
      setCustomMap({});
      // Auto-select all members for equal split
      setEqualMembers(members.map(m => m.id));
    } else if (newType === 'percentage') {
      // Clear equal and custom
      setEqualMembers([]);
      setCustomMap({});
      // Initialize fair percentage split
      const fairShare = members.length > 0 ? (100 / members.length).toFixed(2) : 0;
      const initMap = {};
      members.forEach(m => {
        initMap[m.id] = fairShare;
      });
      setPercentageMap(initMap);
    } else if (newType === 'custom') {
      // Clear equal and percentage
      setEqualMembers([]);
      setPercentageMap({});
      // Initialize empty custom amounts
      const initMap = {};
      members.forEach(m => {
        initMap[m.id] = '';
      });
      setCustomMap(initMap);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(expenseForm.amount);
    
    // Build customSplits based on active splitType
    let customSplits = [];
    
    if (splitType === 'equal') {
      // For equal split, just send splitWith array
      if (equalMembers.length === 0) {
        alert('Please select at least one member to split with');
        return;
      }
    } else if (splitType === 'percentage') {
      // Validate percentages add up to 100
      const activePercentages = Object.entries(percentageMap)
        .filter(([_, pct]) => pct && parseFloat(pct) > 0);
      
      if (activePercentages.length === 0) {
        alert('Please enter percentages for at least one member');
        return;
      }
      
      const total = activePercentages.reduce((sum, [_, pct]) => sum + parseFloat(pct), 0);
      if (Math.abs(total - 100) > 0.1) {
        alert(`Percentages must add up to 100%. Current total: ${total.toFixed(2)}%`);
        return;
      }
      
      customSplits = activePercentages.map(([userId, percentage]) => ({
        userId,
        percentage: parseFloat(percentage)
      }));
    } else if (splitType === 'custom') {
      // Validate custom amounts add up to total
      const activeAmounts = Object.entries(customMap)
        .filter(([_, amt]) => amt && parseFloat(amt) > 0);
      
      if (activeAmounts.length === 0) {
        alert('Please enter amounts for at least one member');
        return;
      }
      
      const total = activeAmounts.reduce((sum, [_, amt]) => sum + parseFloat(amt), 0);
      if (Math.abs(total - amount) > 0.01) {
        alert(`Split amounts must add up to ${amount.toFixed(2)}. Current total: ${total.toFixed(2)}`);
        return;
      }
      
      customSplits = activeAmounts.map(([userId, amt]) => ({
        userId,
        amount: parseFloat(amt)
      }));
    }

    try {
      const token = localStorage.getItem('token');
      
      const expenseData = {
        groupId: group.id,
        description: expenseForm.description,
        amount: amount,
        category: expenseForm.category,
        paidBy: expenseForm.paidBy,
        splitType: splitType,
        splitWith: splitType === 'equal' ? equalMembers : undefined,
        customSplits: splitType !== 'equal' ? customSplits : undefined
      };

      await axios.post(
        `${API_URL}/expenses`,
        expenseData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchExpenses();
      setShowAddModal(false);
      
      // Reset form
      setExpenseForm({
        description: '',
        amount: '',
        category: 'Food',
        paidBy: currentUser.id
      });
      setSplitType('equal');
      setEqualMembers(members.map(m => m.id));
      setPercentageMap({});
      setCustomMap({});
    } catch (error) {
      console.error('Error adding expense:', error);
      alert(error.response?.data?.error || 'Failed to add expense');
    }
  };

  const getMemberName = (userId) => {
    const member = members.find(m => m.id === userId);
    return member?.name || member?.email || 'Unknown';
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  // Calculate totals for validation display
  const percentageTotal = Object.values(percentageMap).reduce((sum, pct) => sum + (parseFloat(pct) || 0), 0);
  const customTotal = Object.values(customMap).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);

  if (loading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-green-600" size={24} />
            <h3 className="font-semibold text-gray-700">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${totalExpenses.toFixed(2)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-blue-600" size={24} />
            <h3 className="font-semibold text-gray-700">Per Person</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            ${members.length > 0 ? (totalExpenses / members.length).toFixed(2) : '0.00'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-purple-600" size={24} />
            <h3 className="font-semibold text-gray-700">Transactions</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{expenses.length}</p>
        </div>
      </div>

      {/* Who Owes Whom */}
      {settlements.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💸 Settlement Summary</h3>
          <div className="space-y-2">
            {settlements.map((settlement, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <span className="font-semibold text-gray-700">
                  {getMemberName(settlement.from)}
                </span>
                <span className="text-gray-500">owes</span>
                <span className="font-semibold text-gray-700">
                  {getMemberName(settlement.to)}
                </span>
                <span className="text-xl font-bold text-green-600">
                  ${settlement.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">All Expenses</h3>
        <button
          onClick={() => {
            setShowAddModal(true);
            handleSplitTypeChange('equal'); // Initialize to equal split
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No expenses yet. Add your first expense!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                      {expense.category}
                    </span>
                    <h4 className="font-semibold text-gray-800">{expense.description}</h4>
                  </div>
                  <div className="text-sm text-gray-600">
                    Paid by <span className="font-semibold">{getMemberName(expense.paidBy)}</span>
                    {' • '}
                    {new Date(expense.date).toLocaleDateString()}
                  </div>
                  {expense.ExpenseSplits && expense.ExpenseSplits.length > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      Split ({expense.splitType}): {expense.ExpenseSplits.map(s => getMemberName(s.userId)).join(', ')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </div>
                  {expense.ExpenseSplits && expense.ExpenseSplits.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {expense.splitType === 'equal' && `$${(parseFloat(expense.amount) / expense.ExpenseSplits.length).toFixed(2)} each`}
                      {expense.splitType !== 'equal' && 'custom split'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Add Expense</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="What was this expense for?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paid By *
                </label>
                <select
                  value={expenseForm.paidBy}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split Type Tabs */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  How to Split *
                </label>
                
                {/* Tab Headers */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => handleSplitTypeChange('equal')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                      splitType === 'equal'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSplitTypeChange('percentage')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                      splitType === 'percentage'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSplitTypeChange('custom')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                      splitType === 'custom'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Custom Amount
                  </button>
                </div>

                {/* Tab Content */}
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {/* Equal Split */}
                  {splitType === 'equal' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">
                        Select members to split equally among them
                      </p>
                      {members.map(member => (
                        <label key={member.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={equalMembers.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEqualMembers([...equalMembers, member.id]);
                              } else {
                                setEqualMembers(equalMembers.filter(id => id !== member.id));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="text-sm flex-1">{member.name || member.email}</span>
                          {equalMembers.includes(member.id) && expenseForm.amount && (
                            <span className="text-sm text-gray-500">
                              ${(parseFloat(expenseForm.amount) / equalMembers.length).toFixed(2)}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Percentage Split */}
                  {splitType === 'percentage' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">
                        Enter percentage for each member (must total 100%)
                      </p>
                      {members.map(member => (
                        <div key={member.id} className="flex items-center gap-2">
                          <span className="text-sm flex-1">{member.name || member.email}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={percentageMap[member.id] || ''}
                            onChange={(e) => setPercentageMap({ ...percentageMap, [member.id]: e.target.value })}
                            placeholder="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-500">%</span>
                          {percentageMap[member.id] && expenseForm.amount && (
                            <span className="text-sm text-gray-500 w-16 text-right">
                              ${((parseFloat(expenseForm.amount) * parseFloat(percentageMap[member.id])) / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                      <div className="pt-2 border-t text-sm font-semibold">
                        <span className={Math.abs(percentageTotal - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}>
                          Total: {percentageTotal.toFixed(2)}% {Math.abs(percentageTotal - 100) < 0.1 ? '✓' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Custom Amount Split */}
                  {splitType === 'custom' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">
                        Enter custom amount for each member
                      </p>
                      {members.map(member => (
                        <div key={member.id} className="flex items-center gap-2">
                          <span className="text-sm flex-1">{member.name || member.email}</span>
                          <span className="text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customMap[member.id] || ''}
                            onChange={(e) => setCustomMap({ ...customMap, [member.id]: e.target.value })}
                            placeholder="0.00"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                      {expenseForm.amount && (
                        <div className="pt-2 border-t text-sm font-semibold">
                          <span className={Math.abs(customTotal - parseFloat(expenseForm.amount)) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                            Total: ${customTotal.toFixed(2)} / ${parseFloat(expenseForm.amount).toFixed(2)}
                            {Math.abs(customTotal - parseFloat(expenseForm.amount)) < 0.01 ? ' ✓' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesTab;
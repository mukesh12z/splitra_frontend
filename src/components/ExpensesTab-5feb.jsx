import React, { useState, useEffect } from 'react';
import { Plus, X, DollarSign, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ExpensesTab({ group, currentUser, onUpdate }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Food',
    paidBy: currentUser.id,
    splitType: 'equal',
    splitWith: []
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
        `${API_URL}/api/expenses/group/${group.id}`,
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
        `${API_URL}/api/groups/${group.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const membersList = response.data.members || response.data.GroupMembers || [];
      setMembers(membersList.map(m => m.user || m.User || m));
      // Initialize splitWith to all members
      setExpenseForm(prev => ({ 
        ...prev, 
        splitWith: membersList.map(m => (m.user || m.User || m).id) 
      }));
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const calculateSettlements = () => {
    // Calculate who owes whom
    const balances = {};
    
    // Initialize balances
    members.forEach(member => {
      balances[member.id] = 0;
    });

    // Calculate balances from expenses
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

    // Calculate settlements (who owes whom)
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

    // Match debtors with creditors
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) { // Ignore very small amounts
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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const expenseData = {
        groupId: group.id,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        paidBy: expenseForm.paidBy,
        splitType: expenseForm.splitType,
        splitWith: expenseForm.splitWith
      };

      await axios.post(
        `${API_URL}/api/expenses`,
        expenseData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchExpenses();
      setShowAddModal(false);
      setExpenseForm({
        description: '',
        amount: '',
        category: 'Food',
        paidBy: currentUser.id,
        splitType: 'equal',
        splitWith: members.map(m => m.id)
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const getMemberName = (userId) => {
    const member = members.find(m => m.id === userId);
    return member?.name || member?.email || 'Unknown';
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

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
          onClick={() => setShowAddModal(true)}
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
                      Split with: {expense.ExpenseSplits.map(s => getMemberName(s.userId)).join(', ')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </div>
                  {expense.ExpenseSplits && expense.ExpenseSplits.length > 0 && (
                    <div className="text-sm text-gray-500">
                      ${(parseFloat(expense.amount) / expense.ExpenseSplits.length).toFixed(2)} each
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
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Split With
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {members.map(member => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expenseForm.splitWith.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExpenseForm({
                              ...expenseForm,
                              splitWith: [...expenseForm.splitWith, member.id]
                            });
                          } else {
                            setExpenseForm({
                              ...expenseForm,
                              splitWith: expenseForm.splitWith.filter(id => id !== member.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm">{member.name || member.email}</span>
                    </label>
                  ))}
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
                  disabled={expenseForm.splitWith.length === 0}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
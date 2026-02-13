import React, { useState, useEffect, useRef } from 'react';
import { Plus, Users, Calendar, MapPin, X } from 'lucide-react';
import api from '../services/api';
import CurrencySelector from './CurrencySelector';
const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
const currencyDropdownRef = useRef(null);
const [deleteLoading, setDeleteLoading] = useState(false);


function GroupsList({ currentUser, onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    currency: 'USD'  // ADD THIS LINE
  });

  useEffect(() => {
    fetchGroups();
  }, []);

// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
      setShowCurrencyDropdown(false);
    }
  };

  if (showCurrencyDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }
}, [showCurrencyDropdown]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups/my-groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/groups', createForm);
      setGroups([response.data, ...groups]);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', startDate: '', endDate: '' });
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };


  // Add delete handler
  const handleDeleteGroup = async (groupId, groupName, e) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm(`Delete "${groupName}"? This cannot be undone!`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      await api.delete(`/api/groups/${groupId}`);
      setGroups(groups.filter(g => g.id !== groupId));
      alert('Group deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || 'Failed to delete group');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading your groups...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Your Travel Groups</h2>
          <p className="text-gray-600 mt-1">Manage your trips and collaborate with friends</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
        >
          <Plus size={20} />
          Create New Group
        </button>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="text-center py-16">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No groups yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first travel group to start planning!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border-2 border-transparent hover:border-indigo-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
                {group.myRole === 'admin' && (
                  <>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-semibold">
                      Admin
                    </span>
                    <button
                      onClick={(e) => handleDeleteGroup(group.id, group.name, e)}
                      disabled={deleteLoading}
                      className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Delete Group"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {group.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>
                      {new Date(group.startDate).toLocaleDateString()}
                      {group.endDate && ` - ${new Date(group.endDate).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <span>{group.memberCount || group.GroupMembers?.length || 1} member(s)</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Code: <span className="font-mono font-bold">{group.inviteCode}</span>
                </span>
                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
                  Open →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Europe Trip 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe your trip..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              {/* Currency Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Currency
                </label>
                <div className="relative" ref={currencyDropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCurrencyDropdown(!showCurrencyDropdown);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center"
                  >
                    <span>{createForm.currency}</span>
                    <span>▼</span>
                  </button>

                  {showCurrencyDropdown && (
                    <div 
                      className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'].map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCreateForm({ ...createForm, currency: curr });
                            setShowCurrencyDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-indigo-50 ${
                            createForm.currency === curr ? 'bg-indigo-100' : ''
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    min={createForm.startDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                 {/*<CurrencySelector />   ← Add this */}
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Create Group
                </button>
                
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupsList;
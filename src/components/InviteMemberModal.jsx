import React, { useState } from 'react';
import { X, Phone, Search, UserPlus } from 'lucide-react';

function InviteMemberModal({ onInvite, onClose }) {
  const [phone, setPhone] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const searchByPhone = async () => {
    if (phone.length < 10) return;

    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/search-phone?phone=${phone}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search user');
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = (user) => {
    onInvite({
      id: user.id,
      name: user.name,
      phone: user.phone,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Invite Member</h3>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={searchByPhone}
                disabled={searching}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Search size={18} />
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y">
              {searchResults.map(user => (
                <div key={user.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-semibold text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.phone}</div>
                  </div>
                  <button
                    onClick={() => handleInvite(user)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                  >
                    <UserPlus size={16} />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && phone.length >= 10 && !searching && (
            <div className="text-center py-8 text-gray-500">
              <p>No user found with this phone number</p>
              <p className="text-sm mt-2">Make sure they've registered first</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InviteMemberModal;
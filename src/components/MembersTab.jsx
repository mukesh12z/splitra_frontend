import React, { useState, useEffect } from 'react';
import { Plus, X, UserPlus, Trash2, Shield, Copy, Check } from 'lucide-react';
import api from '../services/api';

function MembersTab({ group, currentUser, onUpdate }) {
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [group.id]);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/groups/${group.id}`);
      
      const membersList = response.data.members || response.data.GroupMembers || [];
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/groups/invite', {
        groupId: group.id,
        phone: phoneNumber
      });

      alert('Member added successfully!');
      fetchMembers();
      setShowAddModal(false);
      setPhoneNumber('');
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/groups/${group.id}/members/${memberId}`);

      alert('Member removed successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Check if user is admin - don't wait for members array
  const isAdmin = group.myRole === 'admin' || group.createdBy === currentUser.id;

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      {/*<div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Invite Members</h3>
        <p className="text-sm text-gray-600 mb-4">
          Share this code with friends to let them join the group:
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white px-4 py-3 rounded-lg border-2 border-indigo-300">
            <div className="text-xs text-gray-500 mb-1">Invite Code</div>
            <div className="text-2xl font-bold font-mono text-indigo-600">
              {group.inviteCode}
            </div>
          </div>
          <button
            onClick={copyInviteCode}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            {copiedCode ? <Check size={20} /> : <Copy size={20} />}
            {copiedCode ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div> */}

      {/* Add Member Button */}
      {isAdmin && (
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Members ({members.length})</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <UserPlus size={20} />
            Add Member
          </button>
        </div>
      )}

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => {
          const user = member.user || member.User || member;
          const role = member.role || 'member';
          
          return (
            <div
              key={member.id || user.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(user.name || user.email)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {user.name || 'Unknown'}
                    {user.id === currentUser.id && (
                      <span className="text-xs text-gray-500 ml-2">(You)</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.phone && (
                    <p className="text-xs text-gray-500">{user.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {role === 'admin' && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                    <Shield size={14} />
                    Admin
                  </span>
                )}
                {isAdmin && user.id !== currentUser.id && role !== 'admin' && (
                  <button
                    onClick={() => handleRemoveMember(user.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Remove member"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Add Member</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  The person must have an account with this phone number.
                </p>
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
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembersTab;
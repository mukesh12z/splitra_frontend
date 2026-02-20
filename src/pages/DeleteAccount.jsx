import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../services/api';

function DeleteAccount() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ THIS TRIGGERS THE EMAIL
      await api.post('/auth/request-deletion', { email });
      setSubmitted(true);
    } catch (err) {
      console.error('Deletion request error:', err);
      setError('Failed to send deletion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        {!submitted ? (
          <>
            {/* Warning Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Delete Account</h1>
                <p className="text-sm text-gray-600">SpliTravel</p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 ">
              <div className="flex gap-2">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-2">This action is permanent!</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All your groups and other data will be deleted</li>
                    <li>This cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  We'll send a confirmation link to this email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={20} />
                {loading ? 'Sending...' : 'Request Account Deletion'}
              </button>
            </form>

            
          </>
        ) : (
          /* Success Message */
          <div className="text-center py-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a confirmation email to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Click the link in the email to complete account deletion.
              This link will expire in 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeleteAccount;
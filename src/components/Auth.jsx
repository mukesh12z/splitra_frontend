import React, { useState } from 'react';
import { MapPin, Mail, Lock, User, Phone } from 'lucide-react';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const validators = {
    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) return 'Email is required';
      if (!emailRegex.test(value)) return 'Please enter a valid email address';
      return null;
    },

    password: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
      if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
      if (!/\d/.test(value)) return 'Password must contain a number';
      return null;
    },

    name: (value) => {
      if (!value || !value.trim()) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (value.trim().length > 50) return 'Name must be less than 50 characters';
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
      return null;
    },

    phone: (value) => {
      if (!value || !value.trim()) return 'Phone number is required';
      // Remove spaces and dashes for validation
      const cleanPhone = value.replace(/[\s-]/g, '');
      if (!/^\+?[1-9]\d{1,14}$/.test(cleanPhone)) {
        return 'Please enter a valid phone number (e.g., +91 98765 43210)';
      }
      return null;
    }
  };

   const validateForm = () => {
    const errors = {};

    // Validate email (always required)
    const emailError = validators.email(email);
    if (emailError) errors.email = emailError;

    // Validate password (always required)
    const passwordError = validators.password(password);
    if (passwordError) errors.password = passwordError;

    // Validate name and phone only for registration
    if (!isLogin) {
      const nameError = validators.name(name);
      if (nameError) errors.name = nameError;

      const phoneError = validators.phone(phone);
      if (phoneError) errors.phone = phoneError;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field, value, validator) => {
    // Update the field value
    switch(field) {
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'name': setName(value); break;
      case 'phone': setPhone(value); break;
    }

    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }

    // Clear general error
    if (error) setError('');
  };

   const handleBlur = (field, value, validator) => {
    const errorMsg = validator(value);
    if (errorMsg) {
      setFieldErrors(prev => ({ ...prev, [field]: errorMsg }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Frontend validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
       ? { email: email.trim(), password }
        : { email: email.trim(), password, name: name.trim(), phone: phone.trim() };


      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
          if (data.details && Array.isArray(data.details)) {
          const backendErrors = {};
          data.details.forEach(err => {
            backendErrors[err.path || err.param] = err.msg;
          });
          setFieldErrors(backendErrors);
          setError('Please fix the errors below');
      }else {
          setError(data.error || 'Authentication failed');
        }
        return;
      }
      // Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    setFieldErrors({});
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white">
          <div className="flex items-center justify-center gap-3 mb-2">
            <MapPin size={40} />
            <h1 className="text-3xl font-bold">TravelMate</h1>
          </div>
          <p className="text-center text-blue-100">Your complete travel companion</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => handleToggleMode(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                isLogin ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleToggleMode(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                !isLogin ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Register
            </button>
          </div>

          {/* General Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleFieldChange('name', e.target.value, validators.name)}
                    onBlur={(e) => handleBlur('name', e.target.value, validators.name)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      fieldErrors.name ? 'border-red-500' : ''
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value, validators.email)}
                  onBlur={(e) => handleBlur('email', e.target.value, validators.email)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    fieldErrors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Phone Field (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value, validators.phone)}
                    onBlur={(e) => handleBlur('phone', e.target.value, validators.phone)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      fieldErrors.phone ? 'border-red-500' : ''
                    }`}
                    placeholder="+91 98765 43210"
                  />
                </div>
                {fieldErrors.phone ? (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {fieldErrors.phone}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Used for group invitations
                  </p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value, validators.password)}
                  onBlur={(e) => handleBlur('password', e.target.value, validators.password)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    fieldErrors.password ? 'border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {fieldErrors.password ? (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {fieldErrors.password}
                </p>
              ) : !isLogin ? (
                <p className="text-xs text-gray-500 mt-1">
                  Min 6 characters with uppercase, lowercase, and number
                </p>
              ) : null}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => handleToggleMode(false)} className="text-indigo-600 font-medium hover:underline">
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button onClick={() => handleToggleMode(true)} className="text-indigo-600 font-medium hover:underline">
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
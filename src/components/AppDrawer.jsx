import React from 'react';
import { X, Settings, LogOut, User, HelpCircle, Info } from 'lucide-react';

function AppDrawer({ isOpen, onClose, currentUser, onLogout, onOpenSettings }) {
  if (!isOpen) return null;

  const handleLogout = () => {
    onClose();
    if (onLogout) onLogout();
  };

  const handleSettings = () => {
    onClose();
    if (onOpenSettings) onOpenSettings();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
          <button onClick={onClose} className="absolute top-4 right-4">
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3 mt-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <User size={32} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{currentUser?.name || 'User'}</h3>
              <p className="text-sm text-blue-100">{currentUser?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2">
          {/* Settings - Working */}
          <MenuItem 
            icon={Settings} 
            label="Settings" 
            onClick={handleSettings}
          />
          
          {/* My Profile - Disabled for now */}
          <MenuItem 
            icon={User} 
            label="My Profile" 
            onClick={() => alert('Coming soon!')}
            disabled
          />
          
          {/* Help & Support - Disabled for now */}
          <MenuItem 
            icon={HelpCircle} 
            label="Help & Support" 
            onClick={() => alert('Coming soon!')}
            disabled
          />
          
          {/* About - Disabled for now */}
          <MenuItem 
            icon={Info} 
            label="About TravelMate" 
            onClick={() => alert('Coming soon!')}
            disabled
          />
          
          <div className="border-t my-4" />
          
          {/* Logout - Working */}
          <MenuItem 
            icon={LogOut} 
            label="Logout" 
            onClick={handleLogout}
            danger
          />
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-gray-500 border-t">
          TravelMate v1.0.0
        </div>
      </div>
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
        disabled 
          ? 'text-gray-400 cursor-not-allowed' 
          : danger 
            ? 'text-red-500 hover:bg-red-50' 
            : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon size={22} />
      <span className="font-medium">{label}</span>
      {disabled && <span className="ml-auto text-xs">(Soon)</span>}
    </button>
  );
}

export default AppDrawer;
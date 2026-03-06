import React from 'react';
import { Users, X, Settings, LogOut, User, HelpCircle, Info } from 'lucide-react';
import UserSettings from './UserSettings';
import DeleteAccount from './pages/DeleteAccount';

function AppDrawer({ isOpen, onClose, currentUser, onLogout, onOpenSettings }) {
  if (!isOpen) return null;
 useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    const [showSettings, setShowSettings] = useState(false);

    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const path = window.location.pathname;
  
  // Public routes (no login required)
  if (path === '/delete-account') {
    return <DeleteAccount />;
  }
  
  const handleLogin = (user, token) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedGroup(null);
  };
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300">
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
              <h3 className="font-bold text-lg">{currentUser?.name}</h3>
              <p className="text-sm text-blue-100">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2">
          <MenuItem 
            icon={Settings} 
            label="Settings" 
            onClick={() => {
              setShowSettings(true);
              onClose();
            }}
          />
          
          <MenuItem 
            icon={User} 
            label="My Profile" 
            onClick={() => {
              // Navigate to profile
              onClose();
            }}
          />
          
          <MenuItem 
            icon={HelpCircle} 
            label="Help & Support" 
            onClick={() => {
              // Navigate to help
              onClose();
            }}
          />
          
          <MenuItem 
            icon={Info} 
            label="About SpliTravel" 
            onClick={() => {
              // Navigate to about
              onClose();
            }}
          />
          
          <div className="border-t my-4" />
          
          <MenuItem 
            icon={LogOut} 
            label="Logout" 
            onClick={handleLogout}
            danger
          />
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-gray-500 border-t">
          SpliTravel v1.0.0
        </div>
      </div>
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition ${
        danger ? 'text-red-500' : 'text-gray-700'
      }`}
    >
      <Icon size={22} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default AppDrawer;
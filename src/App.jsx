import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import GroupsList from './components/GroupsList';
import GroupDashboard from './components/GroupDashboard';
import { Users, LogOut } from 'lucide-react';
import { Settings } from 'lucide-react';
import UserSettings from './components/UserSettings';
import DeleteAccount from './pages/DeleteAccount';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

import { Menu } from 'lucide-react';
import AppDrawer from './components/AppDrawer';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);
  
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#4F46E5' });
      StatusBar.setOverlaysWebView({ overlay: false });
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

  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="text-indigo-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">SpliTravel</h1>
               <button onClick={() => setDrawerOpen(true)} className="p-2">
                  <Menu size={24} />
                </button>
              {selectedGroup && (
                <p className="text-sm text-gray-600">{selectedGroup.name}</p>
              )}
            </div>
          </div>
          
        </div>
      </header>

      {/* Main Content */}
    {selectedGroup ? (
        <GroupDashboard 
          group={selectedGroup} 
          currentUser={currentUser}
          onBack={handleBackToGroups}
        />
      ) : showSettings ? (
        <UserSettings 
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateUser={(user) => setCurrentUser(user)}
          onBack={() => setShowSettings(false)}  
          
        />
      ) : (
        <GroupsList 
          currentUser={currentUser} 
          onSelectGroup={setSelectedGroup}
        />
      )}
    </div>
  );
}

export default App;
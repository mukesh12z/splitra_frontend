import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import GroupsList from './components/GroupsList';
import GroupDashboard from './components/GroupDashboard';
import { Users, LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

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
              <h1 className="text-2xl font-bold text-gray-800">TravelMate</h1>
              {selectedGroup && (
                <p className="text-sm text-gray-600">{selectedGroup.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {currentUser?.name || currentUser?.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {!selectedGroup ? (
        <GroupsList 
          currentUser={currentUser} 
          onSelectGroup={setSelectedGroup}
        />
      ) : (
        <GroupDashboard 
          group={selectedGroup} 
          currentUser={currentUser}
          onBack={handleBackToGroups}
        />
      )}
    </div>
  );
}

export default App;
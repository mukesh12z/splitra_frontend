import React, { useState } from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import AppDrawer from './AppDrawer';

function GroupDashboard({ group, currentUser, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('expenses');
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Drawer */}
      <AppDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenSettings={() => {/* Navigate to settings */}}
      />

      <div className="flex flex-col h-screen">
        {/* Header - Clean with just hamburger */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg" 
             style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="p-4 flex items-center gap-3">
            {/* Hamburger Menu - Left side */}
            <button 
              onClick={() => setDrawerOpen(true)} 
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <Menu size={24} />
            </button>
            
            {/* Group Name - Center */}
            <div className="flex-1">
              <h2 className="font-bold text-lg">{group.name}</h2>
              <p className="text-xs text-blue-100">{group.GroupMembers?.length} members</p>
            </div>
            
            {/* Back button - Right side */}
            <button 
              onClick={onBack} 
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" 
             style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
          {activeTab === 'expenses' && <ExpensesTab group={group} currentUser={currentUser} />}
          {activeTab === 'itinerary' && <ItineraryTab group={group} currentUser={currentUser} />}
          {activeTab === 'map' && <MapTab group={group} currentUser={currentUser} />}
          {activeTab === 'members' && <MembersTab group={group} currentUser={currentUser} />}
          {activeTab === 'tools' && <ToolsTab group={group} currentUser={currentUser} />}
        </div>

        {/* Bottom Navigation - Safe area padding */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg"
             style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex justify-around h-16">
            <NavButton icon={Receipt} label="Expenses" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
            <NavButton icon={Calendar} label="Itinerary" active={activeTab === 'itinerary'} onClick={() => setActiveTab('itinerary')} />
            <NavButton icon={MapPin} label="Map" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
            <NavButton icon={Users} label="Members" active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
            <NavButton icon={Wrench} label="Tools" active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} />
          </div>
        </div>
      </div>
    </>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center py-2 min-w-[60px]">
      <Icon size={22} className={active ? 'text-indigo-600' : 'text-gray-400'} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-xs mt-1 ${active ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>{label}</span>
    </button>
  );
}

export default GroupDashboard;
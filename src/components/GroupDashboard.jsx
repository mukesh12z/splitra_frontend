import React, { useState } from 'react';
import { ArrowLeft, Receipt, Calendar, MapPin, Users, FileText, Wrench } from 'lucide-react';
import ExpensesTab    from './ExpensesTab';
import ItineraryTab   from './ItineraryTab';
import MapTab         from './MapTab';
import MembersTab     from './MembersTab';
import DocumentsTab   from './Documentstab';
import ToolsTab       from './ToolsTab';

function GroupDashboard({ group, currentUser, onBack }) {
  const [activeTab,  setActiveTab]  = useState('expenses');
  const [groupData,  setGroupData]  = useState(group);

  // If no group data, show loading
  if (!groupData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading group...</div>
      </div>
    );
  }
  
  const tabs = [
    { id: 'expenses',  label: 'Expenses',  icon: Receipt  },
    { id: 'members',   label: 'Members',   icon: Users    },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'map',       label: 'Map',       icon: MapPin   },
    /*{ id: 'documents', label: 'Docs',      icon: FileText }*/,
    { id: 'tools',     label: 'Tools',     icon: Wrench   },
  ];

  const refreshGroupData = (updatedData) => {
    setGroupData({ ...groupData, ...updatedData });
  };

   return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header - Fixed */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-indigo-600">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-lg text-gray-800 truncate">{groupData.name}</h2>
          <p className="text-xs text-gray-500">{groupData.GroupMembers?.length || 0} members</p>
        </div>
        <button className="text-gray-600">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'expenses' && <ExpensesTab group={groupData} currentUser={currentUser} />}
        {activeTab === 'itinerary' && <ItineraryTab group={groupData} currentUser={currentUser} />}
        {activeTab === 'map' && <MapTab group={groupData} currentUser={currentUser} />}
        {activeTab === 'members' && <MembersTab group={groupData} currentUser={currentUser} />}
        {activeTab === 'more' && <MoreTab group={groupData} currentUser={currentUser} />}
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          <NavButton
            icon={Receipt}
            label="Expenses"
            active={activeTab === 'expenses'}
            onClick={() => setActiveTab('expenses')}
          />
          <NavButton
            icon={Calendar}
            label="Itinerary"
            active={activeTab === 'itinerary'}
            onClick={() => setActiveTab('itinerary')}
          />
          <NavButton
            icon={MapPin}
            label="Map"
            active={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
          />
          <NavButton
            icon={Users}
            label="Members"
            active={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
          />
          <NavButton
            icon={MoreHorizontal}
            label="More"
            active={activeTab === 'more'}
            onClick={() => setActiveTab('more')}
          />
        </div>
      </div>
    </div>
  );
}

// Bottom Nav Button Component
function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
    >
      <Icon 
        size={24} 
        className={active ? 'text-indigo-600' : 'text-gray-400'}
        strokeWidth={active ? 2.5 : 2}
      />
      <span className={`text-xs mt-1 ${active ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  );
}

export default GroupDashboard;
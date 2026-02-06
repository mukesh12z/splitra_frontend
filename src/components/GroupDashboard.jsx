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

  const tabs = [
    { id: 'expenses',  label: 'Expenses',  icon: Receipt  },
    { id: 'members',   label: 'Members',   icon: Users    },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'map',       label: 'Map',       icon: MapPin   },
    { id: 'documents', label: 'Docs',      icon: FileText },
    { id: 'tools',     label: 'Tools',     icon: Wrench   },
  ];

  const refreshGroupData = (updatedData) => {
    setGroupData({ ...groupData, ...updatedData });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back + group header */}
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4">
          <ArrowLeft size={20}/> Back to Groups
        </button>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{groupData.name}</h2>
              {groupData.description && <p className="text-gray-600 mt-2">{groupData.description}</p>}
              <div className="flex gap-4 mt-4 text-sm text-gray-500 flex-wrap">
                {groupData.startDate && (
                  <span>📅 {new Date(groupData.startDate).toLocaleDateString()}
                    {groupData.endDate && ` – ${new Date(groupData.endDate).toLocaleDateString()}`}
                  </span>
                )}
                <span>👥 {groupData.GroupMembers?.length || 0} members</span>
                <span className="font-mono">Code: {groupData.inviteCode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* tab bar – scrollable on small screens */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-5 py-4 font-semibold text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                  <Icon size={18}/> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* tab content */}
        <div className="p-6">
          {activeTab === 'expenses'  && <ExpensesTab   group={groupData} currentUser={currentUser} onUpdate={refreshGroupData}/>}
          {activeTab === 'members'   && <MembersTab    group={groupData} currentUser={currentUser} onUpdate={refreshGroupData}/>}
          {activeTab === 'itinerary' && <ItineraryTab  group={groupData} currentUser={currentUser} onUpdate={refreshGroupData}/>}
          {activeTab === 'map'       && <MapTab        group={groupData} currentUser={currentUser}/>}
          {activeTab === 'documents' && <DocumentsTab  group={groupData} currentUser={currentUser}/>}
          {activeTab === 'tools'     && <ToolsTab      group={groupData} currentUser={currentUser}/>}
        </div>
      </div>
    </div>
  );
}

export default GroupDashboard;
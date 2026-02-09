import React, { useState } from 'react';
import { ArrowRightLeft, Bot, Users, BookOpen, Phone } from 'lucide-react';
import CurrencyConverter from './CurrencyConverter';
import AIItineraryGenerator from './AIItineraryGenerator';
import PollTab from './PollTab';
import LanguagePhrases from './LanguagePhrases';
import ImportantContacts from './ImportantContacts';

/* ── tool definitions ── */
const TOOLS = [
  { id: 'currency',   label: 'Currency Converter',  icon: ArrowRightLeft, color: 'indigo' },
 /* { id: 'ai-itinerary', label: 'AI Itinerary',     icon: Bot,            color: 'purple' }*/,
  { id: 'poll',       label: 'Group Poll',          icon: Users,          color: 'blue'   },
  { id: 'phrases',    label: 'Language Phrases',    icon: BookOpen,       color: 'green'  },
  { id: 'contacts',   label: 'Important Contacts',  icon: Phone,          color: 'orange' }
];

const iconBg = {
  indigo: 'bg-indigo-100 text-indigo-600',
  purple: 'bg-purple-100 text-purple-600',
  blue:   'bg-blue-100 text-blue-600',
  green:  'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600'
};

export default function ToolsTab({ group, currentUser }) {
  const [activeTool, setActiveTool] = useState(null);

  /* ── if a tool is open, render it full-width ── */
  if (activeTool) {
    const tool = TOOLS.find(t => t.id === activeTool);
    return (
      <div className="space-y-4">
        {/* back bar */}
        <button onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
          ← Back to Tools
        </button>
        <h3 className="text-xl font-bold text-gray-800">{tool?.label}</h3>
        <hr className="border-gray-200"/>

        {activeTool === 'currency'      && <CurrencyConverter />}
        {/*activeTool === 'ai-itinerary'  && <AIItineraryGenerator group={group} />*/}
        {activeTool === 'poll'          && <PollTab group={group} currentUser={currentUser} />}
        {activeTool === 'phrases'       && <LanguagePhrases group={group} />}
        {activeTool === 'contacts'      && <ImportantContacts group={group} currentUser={currentUser} />}
      </div>
    );
  }

  /* ── tool grid (landing) ── */
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800">Tools</h3>
        <p className="text-sm text-gray-500 mt-1">Handy utilities for your trip</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          return (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)}
              className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:shadow-md hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg[tool.color]}`}>
                  <Icon size={24}/>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{tool.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{toolDesc(tool.id)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toolDesc(id) {
  const map = {
    'currency':     'Convert between currencies in real-time',
    /*'ai-itinerary': 'Generate a smart itinerary with AI',*/
    'poll':         'Create & vote on group decisions',
    'phrases':      'Useful phrases in local languages',
    'contacts':     'Emergency & important contacts'
  };
  return map[id] || '';
}
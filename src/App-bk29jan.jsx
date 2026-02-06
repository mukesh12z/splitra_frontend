import React, { useState, useEffect } from 'react';
import { MapPin, Receipt, Users, Calendar, FileText, Globe, Plus, X, Percent, Edit2, Trash2, Bell, Upload, Search, Loader } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([{ id: 1, name: 'You', color: '#3b82f6' }]);
  const [locations, setLocations] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [currency, setCurrency] = useState('USD');
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [showLanguagePhrases, setShowLanguagePhrases] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(null);

  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    const savedMembers = localStorage.getItem('members');
    const savedLocations = localStorage.getItem('locations');
    const savedItinerary = localStorage.getItem('itinerary');
    const savedDocuments = localStorage.getItem('documents');
    
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    if (savedMembers) setMembers(JSON.parse(savedMembers));
    if (savedLocations) setLocations(JSON.parse(savedLocations));
    if (savedItinerary) setItinerary(JSON.parse(savedItinerary));
    if (savedDocuments) setDocuments(JSON.parse(savedDocuments));

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkReminders();
  }, [itinerary]);

  const checkReminders = () => {
    const now = new Date();
    itinerary.forEach(item => {
      if (item.reminder && !item.reminderShown) {
        const activityTime = new Date(item.date);
        if (item.time) {
          const [hours, minutes] = item.time.split(':');
          activityTime.setHours(parseInt(hours), parseInt(minutes));
        }
        const reminderTime = new Date(activityTime.getTime() - (item.reminderMinutes || 30) * 60000);
        if (now >= reminderTime && now < activityTime) {
          if (Notification.permission === 'granted') {
            new Notification('TravelMate Reminder', {
              body: `${item.activity} at ${item.location} in ${item.reminderMinutes || 30} minutes!`,
            });
          } else {
            alert(`Reminder: ${item.activity} at ${item.location} in ${item.reminderMinutes || 30} minutes!`);
          }
          const updated = itinerary.map(i => 
            i.id === item.id ? { ...i, reminderShown: true } : i
          );
          saveItinerary(updated);
        }
      }
    });
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const saveExpenses = (data) => {
    setExpenses(data);
    localStorage.setItem('expenses', JSON.stringify(data));
  };

  const saveMembers = (data) => {
    setMembers(data);
    localStorage.setItem('members', JSON.stringify(data));
  };

  const saveLocations = (data) => {
    setLocations(data);
    localStorage.setItem('locations', JSON.stringify(data));
  };

  const saveItinerary = (data) => {
    setItinerary(data);
    localStorage.setItem('itinerary', JSON.stringify(data));
  };

  const saveDocuments = (data) => {
    setDocuments(data);
    localStorage.setItem('documents', JSON.stringify(data));
  };

  const addExpense = (expense) => {
    const newExpense = { id: Date.now(), ...expense, date: new Date().toISOString() };
    saveExpenses([...expenses, newExpense]);
    setShowAddExpense(false);
  };

  const addMember = (name) => {
    const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const newMember = { id: Date.now(), name, color: colors[members.length % colors.length] };
    saveMembers([...members, newMember]);
    setShowAddMember(false);
  };

  const addLocation = (location) => {
    const newLocation = { id: Date.now(), ...location, createdAt: new Date().toISOString() };
    saveLocations([...locations, newLocation]);
    setShowAddLocation(false);
  };

  const addItineraryItem = (item) => {
    const newItem = { id: Date.now(), ...item, createdAt: new Date().toISOString(), reminderShown: false };
    saveItinerary([...itinerary, newItem]);
    setShowAddItinerary(false);
  };

  const updateItineraryItem = (item) => {
    const updated = itinerary.map(i => i.id === item.id ? { ...item, reminderShown: false } : i);
    saveItinerary(updated);
    setEditingItinerary(null);
  };

  const deleteItineraryItem = (id) => {
    if (confirm('Delete this activity?')) {
      saveItinerary(itinerary.filter(i => i.id !== id));
    }
  };

  const addDocument = (doc) => {
    const newDoc = { id: Date.now(), ...doc, uploadedAt: new Date().toISOString() };
    saveDocuments([...documents, newDoc]);
    setShowAddDocument(false);
  };

  const deleteDocument = (id) => {
    if (confirm('Delete this document?')) {
      saveDocuments(documents.filter(d => d.id !== id));
    }
  };

  const calculateBalances = () => {
    const balances = {};
    members.forEach(m => balances[m.id] = 0);
    expenses.forEach(expense => {
      if (expense.splitType === 'percentage') {
        balances[expense.paidBy] += expense.amount;
        expense.splitWith.forEach(split => {
          balances[split.memberId] -= (expense.amount * split.percentage) / 100;
        });
      } else {
        const perPerson = expense.amount / expense.splitWith.length;
        balances[expense.paidBy] += expense.amount;
        expense.splitWith.forEach(memberId => balances[memberId] -= perPerson);
      }
    });
    return balances;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="text-indigo-600" size={28} />
              <h1 className="text-2xl font-bold text-gray-800">TravelMate Pro</h1>
            </div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="GBP">GBP £</option>
              <option value="INR">INR ₹</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'expenses', icon: Receipt, label: 'Expenses' },
              { id: 'split', icon: Users, label: 'Split' },
              { id: 'itinerary', icon: Calendar, label: 'Itinerary' },
              { id: 'map', icon: MapPin, label: 'Map' },
              { id: 'docs', icon: FileText, label: 'Documents' },
              { id: 'tools', icon: Globe, label: 'Tools' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'expenses' && <ExpensesTab expenses={expenses} members={members} currency={currency} onAdd={() => setShowAddExpense(true)} />}
        {activeTab === 'split' && <SplitTab members={members} expenses={expenses} currency={currency} balances={calculateBalances()} onAdd={() => setShowAddMember(true)} />}
        {activeTab === 'itinerary' && (
          <ItineraryTab 
            itinerary={itinerary} 
            locations={locations} 
            onAdd={() => setShowAddItinerary(true)}
            onEdit={(item) => setEditingItinerary(item)}
            onDelete={deleteItineraryItem}
          />
        )}
        {activeTab === 'map' && <MapTab itinerary={itinerary} locations={locations} onAdd={() => setShowAddLocation(true)} />}
        {activeTab === 'docs' && <DocsTab documents={documents} onAdd={() => setShowAddDocument(true)} onDelete={deleteDocument} />}
        {activeTab === 'tools' && (
          <ToolsTab 
            onCurrencyConverter={() => setShowCurrencyConverter(true)}
            onLanguagePhrases={() => setShowLanguagePhrases(true)}
            onEmergency={() => setShowEmergency(true)}
          />
        )}
      </div>

      {showAddExpense && <ExpenseModal members={members} currency={currency} onSave={addExpense} onClose={() => setShowAddExpense(false)} />}
      {showAddMember && <MemberModal onSave={addMember} onClose={() => setShowAddMember(false)} />}
      {showAddLocation && <LocationModal onSave={addLocation} onClose={() => setShowAddLocation(false)} />}
      {showAddItinerary && <ItineraryModal onSave={addItineraryItem} onClose={() => setShowAddItinerary(false)} />}
      {editingItinerary && <ItineraryModal item={editingItinerary} onSave={updateItineraryItem} onClose={() => setEditingItinerary(null)} />}
      {showAddDocument && <DocumentModal onSave={addDocument} onClose={() => setShowAddDocument(false)} />}
      {showCurrencyConverter && <CurrencyConverterModal onClose={() => setShowCurrencyConverter(false)} />}
      {showLanguagePhrases && <LanguagePhrasesModal onClose={() => setShowLanguagePhrases(false)} />}
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
    </div>
  );
}

// ... (keep all the previous tab components: ExpensesTab, SplitTab - they remain the same)

function ExpensesTab({ expenses, members, currency, onAdd }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Expenses</h2>
        <button onClick={onAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus size={20} />Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Spent</div>
          <div className="text-2xl font-bold text-gray-800">{currency} {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Your Expenses</div>
          <div className="text-2xl font-bold text-indigo-600">{currency} {expenses.filter(e => e.paidBy === 1).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-800">{expenses.length}</div>
        </div>
      </div>

      <div className="space-y-3">
        {expenses.map(expense => {
          const payer = members.find(m => m.id === expense.paidBy);
          return (
            <div key={expense.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{expense.description}</h3>
                  <div className="text-sm text-gray-600">Paid by <span className="font-medium" style={{ color: payer?.color }}>{payer?.name}</span></div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(expense.date).toLocaleDateString()} • {expense.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-800">{currency} {expense.amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-600">{expense.splitType === 'percentage' ? 'Custom' : `Split: ${expense.splitWith?.length || 1}`}</div>
                </div>
              </div>
            </div>
          );
        })}
        {expenses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No expenses yet. Add your first expense!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SplitTab({ members, expenses, currency, balances, onAdd }) {
  const getSettlements = () => {
    const settlements = [];
    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([memberId, balance]) => {
      if (balance < -0.01) debtors.push({ id: parseInt(memberId), amount: -balance });
      else if (balance > 0.01) creditors.push({ id: parseInt(memberId), amount: balance });
    });
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);
      settlements.push({
        from: members.find(m => m.id === debtors[i].id)?.name,
        to: members.find(m => m.id === creditors[j].id)?.name,
        amount: amount.toFixed(2)
      });
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }
    return settlements;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Group Members</h2>
        <button onClick={onAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus size={20} />Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map(member => {
          const balance = balances[member.id] || 0;
          return (
            <div key={member.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: member.color }}>
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{member.name}</div>
                    <div className="text-sm text-gray-600">{expenses.filter(e => e.paidBy === member.id).length} expenses</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {balance > 0 ? '+' : ''}{currency} {Math.abs(balance).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{balance > 0 ? 'Gets back' : balance < 0 ? 'Owes' : 'Settled'}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Suggested Settlements</h3>
        <div className="space-y-3">
          {getSettlements().map((s, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <span className="font-medium">{s.from}</span>
                <span className="text-gray-600">pays</span>
                <span className="font-medium">{s.to}</span>
              </div>
              <div className="text-lg font-bold text-indigo-600">{currency} {s.amount}</div>
            </div>
          ))}
          {getSettlements().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>All settled up! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItineraryTab({ itinerary, locations, onAdd, onEdit, onDelete }) {
  const getLocationTips = (locationName) => {
    return locations.find(loc => 
      loc.name.toLowerCase().includes(locationName.toLowerCase()) ||
      locationName.toLowerCase().includes(loc.name.toLowerCase())
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Travel Itinerary</h2>
        <button onClick={onAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus size={20} />Add Activity
        </button>
      </div>

      <div className="space-y-3">
        {itinerary.sort((a, b) => new Date(a.date) - new Date(b.date)).map((item, index) => {
          const tips = getLocationTips(item.location);
          return (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-600" />
                      <span className="font-semibold">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                      {item.time && <span className="text-sm text-gray-600">• {item.time}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.reminder && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      <Bell size={12} />
                      {item.reminderMinutes}min
                    </div>
                  )}
                  <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{item.activity}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin size={14} />{item.location}
              </div>
              {item.notes && <p className="text-sm text-gray-600 mb-2">{item.notes}</p>}
              {item.booking && <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">Booking: {item.booking}</div>}
              {tips && tips.notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="font-semibold text-sm text-blue-900">Tips for this location!</span>
                  </div>
                  <p className="text-sm text-blue-800">{tips.notes}</p>
                </div>
              )}
            </div>
          );
        })}
        {itinerary.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No activities planned. Start building your itinerary!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MapTab({ itinerary, locations, onAdd }) {
  const itineraryMarkers = itinerary
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((item, index) => ({
      ...item,
      index: index + 1,
      lat: item.latitude || (28.6139 + (index * 0.02)),
      lng: item.longitude || (77.2090 + (index * 0.02))
    }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Travel Map</h2>
        <button onClick={onAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus size={20} />Add Place
        </button>
      </div>

      {itineraryMarkers.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-3">Itinerary Route Map</h3>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-4">
            <div className="grid grid-cols-1 gap-3">
              {itineraryMarkers.map((marker) => (
                <div 
                  key={marker.id} 
                  className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                      {marker.index}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{marker.activity}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin size={14} />
                        {marker.location}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(marker.date).toLocaleDateString()}
                        {marker.time && ` • ${marker.time}`}
                      </div>
                    </div>
                  </div>
                  {marker.notes && (
                    <p className="text-sm text-gray-600 mt-2 ml-13">{marker.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="text-sm text-blue-900">
              <strong>Route Overview:</strong> {itineraryMarkers.length} stops planned
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold text-gray-800 mb-3">Saved Places</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
              <h3 className="font-bold text-gray-800 mb-1">{loc.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin size={14} />{loc.address}
              </div>
              {loc.category && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{loc.category}</span>}
              {loc.notes && <p className="text-sm text-gray-600 mt-2">{loc.notes}</p>}
            </div>
          ))}
        </div>
        {locations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No saved places yet</p>
          </div>
        )}
      </div>

      {itineraryMarkers.length === 0 && locations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Add itinerary items to see your route!</p>
        </div>
      )}
    </div>
  );
}

function DocsTab({ documents, onAdd, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Travel Documents</h2>
        <button onClick={onAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus size={20} />Add Document
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="text-sm text-yellow-900">
          <strong>Tip:</strong> Store important travel documents like passports, visas, tickets, and insurance policies.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{doc.name}</h3>
              <div className="text-sm text-gray-600">{doc.type}</div>
              <div className="text-xs text-gray-500 mt-1">
                Added {new Date(doc.uploadedAt).toLocaleDateString()}
              </div>
              {doc.number && (
                <div className="text-xs text-gray-700 mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                  {doc.number}
                </div>
              )}
              {doc.expiryDate && (
                <div className="text-xs text-red-600 mt-1">
                  Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => onDelete(doc.id)} className="text-red-600 hover:text-red-800">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    ))}
  </div>

  {documents.length === 0 && (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <FileText size={48} className="mx-auto mb-4 text-gray-300" />
      <p className="text-gray-500">No documents stored yet. Add your first document!</p>
    </div>
  )}
</div>
);
}
function ToolsTab({ onCurrencyConverter, onLanguagePhrases, onEmergency }) {
return (
<div className="space-y-4">
<h2 className="text-xl font-bold text-gray-800">Travel Tools</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<button 
       onClick={onCurrencyConverter}
       className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
     >
<div className="flex items-center gap-3 mb-2">
<h3 className="font-bold text-gray-800">Currency Converter</h3>
</div>
<p className="text-sm text-gray-600">Convert between currencies with live rates</p>
</button>
<button 
      onClick={onLanguagePhrases}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
    >
      <div className="flex items-center gap-3 mb-2">
        <Globe size={24} className="text-green-600" />
        <h3 className="font-bold text-gray-800">Language Phrases</h3>
      </div>
      <p className="text-sm text-gray-600">Essential travel phrases in multiple languages</p>
    </button>

    <button 
      onClick={onEmergency}
      className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
    >
      <div className="flex items-center gap-3 mb-2">
        <Bell size={24} className="text-red-600" />
        <h3 className="font-bold text-gray-800">Emergency Contacts</h3>
      </div>
      <p className="text-sm text-gray-600">Important emergency numbers for travelers</p>
    </button>

    <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center text-gray-500">
        <Plus size={32} className="mx-auto mb-2" />
        <div className="text-sm">More tools coming soon</div>
      </div>
    </div>
  </div>
</div>
);
}
// MODALS - Expense Modal (fixed percentage split)
function ExpenseModal({ members, currency, onSave, onClose }) {
const [description, setDescription] = useState('');
const [amount, setAmount] = useState('');
const [category, setCategory] = useState('Food');
const [paidBy, setPaidBy] = useState(1);
const [splitType, setSplitType] = useState('equal');
const [splitWith, setSplitWith] = useState([1]);
const [percentageSplits, setPercentageSplits] = useState(
members.map(m => ({ memberId: m.id, percentage: 0 }))
);
const handleSubmit = () => {
if (!description || !amount) return;
if (splitType === 'percentage') {
const activeSplits = percentageSplits.filter(s => s.percentage > 0);
const total = activeSplits.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0);
if (Math.abs(total - 100) > 0.01) {
alert('Percentages must add up to 100%');
return;
}
onSave({ description, amount: parseFloat(amount), category, paidBy, splitType: 'percentage', splitWith: activeSplits });
} else {
onSave({ description, amount: parseFloat(amount), category, paidBy, splitType: 'equal', splitWith });
}
};
const toggleMember = (id) => {
setSplitWith(splitWith.includes(id) ? splitWith.filter(m => m !== id) : [...splitWith, id]);
};
const updatePercentage = (memberId, value) => {
setPercentageSplits(percentageSplits.map(s =>
s.memberId === memberId ? { ...s, percentage: parseFloat(value) || 0 } : s
));
};
const totalPercentage = percentageSplits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold">Add Expense</h3>
<button onClick={onClose}><X size={24} /></button>
</div>
<div className="space-y-4">
<input
type="text"
value={description}
onChange={(e) => setDescription(e.target.value)}
placeholder="Description"
className="w-full px-3 py-2 border rounded-lg"
/>
<input
type="number"
value={amount}
onChange={(e) => setAmount(e.target.value)}
placeholder="Amount"
step="0.01"
className="w-full px-3 py-2 border rounded-lg"
/>
<select
value={category}
onChange={(e) => setCategory(e.target.value)}
className="w-full px-3 py-2 border rounded-lg"
>
<option value="Food">Food</option>
<option value="Transport">Transport</option>
<option value="Accommodation">Accommodation</option>
<option value="Activities">Activities</option>
<option value="Shopping">Shopping</option>
<option value="Other">Other</option>
</select>
<select
value={paidBy}
onChange={(e) => setPaidBy(parseInt(e.target.value))}
className="w-full px-3 py-2 border rounded-lg"
>
{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
</select>
<div className="flex gap-2">
<button
onClick={() => setSplitType('equal')}
className={`flex-1 py-2 rounded-lg ${splitType === 'equal' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
>
Equal
</button>
<button
onClick={() => setSplitType('percentage')}
className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 ${splitType === 'percentage' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
>
<Percent size={16} />Custom %
</button>
</div>
{splitType === 'equal' ? (
<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Split with</label>
{members.map(m => (
<label key={m.id} className="flex items-center gap-2 mb-2">
<input
type="checkbox"
checked={splitWith.includes(m.id)}
onChange={() => toggleMember(m.id)}
className="w-4 h-4"
/>
<span>{m.name}</span>
</label>
))}
</div>
) : (
<div>
<label className="block text-sm font-medium text-gray-700 mb-2">
Custom Split ({totalPercentage.toFixed(1)}% of 100%)
</label>
{members.map(m => (
<div key={m.id} className="flex items-center gap-2 mb-2">
<span className="text-sm w-24">{m.name}</span>
<input
type="number"
value={percentageSplits.find(s => s.memberId === m.id)?.percentage || 0}
onChange={(e) => updatePercentage(m.id, e.target.value)}
className="w-20 px-2 py-1 border rounded"
min="0"
max="100"
step="0.1"
/>
<span className="text-sm">%</span>
</div>
))}
{Math.abs(totalPercentage - 100) > 0.01 && (
<div className="text-sm text-red-600 mt-2">
Total must equal 100% (currently {totalPercentage.toFixed(1)}%)
</div>
)}
</div>
)}
<button 
         onClick={handleSubmit} 
         className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
       >
Add Expense
</button>
</div>
</div>
</div>
);
}
function MemberModal({ onSave, onClose }) {
const [name, setName] = useState('');
return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-lg max-w-sm w-full p-6">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold">Add Member</h3>
<button onClick={onClose}><X size={24} /></button>
</div>
<input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Member name" className="w-full px-3 py-2 border rounded-lg mb-4" autoFocus />
<button onClick={() => name && onSave(name)} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Add Member</button>
</div>
</div>
);
}
function LocationModal({ onSave, onClose }) {
const [name, setName] = useState('');
const [address, setAddress] = useState('');
const [category, setCategory] = useState('Restaurant');
const [notes, setNotes] = useState('');
return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-lg max-w-md w-full p-6">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold">Add Place</h3>
<button onClick={onClose}><X size={24} /></button>
</div>
<div className="space-y-4">
<input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Place name" className="w-full px-3 py-2 border rounded-lg" />
<input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full px-3 py-2 border rounded-lg" />
<select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
<option value="Restaurant">Restaurant</option>
<option value="Cafe">Cafe</option>
<option value="Attraction">Attraction</option>
<option value="Hotel">Hotel</option>
</select>
<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes or tips..." rows="3" className="w-full px-3 py-2 border rounded-lg" />
<button onClick={() => name && address && onSave({ name, address, category, notes })} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Add Place</button>
</div>
</div>
</div>
);
}
// ITINERARY MODAL WITH PLACE AUTOCOMPLETE
function ItineraryModal({ item, onSave, onClose }) {
const [activity, setActivity] = useState(item?.activity || '');
const [location, setLocation] = useState(item?.location || '');
const [date, setDate] = useState(item?.date?.split('T')[0] || '');
const [time, setTime] = useState(item?.time || '');
const [notes, setNotes] = useState(item?.notes || '');
const [booking, setBooking] = useState(item?.booking || '');
const [reminder, setReminder] = useState(item?.reminder || false);
const [reminderMinutes, setReminderMinutes] = useState(item?.reminderMinutes || 30);
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [searching, setSearching] = useState(false);
const [selectedPlace, setSelectedPlace] = useState(null);
const searchPlaces = async (query) => {
if (query.length < 3) {
setSearchResults([]);
return;
}
setSearching(true);
try {
  // Using FREE Nominatim API (OpenStreetMap)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
    {
      headers: {
        'User-Agent': 'TravelMate-App/1.0'
      }
    }
  );
  const data = await response.json();
  setSearchResults(data);
} catch (error) {
  console.error('Search error:', error);
  setSearchResults([]);
} finally {
  setSearching(false);
}
};
useEffect(() => {
const timer = setTimeout(() => {
if (searchQuery) {
searchPlaces(searchQuery);
}
}, 500);
return () => clearTimeout(timer);
}, [searchQuery]);
const selectPlace = (place) => {
setLocation(place.display_name);
setSelectedPlace({
latitude: parseFloat(place.lat),
longitude: parseFloat(place.lon),
address: place.display_name
});
setSearchQuery('');
setSearchResults([]);
};
return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold">{item ? 'Edit' : 'Add'} Activity</h3>
<button onClick={onClose}><X size={24} /></button>
</div>
<div className="space-y-4">
<input
type="text"
value={activity}
onChange={(e) => setActivity(e.target.value)}
placeholder="Activity (e.g., Visit Eiffel Tower)"
className="w-full px-3 py-2 border rounded-lg"
/>
      {/* Location Search with Autocomplete */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location <span className="text-xs text-gray-500">(search to find exact location)</span>
        </label>
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery || location} 
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) setLocation('');
            }} 
            placeholder="Search for location..." 
            className="w-full px-3 py-2 border rounded-lg pr-10" 
          />
          {searching && (
            <Loader className="absolute right-3 top-3 animate-spin text-gray-400" size={18} />
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((place, idx) => (
              <button
                key={idx}
                onClick={() => selectPlace(place)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-indigo-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {place.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {place.display_name}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedPlace && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            ✓ Location coordinates saved: {selectedPlace.latitude.toFixed(4)}, {selectedPlace.longitude.toFixed(4)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
      </div>
      <input type="text" value={booking} onChange={(e) => setBooking(e.target.value)} placeholder="Booking reference (optional)" className="w-full px-3 py-2 border rounded-lg" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." rows="3" className="w-full px-3 py-2 border rounded-lg" />
      
      <div className="border-t pt-4">
        <label className="flex items-center gap-2 mb-3">
          <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} className="w-4 h-4" />
          <Bell size={16} />
          <span className="text-sm font-medium">Set reminder</span>
        </label>
        {reminder && (
          <div className="ml-6">
            <label className="block text-sm text-gray-600 mb-1">Remind me before:</label>
            <select value={reminderMinutes} onChange={(e) => setReminderMinutes(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={1440}>1 day</option>
            </select>
          </div>
        )}
      </div>

      <button 
        onClick={() => activity && location && date && onSave(
          item 
            ? { ...item, activity, location, date, time, notes, booking, reminder, reminderMinutes, latitude: selectedPlace?.latitude, longitude: selectedPlace?.longitude }
            : { activity, location, date, time, notes, booking, reminder, reminderMinutes, latitude: selectedPlace?.latitude, longitude: selectedPlace?.longitude }
        )} 
        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
      >
        {item ? 'Update' : 'Add'} Activity
      </button>
    </div>
  </div>
</div>
);
}
// DOCUMENT MODAL
function DocumentModal({ onSave, onClose }) {
const [name, setName] = useState('');
const [type, setType] = useState('Passport');
const [number, setNumber] = useState('');
const [expiryDate, setExpiryDate] = useState('');
const [notes, setNotes] = useState('');
return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-lg max-w-md w-full p-6">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold">Add Document</h3>
<button onClick={onClose}><X size={24} /></button>
</div>
<div className="space-y-4">
<input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name (e.g., My Passport)" className="w-full px-3 py-2 border rounded-lg" />
<select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
<option value="Passport">Passport</option>
<option value="Visa">Visa</option>
<option value="Travel Insurance">Travel Insurance</option>
<option value="Flight Ticket">Flight Ticket</option>
<option value="Hotel Booking">Hotel Booking</option>
<option value="ID Card">ID Card</option>
<option value="Vaccination">Vaccination Certificate</option>
<option value="Other">Other</option>
</select>
<input type="text" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Document/Reference number" className="w-full px-3 py-2 border rounded-lg" />
<input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} placeholder="Expiry date (if applicable)" className="w-full px-3 py-2 border rounded-lg" />
<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows="3" className="w-full px-3 py-2 border rounded-lg" />
<button onClick={() => name && onSave({ name, type, number, expiryDate, notes })} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Add Document</button>
</div>
</div>
</div>
);
}
// CURRENCY CONVERTER MODAL
function CurrencyConverterModal({ onClose }) {
const [amount, setAmount] = useState('100');
const [from, setFrom] = useState('USD');
const [to, setTo] = useState('EUR');
const [result, setResult] = useState(null);
const [loading, setLoading] = useState(false);
const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'MXN'];
const convert = async () => {
setLoading(true);
try {
// FREE API: exchangerate-api.com
const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
const data = await response.json();
const rate = data.rates[to];
setResult((parseFloat(amount) * rate).toFixed(2));
} catch (error) {
alert('Conversion failed. Please try again.');
} finally {
setLoading(false);
}
};
useEffect(() => {
if (amount && from && to) {
convert();
}
}, [amount, from, to]);
return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-lg max-w-md w-full p-6">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold">Currency Converter</h3>
<button onClick={onClose}><X size={24} /></button>
</div>
<div className="space-y-4">
<div>
<label className="block text-sm font-medium mb-1">Amount</label>
<div className="flex gap-2">
<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
<select value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border rounded-lg">
{currencies.map(c => <option key={c} value={c}>{c}</option>)}
</select>
</div>
</div>
<div>
<label className="block text-sm font-medium mb-1">Converted Amount</label>
<div className="flex gap-2">
<input type="text" value={result || '...'} readOnly className="flex-1 px-3 py-2 border rounded-lg bg-gray-50" />
<select value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border rounded-lg">
{currencies.map(c => <option key={c} value={c}>{c}</option>)}
</select>
</div>
</div>
{loading && <div className="text-center text-gray-500">Loading...</div>}
</div>
</div>
</div>
);
}
// LANGUAGE PHRASES MODAL
function LanguagePhrasesModal({ onClose }) {
const [language, setLanguage] = useState('es');
const phrases = {
es: [
{ en: 'Hello', tr: 'Hola', pr: 'OH-lah' },
{ en: 'Thank you', tr: 'Gracias', pr: 'GRAH-see-ahs' },
{ en: 'How much?', tr: '¿Cuánto cuesta?', pr: 'KWAN-toh KWES-tah' },
{ en: 'Where is...?', tr: '¿Dónde está...?', pr: 'DOHN-day es-TAH' },
{ en: 'Help!', tr: '¡Ayuda!', pr: 'ah-YOO-dah' },
{ en: 'Water', tr: 'Agua', pr: 'AH-gwah' },
{ en: 'Food', tr: 'Comida', pr: 'koh-MEE-dah' },
{ en: 'Bathroom', tr: 'Baño', pr: 'BAH-nyoh' }
],
fr: [
{ en: 'Hello', tr: 'Bonjour', pr: 'bon-ZHOOR' },
{ en: 'Thank you', tr: 'Merci', pr: 'mehr-SEE' },
{ en: 'How much?', tr: 'Combien?', pr: 'kom-bee-EN' },
{ en: 'Where is...?', tr: 'Où est...?', pr: 'oo-EH' },
{ en: 'Help!', tr: 'Au secours!', pr: 'oh-suh-KOOR' },
{ en: 'Water', tr: 'Eau', pr: 'OH' },
{ en: 'Food', tr: 'Nourriture', pr: 'noo-ree-TOOR' },
{ en: 'Bathroom', tr: 'Toilettes', pr: 'twah-LET' }
],
hi: [
{ en: 'Hello', tr: 'नमस्ते', pr: 'na-mas-tay' },
{ en: 'Thank you', tr: 'धन्यवाद', pr: 'dhan-ya-vaad' },
{ en: 'How much?', tr: 'कितना?', pr: 'kit-naa' },
{ en: 'Where is...?', tr: 'कहाँ है...?', pr: 'ka-haan hai' },
{ en: 'Help!', tr: 'मदद!', pr: 'ma-dad' },
{ en: 'Water', tr: 'पानी', pr: 'paa-nee' },
{ en: 'Food', tr: 'खाना', pr: 'khaa-naa' },
{ en: 'Continue2:35 PMBathroom', tr: 'शौचालय', pr: 'shau-cha-lay' }
]
};
return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold">Language Phrases</h3>
<button onClick={onClose}><X size={24} /></button>
</div>
<select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-4">
<option value="es">🇪🇸 Spanish</option>
<option value="fr">🇫🇷 French</option>
<option value="hi">🇮🇳 Hindi</option>
</select>
<div className="space-y-3">
{phrases[language].map((p, i) => (
<div key={i} className="bg-gray-50 p-3 rounded-lg">
<div className="text-sm text-gray-600">{p.en}</div>
<div className="text-lg font-semibold text-gray-800">{p.tr}</div>
<div className="text-xs text-gray-500 italic">{p.pr}</div>
</div>
))}
</div>
</div>
</div>
);
}
// EMERGENCY MODAL
function EmergencyModal({ onClose }) {
const contacts = [
{ name: 'Police (India)', phone: '100', type: 'Emergency' },
{ name: 'Ambulance (India)', phone: '102', type: 'Medical' },
{ name: 'Fire (India)', phone: '101', type: 'Emergency' },
{ name: 'Women Helpline', phone: '1091', type: 'Support' },
{ name: 'Tourist Helpline', phone: '1363', type: 'Tourism' }
];
return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-lg max-w-md w-full p-6">
<div className="flex justify-between items-center mb-4">
<h3 className="text-xl font-bold text-red-600">Emergency Contacts</h3>
<button onClick={onClose}><X size={24} /></button>
</div>
<div className="space-y-3">
{contacts.map((c, i) => (
<div key={i} className="bg-red-50 p-4 rounded-lg border border-red-200">
<div className="flex justify-between items-center">
<div>
<div className="font-semibold text-gray-800">{c.name}</div>
<div className="text-xs text-gray-600">{c.type}</div>
</div>
<a href={`tel:${c.phone}`} className="text-2xl font-bold text-red-600 hover:text-red-800">
{c.phone}
</a>
</div>
</div>
))}
</div>
</div>
</div>
);
}
export default App;

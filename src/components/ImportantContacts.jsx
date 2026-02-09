import React, { useState, useEffect } from 'react';
import { Plus, X, Phone, Trash2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const CONTACT_TYPES = ['Emergency', 'Hospital', 'Police', 'Embassy', 'Taxi / Cab', 'Hotel', 'Personal', 'Other'];

export default function ImportantContacts({ group, currentUser }) {
  const [contacts,   setContacts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);

  const blankForm = { name: '', type: 'Emergency', phone: '', address: '', notes: '' };
  const [form, setForm] = useState(blankForm);

  //useEffect(() => { fetchContacts(); }, [group.id]);
  useEffect(() => { 
    if (group?.id) {
      fetchContacts(); 
    }
  }, [group?.id]);

  const fetchContacts = async () => {
    try {
       if (!group?.id) return;
      /* EmergencyContact model – use groupId query param */
      const { data } = await api.get(`/contacts?groupId=${group.id}`);
      setContacts(data);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contacts', { ...form, groupId: group.id });
      await fetchContacts();
      setShowModal(false);
      setForm(blankForm);
    } catch (err) { alert(err.response?.data?.error || 'Failed to add contact'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading contacts…</div>;

  const typeColor = (t) => {
    if (t === 'Emergency') return 'bg-red-100 text-red-700';
    if (t === 'Hospital')  return 'bg-pink-100 text-pink-700';
    if (t === 'Police')    return 'bg-blue-100 text-blue-700';
    if (t === 'Embassy')   return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent';

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Important Contacts</h3>
        <button onClick={() => { setForm(blankForm); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
          <Plus size={16}/> Add Contact
        </button>
      </div>

      {/* emergency reminder */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0"/>
        <p className="text-xs text-red-700">In an emergency, always call the local number (112 in EU / 911 in US / 100 in India).</p>
      </div>

      {/* contact cards */}
      {contacts.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <Phone size={40} className="mx-auto text-gray-300 mb-2"/>
          <p className="text-gray-500 text-sm">No contacts yet. Add important numbers for your trip!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contacts.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-indigo-500"/>
                  <h4 className="font-semibold text-gray-800">{c.name}</h4>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={16}/>
                </button>
              </div>

              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor(c.type)}`}>{c.type}</span>

              {c.phone && (
                <a href={`tel:${c.phone}`} className="block text-sm text-indigo-600 font-semibold hover:underline mt-2">{c.phone}</a>
              )}
              {c.address && <p className="text-xs text-gray-500 mt-1">{c.address}</p>}
              {c.notes   && <p className="text-xs text-gray-500 mt-1 italic">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── add contact modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add Contact</h3>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  placeholder="e.g. Local Police" className={inp}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} className={inp}>
                    {CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone *</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                    placeholder="+1 234 567 8900" className={inp}/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                <input type="text" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))}
                  placeholder="Street address…" className={inp}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea value={form.notes} rows={2} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                  placeholder="Any extra info…" className={inp}/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700">Add Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
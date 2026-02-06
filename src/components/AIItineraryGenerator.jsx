import React, { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import api from '../services/api';

export default function AIItineraryGenerator({ group }) {
  const [destination, setDestination] = useState('');
  const [days,        setDays]        = useState(3);
  const [interests,   setInterests]   = useState('');
  const [budget,      setBudget]      = useState('');
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent';

  const handleGenerate = async () => {
    if (!destination.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post('/itinerary-generator/generate', {
        groupId: group.id,
        destination,
        days: parseInt(days),
        interests,
        budget
      });
      setResult(data);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Generation failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Destination *</label>
          <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
            placeholder="e.g. Paris, France" className={inp}/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Days</label>
            <input type="number" min="1" max="30" value={days} onChange={e => setDays(e.target.value)} className={inp}/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget (per person, $)</label>
            <input type="number" min="0" step="50" value={budget} onChange={e => setBudget(e.target.value)}
              placeholder="e.g. 1500" className={inp}/>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Interests / Preferences</label>
          <textarea value={interests} rows={2} onChange={e => setInterests(e.target.value)}
            placeholder="e.g. History, street food, nightlife, museums…" className={inp}/>
        </div>

        <button onClick={handleGenerate} disabled={loading || !destination.trim()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50">
          {loading ? <><Loader size={18} className="animate-spin"/> Generating…</> : <><Sparkles size={18}/> Generate Itinerary</>}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

      {/* result */}
      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h4 className="font-bold text-gray-800 mb-3">📋 Generated Itinerary</h4>
          <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { X, MapPin, ThumbsUp, ThumbsDown, AlertCircle, Clock, Shield, Lightbulb } from 'lucide-react';
import api from '../services/api';

/* ════════════════════════════════════════════
   TIPS MODAL  –  opened per itinerary activity
   ════════════════════════════════════════════ */
export default function TipsModal({ itineraryItem, onClose }) {
  const [tips,        setTips]        = useState([]);
  const [avgRatings,  setAvgRatings]  = useState(null);
  const [showAddTip,  setShowAddTip]  = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { loadTips(); }, [itineraryItem.id]);

  const loadTips = async () => {
    try {
      const { data } = await api.get(`/tips/${itineraryItem.id}`);
      setTips(data.tips || []);
      setAvgRatings(data.avgRatings || null);
    } catch (e) { console.error('Load tips error:', e); }
    finally     { setLoading(false); }
  };

  const voteTip = async (tipId, vote) => {
    try {
      await api.post(`/tips/${tipId}/vote`, { vote });
      loadTips();
    } catch (e) { console.error('Vote error:', e); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* ── sticky header ── */}
        <div className="sticky top-0 bg-white border-b p-5 z-10 rounded-t-xl">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb size={20} className="text-amber-500"/>
                <h2 className="text-xl font-bold text-gray-800">{itineraryItem.activity}</h2>
              </div>
              {itineraryItem.location && (
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <MapPin size={14}/> {itineraryItem.location}
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={22}/>
            </button>
          </div>

          {/* average rating cards */}
          {avgRatings && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <RatingBadge label="Crowd" value={avgRatings.overcrowd} color="blue"/>
              <RatingBadge label="Cleanliness" value={avgRatings.cleanliness} color="green"/>
              <RatingBadge label="Scam Risk" value={avgRatings.scam} color="red"/>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
            <span className="flex items-center gap-1"><Shield size={13}/> {avgRatings?.verifiedCount || 0} verified on-site</span>
            <span>•</span>
            <span>{tips.length} tip{tips.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ── body ── */}
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-700">Community Tips</h3>
            <button onClick={() => setShowAddTip(true)}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700">
              + Add Tip
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading tips…</div>
          ) : tips.length > 0 ? (
            <div className="space-y-3">
              {tips.map(tip => <TipCard key={tip.id} tip={tip} onVote={voteTip}/>)}
            </div>
          ) : (
            <div className="text-center py-10">
              <AlertCircle size={40} className="mx-auto text-gray-300 mb-3"/>
              <p className="text-gray-500 text-sm">No tips yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── add-tip sub-modal ── */}
      {showAddTip && (
        <AddTipForm
          itineraryItem={itineraryItem}
          onClose={() => setShowAddTip(false)}
          onSuccess={() => { setShowAddTip(false); loadTips(); }}
        />
      )}
    </div>
  );
}

/* ── single tip card ── */
function TipCard({ tip, onVote }) {
  return (
    <div className={`border rounded-lg p-4 ${tip.verifiedAtLocation ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      {tip.verifiedAtLocation && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold mb-2">
          <Shield size={13}/> Verified On-Site
        </div>
      )}

      {/* rating grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {tip.overcrowdRating   && <MiniRating label="Crowd"  value={tip.overcrowdRating}   color="orange"/>}
        {tip.cleanlinessRating && <MiniRating label="Clean"  value={tip.cleanlinessRating} color="green"/>}
        {tip.scamRating        && <MiniRating label="Scam"   value={tip.scamRating}        color="red"/>}
      </div>

      {/* tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tip.bestTimeToVisit && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Best time: {tip.bestTimeToVisit}</span>
        )}
        {tip.advanceBookingDays && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1">
            <Clock size={11}/> Book {tip.advanceBookingDays}d ahead
          </span>
        )}
      </div>

      {tip.overcrowdTiming && (
        <p className="text-xs text-gray-600 mb-1.5">⏰ {tip.overcrowdTiming}</p>
      )}

      {tip.generalComment && (
        <p className="text-sm text-gray-700 mb-2">{tip.generalComment}</p>
      )}

      {/* footer: author + votes */}
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-200">
        <span className="text-xs text-gray-400">
          by {tip.User?.name || 'Anonymous'} • {new Date(tip.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => onVote(tip.id, 'up')} className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors">
            <ThumbsUp size={15}/><span className="text-xs">{tip.upvotes}</span>
          </button>
          <button onClick={() => onVote(tip.id, 'down')} className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
            <ThumbsDown size={15}/><span className="text-xs">{tip.downvotes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── add-tip form (sub-modal) ── */
function AddTipForm({ itineraryItem, onClose, onSuccess }) {
  const [form, setForm] = useState({
    overcrowdRating   : '',
    overcrowdTiming   : '',
    cleanlinessRating : '',
    scamRating        : '',
    bestTimeToVisit   : '',
    advanceBookingDays: '',
    generalComment    : ''
  });
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  /* try to grab user's GPS on mount */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        () => {}   // silently ignore if denied
      );
    }
  }, []);

  const verifyLocation = () => {
    setVerifying(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setVerified(true);
          setVerifying(false);
        },
        () => {
          alert('Could not access location. Tip will be unverified.');
          setVerifying(false);
        }
      );
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/tips', {
        itineraryId       : itineraryItem.id,
        overcrowdRating   : form.overcrowdRating   || null,
        overcrowdTiming   : form.overcrowdTiming    || null,
        cleanlinessRating : form.cleanlinessRating  || null,
        scamRating        : form.scamRating         || null,
        bestTimeToVisit   : form.bestTimeToVisit    || null,
        advanceBookingDays: form.advanceBookingDays ? parseInt(form.advanceBookingDays) : null,
        generalComment    : form.generalComment     || null,
        currentLatitude   : verified && userCoords ? userCoords.lat  : null,
        currentLongitude  : verified && userCoords ? userCoords.lng  : null,
        targetLatitude    : itineraryItem.latitude,
        targetLongitude   : itineraryItem.longitude
      });
      onSuccess();
    } catch (e) {
      console.error(e);
      alert('Failed to add tip');
    } finally { setLoading(false); }
  };

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Add Your Tip</h3>
          <button onClick={onClose}><X size={22} className="text-gray-400 hover:text-gray-600"/></button>
        </div>

        <div className="space-y-4">
          {/* verification banner */}
          {!verified && (
            <button onClick={verifyLocation} disabled={verifying}
              className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-60">
              <Shield size={16}/> {verifying ? 'Verifying…' : 'Verify I\'m Here (Optional)'}
            </button>
          )}
          {verified && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-green-800">
              ✓ Location verified! Your tip will be marked as on-site.
            </div>
          )}

          {/* crowd */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Crowd Level (1–10)</label>
            <input type="number" min="1" max="10" value={form.overcrowdRating}
              onChange={e => setForm(p => ({...p, overcrowdRating: e.target.value}))}
              placeholder="e.g. 7" className={inp}/>
          </div>

          {/* crowd timing */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Crowd Timing</label>
            <input type="text" value={form.overcrowdTiming}
              onChange={e => setForm(p => ({...p, overcrowdTiming: e.target.value}))}
              placeholder="e.g. Morning: Low, Evening: High" className={inp}/>
          </div>

          {/* cleanliness */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cleanliness (1–10)</label>
            <input type="number" min="1" max="10" value={form.cleanlinessRating}
              onChange={e => setForm(p => ({...p, cleanlinessRating: e.target.value}))}
              placeholder="e.g. 8" className={inp}/>
          </div>

          {/* scam */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Scam Risk (1–10)</label>
            <input type="number" min="1" max="10" value={form.scamRating}
              onChange={e => setForm(p => ({...p, scamRating: e.target.value}))}
              placeholder="e.g. 3" className={inp}/>
          </div>

          {/* best time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Best Time to Visit</label>
            <input type="text" value={form.bestTimeToVisit}
              onChange={e => setForm(p => ({...p, bestTimeToVisit: e.target.value}))}
              placeholder="e.g. October–March" className={inp}/>
          </div>

          {/* advance booking */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Advance Booking (days)</label>
            <input type="number" value={form.advanceBookingDays}
              onChange={e => setForm(p => ({...p, advanceBookingDays: e.target.value}))}
              placeholder="e.g. 30" className={inp}/>
          </div>

          {/* general comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">General Tips & Advice</label>
            <textarea value={form.generalComment} rows={3}
              onChange={e => setForm(p => ({...p, generalComment: e.target.value}))}
              placeholder="Share what to avoid, hidden gems, best practices…"
              className={inp}/>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Saving…' : 'Submit Tip'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── small reusables ── */
function RatingBadge({ label, value, color }) {
  const bg = { blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50' };
  const tc = { blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600' };
  return (
    <div className={`${bg[color]} p-2.5 rounded-lg text-center`}>
      <div className={`text-xs ${tc[color]} mb-0.5`}>{label}</div>
      <div className={`text-xl font-bold ${tc[color]}`}>{value || 'N/A'}<span className="text-xs font-normal opacity-60">/10</span></div>
    </div>
  );
}

function MiniRating({ label, value, color }) {
  const tc = { orange: 'text-orange-600', green: 'text-green-600', red: 'text-red-600' };
  return (
    <div className="text-center p-1.5 bg-white rounded border border-gray-100">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-sm font-bold ${tc[color]}`}>{value}/10</div>
    </div>
  );
}
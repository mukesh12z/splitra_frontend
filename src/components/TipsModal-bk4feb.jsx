import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, ThumbsUp, ThumbsDown, AlertCircle, Clock, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function TipsModal({ itineraryItem, onClose }) {
  const [tips, setTips] = useState([]);
  const [avgRatings, setAvgRatings] = useState(null);
  const [showAddTip, setShowAddTip] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTips();
  }, [itineraryItem.id]);

  const loadTips = async () => {
    try {
      const response = await axios.get(`${API_URL}/tips/${itineraryItem.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTips(response.data.tips);
      setAvgRatings(response.data.avgRatings);
    } catch (error) {
      console.error('Load tips error:', error);
    } finally {
      setLoading(false);
    }
  };

  const voteTip = async (tipId, vote) => {
    try {
      await axios.post(`${API_URL}/tips/${tipId}/vote`, 
        { vote },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      loadTips();
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{itineraryItem.activity}</h2>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <MapPin size={16} />
                <span className="text-sm">{itineraryItem.location}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          {avgRatings && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 mb-1">Crowd Level</div>
                <div className="text-2xl font-bold text-blue-900">
                  {avgRatings.overcrowd || 'N/A'}/10
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 mb-1">Cleanliness</div>
                <div className="text-2xl font-bold text-green-900">
                  {avgRatings.cleanliness || 'N/A'}/10
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-xs text-red-600 mb-1">Scam Risk</div>
                <div className="text-2xl font-bold text-red-900">
                  {avgRatings.scam || 'N/A'}/10
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
            <div className="flex items-center gap-1">
              <Shield size={14} />
              {avgRatings?.verifiedCount || 0} verified on-site
            </div>
            <div>•</div>
            <div>{tips.length} total tips</div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Community Tips</h3>
            <button
              onClick={() => setShowAddTip(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
            >
              Add Tip
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading tips...</div>
          ) : tips.length > 0 ? (
            <div className="space-y-4">
              {tips.map(tip => (
                <TipCard key={tip.id} tip={tip} onVote={voteTip} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No tips yet. Be the first to share!</p>
            </div>
          )}
        </div>

        {showAddTip && (
          <AddTipForm 
            itineraryItem={itineraryItem}
            onClose={() => setShowAddTip(false)}
            onSuccess={() => {
              setShowAddTip(false);
              loadTips();
            }}
          />
        )}
      </div>
    </div>
  );
}

function TipCard({ tip, onVote }) {
  return (
    <div className={`border rounded-lg p-4 ${tip.verifiedAtLocation ? 'border-green-300 bg-green-50' : 'bg-gray-50'}`}>
      {tip.verifiedAtLocation && (
        <div className="flex items-center gap-2 text-xs text-green-700 mb-2">
          <Shield size={14} />
          <span className="font-semibold">Verified On-Site</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        {tip.overcrowdRating && (
          <div className="text-sm">
            <span className="text-gray-600">Crowd:</span>
            <span className="font-semibold ml-1">{tip.overcrowdRating}/10</span>
          </div>
        )}
        {tip.cleanlinessRating && (
          <div className="text-sm">
            <span className="text-gray-600">Clean:</span>
            <span className="font-semibold ml-1">{tip.cleanlinessRating}/10</span>
          </div>
        )}
        {tip.scamRating && (
          <div className="text-sm">
            <span className="text-gray-600">Scam:</span>
            <span className="font-semibold ml-1">{tip.scamRating}/10</span>
          </div>
        )}
      </div>

      {tip.overcrowdTiming && (
        <div className="text-sm mb-2">
          <Clock size={14} className="inline mr-1" />
          <span className="text-gray-700">{tip.overcrowdTiming}</span>
        </div>
      )}

      {tip.bestTimeToVisit && (
        <div className="text-sm mb-2 text-blue-700 bg-blue-100 px-2 py-1 rounded inline-block">
          Best time: {tip.bestTimeToVisit}
        </div>
      )}

      {tip.advanceBookingDays && (
        <div className="text-sm mb-2 text-orange-700 bg-orange-100 px-2 py-1 rounded inline-block ml-2">
          Book {tip.advanceBookingDays} days ahead
        </div>
      )}

      {tip.generalComment && (
        <p className="text-gray-700 mt-3 mb-3">{tip.generalComment}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="text-xs text-gray-500">
          by {tip.User?.name || 'Anonymous'} • {new Date(tip.createdAt).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onVote(tip.id, 'up')}
            className="flex items-center gap-1 text-gray-600 hover:text-green-600"
          >
            <ThumbsUp size={16} />
            <span className="text-sm">{tip.upvotes}</span>
          </button>
          <button
            onClick={() => onVote(tip.id, 'down')}
            className="flex items-center gap-1 text-gray-600 hover:text-red-600"
          >
            <ThumbsDown size={16} />
            <span className="text-sm">{tip.downvotes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTipForm({ itineraryItem, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    overcrowdRating: '',
    overcrowdTiming: '',
    cleanlinessRating: '',
    scamRating: '',
    bestTimeToVisit: '',
    advanceBookingDays: '',
    generalComment: ''
  });
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const verifyLocation = () => {
    setVerifying(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVerified(true);
          setVerifying(false);
        },
        (error) => {
          alert('Could not verify location. Tip will be marked as unverified.');
          setVerifying(false);
        }
      );
    }
  };

  const handleSubmit = async () => {
    try {
      let currentLat, currentLng;
      
      if (verified && navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
      }

      await axios.post(`${API_URL}/tips`, {
        itineraryId: itineraryItem.id,
        ...formData,
        currentLatitude: currentLat,
        currentLongitude: currentLng,
        targetLatitude: itineraryItem.latitude,
        targetLongitude: itineraryItem.longitude
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      onSuccess();
    } catch (error) {
      console.error('Add tip error:', error);
      alert('Failed to add tip');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add Your Tip</h3>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        <div className="space-y-4">
          {!verified && (
            <button
              onClick={verifyLocation}
              disabled={verifying}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Shield size={18} />
              {verifying ? 'Verifying...' : 'Verify I\'m Here (Optional)'}
            </button>
          )}

          {verified && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-green-800">
              ✓ Location verified! Your tip will be marked as on-site.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Crowd Level (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.overcrowdRating}
              onChange={(e) => setFormData({...formData, overcrowdRating: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Crowd Timing</label>
            <input
              type="text"
              value={formData.overcrowdTiming}
              onChange={(e) => setFormData({...formData, overcrowdTiming: e.target.value})}
              placeholder="e.g., Morning: Low, Evening: High"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cleanliness (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.cleanlinessRating}
              onChange={(e) => setFormData({...formData, cleanlinessRating: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scam Risk (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.scamRating}
              onChange={(e) => setFormData({...formData, scamRating: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Best Time to Visit</label>
            <input
              type="text"
              value={formData.bestTimeToVisit}
              onChange={(e) => setFormData({...formData, bestTimeToVisit: e.target.value})}
              placeholder="e.g., October-March"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Advance Booking (days)</label>
            <input
              type="number"
              value={formData.advanceBookingDays}
              onChange={(e) => setFormData({...formData, advanceBookingDays: e.target.value})}
              placeholder="e.g., 30"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">General Comments</label>
            <textarea
              value={formData.generalComment}
              onChange={(e) => setFormData({...formData, generalComment: e.target.value})}
              rows="4"
              placeholder="Share your experience, tips, warnings..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
          >
            Submit Tip
          </button>
        </div>
      </div>
    </div>
  );
}

export default TipsModal;
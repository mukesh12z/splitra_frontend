import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MapPin, Calendar, AlertCircle, TrendingUp, Users, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function TipsPanel({ itineraryItem, onClose }) {
  const [tips, setTips] = useState([]);
  const [avgRatings, setAvgRatings] = useState(null);
  const [showAddTip, setShowAddTip] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadTips();
    getUserLocation();
  }, [itineraryItem]);

  const loadTips = async () => {
    try {
      const response = await axios.get(`${API_URL}/tips/${itineraryItem.id}`);
      setTips(response.data.tips);
      setAvgRatings(response.data.avgRatings);
    } catch (error) {
      console.error('Failed to load tips:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log('Location access denied')
      );
    }
  };

  const voteTip = async (tipId, vote) => {
    try {
      await axios.post(`${API_URL}/tips/${tipId}/vote`, { vote });
      loadTips();
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{itineraryItem.activity}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} />
              {itineraryItem.location}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Average Ratings Summary */}
          {avgRatings && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-4">Community Ratings</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-orange-600" />
                    <span className="text-sm text-gray-600">Crowd Level</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {avgRatings.overcrowd || 'N/A'}/10
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={16} className="text-green-600" />
                    <span className="text-sm text-gray-600">Cleanliness</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {avgRatings.cleanliness || 'N/A'}/10
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-red-600" />
                    <span className="text-sm text-gray-600">Scam Risk</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {avgRatings.scam || 'N/A'}/10
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Based on {avgRatings.totalCount} tips ({avgRatings.verifiedCount} verified on-location)
              </div>
            </div>
          )}

          {/* Add Tip Button */}
          <button
            onClick={() => setShowAddTip(true)}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <TrendingUp size={20} />
            Add Your Tip
          </button>

          {/* Tips List */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Community Tips</h3>
            {tips.map(tip => (
              <div key={tip.id} className={`p-4 rounded-lg border-2 ${
                tip.verifiedAtLocation 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      {tip.User?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{tip.User?.name || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(tip.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {tip.verifiedAtLocation && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <MapPin size={12} />
                      Verified
                    </span>
                  )}
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {tip.overcrowdRating && (
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-600">Crowd</div>
                      <div className="font-bold text-orange-600">{tip.overcrowdRating}/10</div>
                    </div>
                  )}
                  {tip.cleanlinessRating && (
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-600">Clean</div>
                      <div className="font-bold text-green-600">{tip.cleanlinessRating}/10</div>
                    </div>
                  )}
                  {tip.scamRating && (
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-600">Scam Risk</div>
                      <div className="font-bold text-red-600">{tip.scamRating}/10</div>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {tip.overcrowdTiming && (
                  <div className="mb-2 p-2 bg-white rounded">
                    <div className="text-xs text-gray-600 mb-1">Crowd Timing:</div>
                    <div className="text-sm text-gray-800">{tip.overcrowdTiming}</div>
                  </div>
                )}

                {tip.bestTimeToVisit && (
                  <div className="mb-2 p-2 bg-white rounded flex items-center gap-2">
                    <Calendar size={14} className="text-blue-600" />
                    <div className="text-sm">
                      <span className="text-gray-600">Best time:</span>{' '}
                      <span className="font-medium text-gray-800">{tip.bestTimeToVisit}</span>
                    </div>
                  </div>
                )}

                {tip.advanceBookingDays && (
                  <div className="mb-2 p-2 bg-yellow-50 rounded flex items-center gap-2">
                    <Clock size={14} className="text-yellow-600" />
                    <div className="text-sm">
                      <span className="font-medium text-yellow-900">
                        Book {tip.advanceBookingDays} days in advance
                      </span>
                    </div>
                  </div>
                )}

                {/* General Comment */}
                {tip.generalComment && (
                  <div className="mb-3 p-3 bg-white rounded">
                    <div className="text-sm text-gray-800">{tip.generalComment}</div>
                  </div>
                )}

                {/* Voting */}
                <div className="flex items-center gap-4 pt-3 border-t">
                  <button
                    onClick={() => voteTip(tip.id, 'up')}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700"
                  >
                    <ThumbsUp size={16} />
                    <span className="text-sm font-medium">{tip.upvotes}</span>
                  </button>
                  <button
                    onClick={() => voteTip(tip.id, 'down')}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <ThumbsDown size={16} />
                    <span className="text-sm font-medium">{tip.downvotes}</span>
                  </button>
                  <div className="ml-auto text-xs text-gray-500">
                    Helpful score: {tip.upvotes - tip.downvotes}
                  </div>
                </div>
              </div>
            ))}

            {tips.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No tips yet. Be the first to share!</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Tip Modal */}
        {showAddTip && (
          <AddTipModal
            itineraryItem={itineraryItem}
            userLocation={userLocation}
            onSave={() => {
              setShowAddTip(false);
              loadTips();
            }}
            onClose={() => setShowAddTip(false)}
          />
        )}
      </div>
    </div>
  );
}

function AddTipModal({ itineraryItem, userLocation, onSave, onClose }) {
  const [overcrowdRating, setOvercrowdRating] = useState(5);
  const [overcrowdTiming, setOvercrowdTiming] = useState('');
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [scamRating, setScamRating] = useState(1);
  const [bestTimeToVisit, setBestTimeToVisit] = useState('');
  const [advanceBookingDays, setAdvanceBookingDays] = useState('');
  const [generalComment, setGeneralComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/tips`, {
        itineraryId: itineraryItem.id,
        overcrowdRating,
        overcrowdTiming,
        cleanlinessRating,
        scamRating,
        bestTimeToVisit,
        advanceBookingDays: advanceBookingDays ? parseInt(advanceBookingDays) : null,
        generalComment,
        currentLatitude: userLocation?.latitude,
        currentLongitude: userLocation?.longitude,
        targetLatitude: itineraryItem.latitude,
        targetLongitude: itineraryItem.longitude
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      onSave();
    } catch (error) {
      alert('Failed to add tip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Share Your Experience</h3>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        <div className="space-y-4">
          {/* Crowd Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How crowded was it? (1=Empty, 10=Very Crowded)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={overcrowdRating}
              onChange={(e) => setOvercrowdRating(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl font-bold text-orange-600">{overcrowdRating}/10</div>
          </div>

          {/* Crowd Timing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              When is it most crowded? (optional)
            </label>
            <input
              type="text"
              value={overcrowdTiming}
              onChange={(e) => setOvercrowdTiming(e.target.value)}
              placeholder="e.g., Weekends 10am-2pm, Evenings after 5pm"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Cleanliness Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cleanliness (1=Dirty, 10=Spotless)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={cleanlinessRating}
              onChange={(e) => setCleanlinessRating(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl font-bold text-green-600">{cleanlinessRating}/10</div>
          </div>

          {/* Scam Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scam/Tourist Trap Risk (1=Safe, 10=High Risk)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={scamRating}
              onChange={(e) => setScamRating(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl font-bold text-red-600">{scamRating}/10</div>
          </div>

          {/* Best Time to Visit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Best time to visit (optional)
            </label>
            <input
              type="text"
              value={bestTimeToVisit}
              onChange={(e) => setBestTimeToVisit(e.target.value)}
              placeholder="e.g., October-March, Early morning"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Advance Booking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How many days in advance to book? (optional)
            </label>
            <input
              type="number"
              value={advanceBookingDays}
              onChange={(e) => setAdvanceBookingDays(e.target.value)}
              placeholder="e.g., 7, 30, 60"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* General Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              General tips & advice
            </label>
            <textarea
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              placeholder="Share what to avoid, best practices, hidden gems..."
              rows="4"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Location Verification Status */}
          {userLocation && itineraryItem.latitude && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="text-sm text-blue-900">
                {calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  itineraryItem.latitude,
                  itineraryItem.longitude
                ) <= 1 ? (
                  <>
                    <MapPin size={16} className="inline mr-1" />
                    <strong>Verified!</strong> You're at this location. Your tip will be marked as verified.
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="inline mr-1" />
                    You're not at this location. Tip will be marked as unverified.
                  </>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Submit Tip'}
          </button>
        </div>
      </div>
    </div>
  );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default TipsPanel;
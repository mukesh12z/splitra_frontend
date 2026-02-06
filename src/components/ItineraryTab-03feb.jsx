import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, Clock, MapPin } from 'lucide-react';
import api from '../services/api';

function ItineraryTab({ group, currentUser }) {
  const [itineraryItems, setItineraryItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [itemForm, setItemForm] = useState({
    date: '',
    time: '',
    activity: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchItinerary();
  }, [group.id]);

  const fetchItinerary = async () => {
    try {
      const response = await api.get(`/itinerary/group/${group.id}`);
      setItineraryItems(response.data);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/itinerary', { ...itemForm, groupId: group.id });

      fetchItinerary();
      setShowAddModal(false);
      setItemForm({ date: '', time: '', activity: '', location: '', description: '' });
    } catch (error) {
      console.error('Error adding itinerary item:', error);
      alert('Failed to add itinerary item');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading itinerary...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Trip Itinerary</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} />
          Add Activity
        </button>
      </div>

      {/* Itinerary Items */}
      {itineraryItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No activities planned yet. Add your first activity!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {itineraryItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-center">
                  <div className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg">
                    <div className="text-xs font-semibold">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold">
                      {new Date(item.date).getDate()}
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-lg mb-1">{item.activity}</h4>
                  
                  {item.time && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock size={16} />
                      {item.time}
                    </div>
                  )}
                  
                  {item.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin size={16} />
                      {item.location}
                    </div>
                  )}
                  
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Itinerary Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Add Activity</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Activity Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemForm.activity}
                  onChange={(e) => setItemForm({ ...itemForm, activity: e.target.value })}
                  placeholder="e.g., Visit Eiffel Tower"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={itemForm.date}
                    onChange={(e) => setItemForm({ ...itemForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={itemForm.time}
                    onChange={(e) => setItemForm({ ...itemForm, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={itemForm.location}
                  onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  placeholder="Where is this activity?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Additional details..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItineraryTab;
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, X, MapPin } from 'lucide-react';
import api from '../services/api';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapTab({ group, currentUser }) {
  const [locations, setLocations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [locationForm, setLocationForm] = useState({
    name: '',
    description: '',
    lat: '',
    lng: '',
    category: 'attraction'
  });

  const categories = ['Attraction', 'Restaurant', 'Hotel', 'Activity', 'Other'];

  useEffect(() => {
    fetchLocations();
  }, [group.id]);

  const fetchLocations = async () => {
    try {
      const response = await api.get(`/locations/group/${group.id}`);
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/locations', { ...locationForm, groupId: group.id });

      fetchLocations();
      setShowAddModal(false);
      setLocationForm({ name: '', description: '', lat: '', lng: '', category: 'attraction' });
    } catch (error) {
      console.error('Error adding location:', error);
      alert('Failed to add location');
    }
  };

  // Calculate center of map based on locations
  const mapCenter = locations.length > 0
    ? [
        locations.reduce((sum, loc) => sum + parseFloat(loc.lat), 0) / locations.length,
        locations.reduce((sum, loc) => sum + parseFloat(loc.lng), 0) / locations.length
      ]
    : [48.8566, 2.3522]; // Default to Paris

  if (loading) {
    return <div className="text-center py-8">Loading map...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Locations Map</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} />
          Add Location
        </button>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg overflow-hidden shadow-md" style={{ height: '500px' }}>
        <MapContainer
          center={mapCenter}
          zoom={locations.length > 0 ? 12 : 4}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {locations.map((location) => (
            <Marker
              key={location.id}
              position={[parseFloat(location.lat), parseFloat(location.lng)]}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-gray-800">{location.name}</h4>
                  {location.category && (
                    <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded mt-1">
                      {location.category}
                    </span>
                  )}
                  {location.description && (
                    <p className="text-sm text-gray-600 mt-2">{location.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Locations List */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Saved Locations ({locations.length})</h4>
        {locations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No locations added yet. Add your first location!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-800">{location.name}</h5>
                    {location.category && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mt-1">
                        {location.category}
                      </span>
                    )}
                    {location.description && (
                      <p className="text-sm text-gray-600 mt-2">{location.description}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      📍 {location.lat}, {location.lng}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Add Location</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g., Eiffel Tower"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={locationForm.category}
                  onChange={(e) => setLocationForm({ ...locationForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={locationForm.lat}
                    onChange={(e) => setLocationForm({ ...locationForm, lat: e.target.value })}
                    placeholder="48.8566"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={locationForm.lng}
                    onChange={(e) => setLocationForm({ ...locationForm, lng: e.target.value })}
                    placeholder="2.3522"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={locationForm.description}
                  onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                  placeholder="Additional details about this location..."
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
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapTab;
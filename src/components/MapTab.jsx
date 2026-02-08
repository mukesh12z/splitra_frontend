import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, X, MapPin, Search, Trash2 } from 'lucide-react';
import api from '../services/api';

/* ── fix Leaflet default-icon in Vite ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl      : 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl    : 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ── numbered marker icon factory ── */
function numberedIcon(n) {
  return L.divIcon({
    className: '',                          // clear Leaflet's default classes
    html: `<div style="
      background:#4f46e5;color:#fff;
      width:28px;height:28px;border-radius:50% 50% 50% 4px;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;
      box-shadow:0 2px 6px rgba(0,0,0,.3);
      transform:rotate(-45deg);
    "><span style="transform:rotate(45deg)">${n}</span></div>`,
    iconSize  : [28, 28],
    iconAnchor: [14, 28],
    popupAnchor:[0, -30]
  });
}

/* ── geocode helper (same as ItineraryTab) ── */
async function geocodeSearch(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.map(r => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }));
  } catch { return []; }
}

/* ── sub-component: auto-fit map bounds when locations change ── */
function FitBounds({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(
      locations.map(l => [parseFloat(l.latitude), parseFloat(l.longitude)])
    );
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
  }, [locations, map]);
  return null;
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */
export default function MapTab({ group }) {
  const [locations,  setLocations]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [highlight,  setHighlight]  = useState(null);   // index of hovered list card

  /* geocode state */
  const [geoResults, setGeoResults] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const geoTimer                    = useRef(null);

  const blankForm = { name: '', description: '', latitude: null, longitude: null, category: 'attraction', locationText: '' };
  const [form, setForm] = useState(blankForm);

  const CATEGORIES = ['Attraction', 'Restaurant', 'Hotel', 'Activity', 'Itinerary', 'Other'];

  /* ── fetch ── */
  useEffect(() => { fetchLocations(); }, [group.id]);

  const fetchLocations = async () => {
    try {
      const { data } = await api.get(`/locations/group/${group.id}`);
      setLocations(data);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  /* ── geocode handlers (same pattern as ItineraryTab) ── */
  const handleLocationTextChange = (value) => {
    setForm(p => ({ ...p, locationText: value, latitude: null, longitude: null }));
    clearTimeout(geoTimer.current);
    if (value.trim().length < 2) { setGeoResults([]); return; }
    setGeoLoading(true);
    geoTimer.current = setTimeout(async () => {
      const results = await geocodeSearch(value);
      setGeoResults(results);
      setGeoLoading(false);
    }, 600);
  };

  const pickGeoResult = (r) => {
    setForm(p => ({ ...p, locationText: r.label, latitude: r.lat, longitude: r.lng }));
    setGeoResults([]);
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      alert('Please select a location from the search results.');
      return;
    }
    try {
      await api.post('/locations', {
        groupId   : group.id,
        name      : form.name,
        address   : form.locationText,
        latitude  : form.latitude,
        longitude : form.longitude,
        category  : form.category,
        notes     : form.description || null
      });
      await fetchLocations();
      setShowModal(false);
      setForm(blankForm);
      setGeoResults([]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to add location');
    }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Remove this location pin?')) return;
    try {
      await api.delete(`/locations/${id}`);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  /* ── category colour map ── */
  const catColour = { attraction:'bg-purple-100 text-purple-700', restaurant:'bg-orange-100 text-orange-700',
    hotel:'bg-blue-100 text-blue-700', activity:'bg-green-100 text-green-700',
    itinerary:'bg-indigo-100 text-indigo-700', other:'bg-gray-100 text-gray-700' };

  /* ── render ── */
  if (loading) return <div className="text-center py-8 text-gray-500">Loading map…</div>;

  const defaultCenter = locations.length > 0
    ? [parseFloat(locations[0].latitude), parseFloat(locations[0].longitude)]
    : [20.0, 77.0];                                    // fallback India

  return (
    <div className="space-y-5">

      {/* header */}
     {/* <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Locations Map</h3>
        <button onClick={() => { setForm(blankForm); setGeoResults([]); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={20}/> Add Location
        </button>
      </div>*/

      {/* ── map ── */}
      <div className="rounded-lg overflow-hidden shadow-md border border-gray-200" style={{ height: '480px' }}>
        <MapContainer center={defaultCenter} zoom={locations.length > 0 ? 12 : 4}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'/>

          {/* auto-fit when we have pins */}
          {locations.length > 0 && <FitBounds locations={locations}/>}

          {/* numbered markers */}
          {locations.map((loc, idx) => (
            <Marker key={loc.id}
              position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
              icon={numberedIcon(idx + 1)}
              eventHandlers={{ mouseover: () => setHighlight(idx), mouseout: () => setHighlight(null) }}>
              <Popup>
                <div className="min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{idx+1}</span>
                    <h4 className="font-bold text-gray-800 text-sm">{loc.name}</h4>
                  </div>
                  {loc.category && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${catColour[loc.category] || catColour.other}`}>
                      {loc.category}
                    </span>
                  )}
                  {loc.address && <p className="text-xs text-gray-500 mt-1">{loc.address}</p>}
                  {loc.notes  && <p className="text-xs text-gray-500 mt-1">{loc.notes}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* ── location list ── */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Saved Locations ({locations.length})</h4>
        {locations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MapPin size={40} className="mx-auto text-gray-300 mb-2"/>
            <p className="text-gray-500 text-sm">No locations yet. Add one, or add activities with locations in the Itinerary tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {locations.map((loc, idx) => (
              <div key={loc.id}
                onMouseEnter={() => setHighlight(idx)}
                onMouseLeave={() => setHighlight(null)}
                className={`bg-white border rounded-lg p-4 transition-all cursor-default ${
                  highlight === idx ? 'border-indigo-400 shadow-md' : 'border-gray-200 hover:shadow-sm'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* number badge */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-gray-800 truncate">{loc.name}</h5>
                      {loc.category && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1 ${catColour[loc.category] || catColour.other}`}>
                          {loc.category}
                        </span>
                      )}
                      {loc.address && <p className="text-xs text-gray-500 mt-1 truncate">{loc.address}</p>}
                      {loc.notes   && <p className="text-xs text-gray-400 mt-1">{loc.notes}</p>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(loc.id)} className="text-gray-300 hover:text-red-500 ml-2 flex-shrink-0">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          ADD-LOCATION MODAL
          ════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative" style={{ zIndex: 10000 }}>

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800">Add Location</h3>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-400 hover:text-gray-600"/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location Name *</label>
                <input required type="text" value={form.name}
                  onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  placeholder="e.g. Eiffel Tower"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
              </div>

              {/* category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
                  {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>

              {/* location search ── same geocode pattern ── */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Search Location *
                  {form.latitude && <span className="ml-2 text-xs font-normal text-green-600">✓ coords locked</span>}
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="text" value={form.locationText}
                    onChange={e => handleLocationTextChange(e.target.value)}
                    placeholder="Type to search…"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
                </div>

                {geoLoading && <p className="text-xs text-gray-400 mt-1.5 ml-1">Searching…</p>}

                {geoResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {geoResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => pickGeoResult(r)}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100 last:border-0">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-indigo-500 mt-0.5 flex-shrink-0"/>
                          <span className="leading-snug">{r.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                  {form.latitude ? 'Coordinates set. Ready to save.' : 'Select a result to set the map pin.'}
                </p>
              </div>

              {/* description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea value={form.description} rows={2}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  placeholder="Any tips or details…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
              </div>

              {/* buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={!form.latitude}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
                  Add Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
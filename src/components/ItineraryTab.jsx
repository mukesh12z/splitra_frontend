import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Calendar, Clock, MapPin, Search, Trash2, Lightbulb, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../services/api';
import TipsModal from './TipsModal';

/* ────────────────────────────────────────────────────
   Nominatim geocode helper  (OpenStreetMap – free, no key)
   ──────────────────────────────────────────────────── */
async function geocodeSearch(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.map(r => ({
      label: r.display_name,
      lat  : parseFloat(r.lat),
      lng  : parseFloat(r.lon)
    }));
  } catch { return []; }
}

/* ════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════ */
export default function ItineraryTab({ group }) {
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingId,     setEditingId]     = useState(null);  // Track which item is being edited

  /* tips modal state */
  const [tipItem,       setTipItem]       = useState(null);   // the itinerary item whose tips are open

  /* geocode dropdown state */
  const [geoResults,    setGeoResults]    = useState([]);
  const [geoLoading,    setGeoLoading]    = useState(false);
  const geoTimer                          = useRef(null);

  const blankForm = {
    activity   : '',
    date       : '',
    time       : '',
    location   : '',
    latitude   : null,
    longitude  : null,
    description: ''
  };
  const [form, setForm] = useState(blankForm);

  /* ── fetch ── */
  useEffect(() => { fetchItems(); }, [group.id]);

  const fetchItems = async () => {
    try {
      const { data } = await api.get(`/itinerary/group/${group.id}`);
      setItems(data);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  /* ── geocode: debounced on location text change ── */
  const handleLocationChange = (value) => {
    setForm(p => ({ ...p, location: value, latitude: null, longitude: null }));
    clearTimeout(geoTimer.current);
    if (value.trim().length < 2) { setGeoResults([]); return; }
    setGeoLoading(true);
    geoTimer.current = setTimeout(async () => {
      const results = await geocodeSearch(value);
      setGeoResults(results);
      setGeoLoading(false);
    }, 600);
  };

  /* user picks a result from the dropdown */
  const pickGeoResult = (r) => {
    setForm(p => ({ ...p, location: r.label, latitude: r.lat, longitude: r.lng }));
    setGeoResults([]);
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedItem;
      
      if (editingId) {
        // Update existing item
        const { data } = await api.put(`/itinerary/${editingId}`, {
          activity  : form.activity,
          location  : form.location,
          date      : form.date,
          time      : form.time || null,
          notes     : form.description || null,
          latitude  : form.latitude,
          longitude : form.longitude
        });
        savedItem = data;
        
        // Update corresponding location if it exists
        if (form.latitude && form.longitude) {
          try {
            await api.put(`/locations/itinerary/${editingId}`, {
              name      : form.activity,
              address   : form.location,
              latitude  : form.latitude,
              longitude : form.longitude,
              notes     : form.description || null
            });
          } catch (err) {
            console.log('No location to update or update failed');
          }
        }
      } else {
        // Create new item
        const { data } = await api.post('/itinerary', {
          groupId   : group.id,
          activity  : form.activity,
          location  : form.location,
          date      : form.date,
          time      : form.time || null,
          notes     : form.description || null,
          latitude  : form.latitude,
          longitude : form.longitude
        });
        savedItem = data;

        /* if coords exist, create a Location pin for MapTab */
        if (form.latitude && form.longitude) {
          const locationResponse = await api.post('/locations', {
            groupId     : group.id,
            itineraryId : savedItem.id,
            name        : form.activity,
            address     : form.location,
            latitude    : form.latitude,
            longitude   : form.longitude,
            category    : 'itinerary',
            notes       : form.description || null
            // displayOrder is auto-calculated based on itinerary date+time
          });

          // Link the location back to the itinerary
          await api.put(`/itinerary/${savedItem.id}`, {
            ...savedItem,
            locationId: locationResponse.data.id
          });
        }
      }

      await fetchItems();
      setShowModal(false);
      setForm(blankForm);
      setEditingId(null);
      setGeoResults([]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'add'} activity`);
    }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Remove this activity?')) return;
    try {
      await api.delete(`/itinerary/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  /* ── edit ── */
  const handleEdit = (item) => {
    setForm({
      activity   : item.activity,
      date       : item.date?.split('T')[0] || '',
      time       : item.time || '',
      location   : item.location || '',
      latitude   : item.latitude,
      longitude  : item.longitude,
      description: item.notes || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  /* ── reorder ── */
  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    
    // Update location order if items have locations
    try {
      await updateLocationOrder(newItems);
    } catch (err) {
      console.error('Failed to update location order:', err);
    }
  };

  const handleMoveDown = async (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
    
    // Update location order if items have locations
    try {
      await updateLocationOrder(newItems);
    } catch (err) {
      console.error('Failed to update location order:', err);
    }
  };

  const updateLocationOrder = async (orderedItems) => {
    try {
      // Save itinerary order
      const itemsWithOrder = orderedItems.map((item, idx) => ({
        id: item.id,
        displayOrder: idx
      }));
      await api.post(`/itinerary/group/${group.id}/reorder`, { items: itemsWithOrder });

      // Update displayOrder for all locations linked to itinerary items
      const locationUpdates = orderedItems
        .filter(item => item.latitude && item.longitude)
        .map((item, index) => 
          api.put(`/locations/itinerary/${item.id}/order`, { displayOrder: index })
            .catch(err => console.log('Location order update failed (endpoint may not exist):', err))
        );
      
      if (locationUpdates.length > 0) {
        await Promise.all(locationUpdates);
      }
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  };

  /* ── render ── */
  if (loading) return <div className="text-center py-8 text-gray-500">Loading itinerary…</div>;

  /* group items by date */
  const grouped = items.reduce((acc, item) => {
    const key = item.date?.split('T')[0] || 'unknown';
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});
  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">

      {/* header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Trip Itinerary</h3>
        <button onClick={() => { setForm(blankForm); setGeoResults([]); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={20}/> Add Activity
        </button>
      </div>

      {/* empty state */}
      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">No activities planned yet. Add your first one!</p>
        </div>
      )}

      {/* day sections */}
      {sortedDays.map(day => {
        const dayItems = grouped[day];
        const d        = new Date(day + 'T12:00:00');
        return (
          <div key={day}>
            {/* day badge */}
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-600 text-white text-center rounded-lg px-3 py-1.5 min-w-[52px]">
                <div className="text-xs font-semibold opacity-80">
                  {d.toLocaleDateString('en-US', { month: 'short' })}
                </div>
                <div className="text-lg font-bold leading-tight">{d.getDate()}</div>
              </div>
              <div className="text-sm font-semibold text-gray-500">
                {d.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
            </div>

            {/* items for this day */}
            <div className="ml-[68px] space-y-3">
              {dayItems.map((item, idx) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex gap-3">
                    {/* order number */}
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800">{item.activity}</h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Tips button */}
                          <button
                            onClick={() => setTipItem(item)}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors">
                            <Lightbulb size={13}/>
                            Tips
                          </button>
                          {/* Edit button */}
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-gray-400 hover:text-indigo-500"
                            title="Edit activity"
                          >
                            <Edit2 size={16}/>
                          </button>
                          {/* Reorder buttons 
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveUp(dayItems.indexOf(item))}
                              disabled={idx === 0}
                              className={`${idx === 0 ? 'text-gray-200' : 'text-gray-400 hover:text-indigo-500'}`}
                              title="Move up"
                            >
                              <ChevronUp size={14}/>
                            </button>
                            <button
                              onClick={() => handleMoveDown(dayItems.indexOf(item))}
                              disabled={idx === dayItems.length - 1}
                              className={`${idx === dayItems.length - 1 ? 'text-gray-200' : 'text-gray-400 hover:text-indigo-500'}`}
                              title="Move down"
                            >
                              <ChevronDown size={14}/>
                            </button>
                          </div>*/}
                          {/* Delete button */}
                          <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500">
                            <Trash2 size={17}/>
                          </button>
                        </div>
                      </div>

                      {item.time && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                          <Clock size={14}/> {item.time}
                        </div>
                      )}

                      {item.location && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                          <MapPin size={14} className={item.latitude ? 'text-indigo-500' : 'text-gray-400'}/>
                          <span className="truncate">{item.location}</span>
                          {item.latitude && (
                            <span className="ml-1 text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">📍 on map</span>
                          )}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-sm text-gray-500 mt-1.5">{item.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* ════════════════════════════════════════════
          ADD-ACTIVITY MODAL
          ════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Activity' : 'Add Activity'}</h3>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-400 hover:text-gray-600"/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* activity name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Activity Name *</label>
                <input required type="text" value={form.activity}
                  onChange={e => setForm(p => ({...p, activity: e.target.value}))}
                  placeholder="e.g. Visit Eiffel Tower"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
              </div>

              {/* date + time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
                  <input required type="date" value={form.date}
                    onChange={e => setForm(p => ({...p, date: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time</label>
                  <input type="time" value={form.time}
                    onChange={e => setForm(p => ({...p, time: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
                </div>
              </div>

              {/* location search with geocode dropdown */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Location
                  {form.latitude && <span className="ml-2 text-xs font-normal text-green-600">✓ pinned on map</span>}
                </label>

                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="text" value={form.location}
                    onChange={e => handleLocationChange(e.target.value)}
                    placeholder="Search a place…"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
                </div>

                {geoLoading && (
                  <p className="text-xs text-gray-400 mt-1.5 ml-1">Searching…</p>
                )}

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
                  {form.latitude
                    ? 'Location selected — a pin will be added to the Map tab.'
                    : 'Type to search. Selecting a result adds a pin to the Map tab automatically.'}
                </p>
              </div>

              {/* description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} rows={2}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  placeholder="Additional details…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
              </div>

              {/* buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700">{editingId ? 'Update Activity' : 'Add Activity'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TIPS MODAL — opens when user clicks "Tips" on any activity
          ════════════════════════════════════════════ */}
      {tipItem && (
        <TipsModal
          itineraryItem={tipItem}
          onClose={() => setTipItem(null)}
        />
      )}
    </div>
  );
}
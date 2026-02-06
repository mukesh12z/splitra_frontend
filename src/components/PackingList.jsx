import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Cloud, Sun, CloudRain } from 'lucide-react';
import api from '../services/api';

const PackingList = ({ tripId, destination }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    loadItems();
    if (destination) {
      getWeatherSuggestions();
    }
  }, [tripId, destination]);

  const loadItems = async () => {
    // Load from IndexedDB
    const savedItems = localStorage.getItem(`packing_${tripId}`);
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  };

  const saveItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem(`packing_${tripId}`, JSON.stringify(newItems));
  };

  const getWeatherSuggestions = async () => {
    try {
      // Get weather from free API (OpenWeatherMap has free tier)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${destination}&appid=YOUR_FREE_KEY`
      );
      const data = await response.json();
      setWeather(data);
      
      // Add weather-based suggestions
      const suggestions = [];
      if (data.main.temp < 15) {
        suggestions.push({ name: 'Warm jacket', category: 'Clothing', checked: false });
        suggestions.push({ name: 'Gloves', category: 'Accessories', checked: false });
      }
      if (data.main.temp > 25) {
        suggestions.push({ name: 'Sunscreen', category: 'Toiletries', checked: false });
        suggestions.push({ name: 'Sunglasses', category: 'Accessories', checked: false });
      }
      if (data.weather[0].main === 'Rain') {
        suggestions.push({ name: 'Umbrella', category: 'Accessories', checked: false });
        suggestions.push({ name: 'Rain jacket', category: 'Clothing', checked: false });
      }
      
      // Merge with existing items
      const updatedItems = [...items];
      suggestions.forEach(suggestion => {
        if (!updatedItems.find(item => item.name === suggestion.name)) {
          updatedItems.push({ ...suggestion, id: Date.now() + Math.random() });
        }
      });
      saveItems(updatedItems);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  const addItem = () => {
    if (newItem.trim()) {
      const item = {
        id: Date.now(),
        name: newItem,
        category: 'General',
        checked: false
      };
      saveItems([...items, item]);
      setNewItem('');
    }
  };

  const toggleItem = (id) => {
    saveItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (id) => {
    saveItems(items.filter(item => item.id !== id));
  };

  const categories = [...new Set(items.map(item => item.category))];
  const completedCount = items.filter(item => item.checked).length;
  const progressPercentage = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Packing List</h3>
        <div className="text-sm text-gray-600">
          {completedCount} / {items.length} packed
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-green-600 h-2 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Weather Info */}
      {weather && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 flex items-center gap-3">
          {weather.weather[0].main === 'Clear' && <Sun className="text-yellow-500" size={24} />}
          {weather.weather[0].main === 'Rain' && <CloudRain className="text-blue-500" size={24} />}
          {weather.weather[0].main === 'Clouds' && <Cloud className="text-gray-500" size={24} />}
          <div>
            <div className="font-semibold">{destination} Weather</div>
            <div className="text-sm text-gray-600">
              {Math.round(weather.main.temp - 273.15)}°C - {weather.weather[0].description}
            </div>
          </div>
        </div>
      )}

      {/* Add Item */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add item..."
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          onClick={addItem}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Items by Category */}
      <div className="space-y-4">
        {categories.map(category => (
          <div key={category}>
            <h4 className="font-semibold text-gray-700 mb-2">{category}</h4>
            <div className="space-y-2">
              {items
                .filter(item => item.category === category)
                .map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleItem(item.id)}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <span className={item.checked ? 'line-through text-gray-400' : ''}>
                        {item.name}
                      </span>
                    </label>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Template Suggestions */}
      <div className="mt-6 pt-6 border-t">
        <button
          className="text-sm text-indigo-600 hover:text-indigo-800"
          onClick={() => {
            const templates = [
              { name: 'Passport', category: 'Documents', checked: false },
              { name: 'Phone charger', category: 'Electronics', checked: false },
              { name: 'Toothbrush', category: 'Toiletries', checked: false },
              { name: 'Medications', category: 'Health', checked: false },
              { name: 'Underwear', category: 'Clothing', checked: false },
              { name: 'Socks', category: 'Clothing', checked: false }
            ];
            const newItems = [...items];
            templates.forEach(template => {
              if (!newItems.find(i => i.name === template.name)) {
                newItems.push({ ...template, id: Date.now() + Math.random() });
              }
            });
            saveItems(newItems);
          }}
        >
          + Add essential items template
        </button>
      </div>
    </div>
  );
};

export default PackingList;
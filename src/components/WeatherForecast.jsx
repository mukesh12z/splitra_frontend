import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';
import api from '../services/api';

const WeatherForecast = ({ destination }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    if (destination) {
      fetchWeather();
    }
  }, [destination]);

  const fetchWeather = async () => {
    try {
      // FREE API: OpenWeatherMap (1000 calls/day free)
      // You need to sign up for free API key
      const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY || 'demo';
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${destination}&appid=${API_KEY}&units=metric`
      );
      const data = await response.json();
      
      setWeather(data.list[0]);
      
      // Get forecast for next 5 days (one per day at noon)
      const dailyForecast = data.list.filter((item, index) => index % 8 === 0).slice(0, 5);
      setForecast(dailyForecast);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  if (!weather) return null;

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Clear': return <Sun className="text-yellow-500" size={32} />;
      case 'Rain': return <CloudRain className="text-blue-500" size={32} />;
      case 'Clouds': return <Cloud className="text-gray-500" size={32} />;
      default: return <Cloud className="text-gray-400" size={32} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4">{destination} Weather</h3>
      
      {/* Current Weather */}
      <div className="flex items-center gap-4 mb-6">
        {getWeatherIcon(weather.weather[0].main)}
        <div>
          <div className="text-4xl font-bold">
            {Math.round(weather.main.temp)}°C
          </div>
          <div className="text-blue-100">{weather.weather[0].description}</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white bg-opacity-20 p-3 rounded">
          <div className="text-xs text-blue-100">Feels Like</div>
          <div className="text-xl font-semibold">
            {Math.round(weather.main.feels_like)}°C
          </div>
        </div>
        <div className="bg-white bg-opacity-20 p-3 rounded">
          <div className="text-xs text-blue-100 flex items-center gap-1">
            <Wind size={12} /> Wind
          </div>
          <div className="text-xl font-semibold">
            {weather.wind.speed} m/s
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div>
        <h4 className="text-sm font-semibold mb-2">5-Day Forecast</h4>
        <div className="grid grid-cols-5 gap-2">
          {forecast.map((day, idx) => (
            <div key={idx} className="bg-white bg-opacity-20 p-2 rounded text-center">
              <div className="text-xs mb-1">
                {new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}
              </div>
              <div className="flex justify-center mb-1">
                {getWeatherIcon(day.weather[0].main)}
              </div>
              <div className="text-sm font-semibold">
                {Math.round(day.main.temp)}°
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;
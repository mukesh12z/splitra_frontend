import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class MapService {
  async geocode(address) {
    const response = await axios.get(`${API_URL}/maps/geocode`, {
      params: { address }
    });
    return response.data;
  }

  async reverseGeocode(lat, lon) {
    const response = await axios.get(`${API_URL}/maps/reverse-geocode`, {
      params: { lat, lon }
    });
    return response.data;
  }

  async searchNearby(lat, lon, type = 'tourism', radius = 1000) {
    const response = await axios.get(`${API_URL}/maps/nearby`, {
      params: { lat, lon, type, radius }
    });
    return response.data;
  }

  async getRoute(startLat, startLon, endLat, endLon) {
    const response = await axios.get(`${API_URL}/maps/route`, {
      params: { startLat, startLon, endLat, endLon }
    });
    return response.data;
  }

  // Get OpenStreetMap tile URL (FREE)
  getTileURL(z, x, y) {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }
}

export default new MapService();
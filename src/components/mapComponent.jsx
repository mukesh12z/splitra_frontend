import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ locations, center, zoom = 13, height = '400px', showRoute = false, routePoints = [] }) => {
  const [map, setMap] = useState(null);

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center || [28.6139, 77.2090]} // Default to Delhi
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
      >
        {/* FREE OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Location markers */}
        {locations && locations.map((location, idx) => (
          <Marker
            key={idx}
            position={[location.latitude, location.longitude]}
          >
            <Popup>
              <div>
                <h3 className="font-bold">{location.name}</h3>
                <p className="text-sm">{location.address}</p>
                {location.category && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                    {location.category}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route polyline */}
        {showRoute && routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            color="blue"
            weight={4}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
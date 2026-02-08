import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './leaflet-overrides.css';
import { CurrencyProvider } from './contexts/CurrencyContext';

// Wrap your app

ReactDOM.createRoot(document.getElementById('root')).render(
<CurrencyProvider>
  <App />
</CurrencyProvider>
);
/*
*/
/*
  <React.StrictMode>
    <App />
  </React.StrictMode>
  */
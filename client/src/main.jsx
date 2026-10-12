import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Seamless production API and WebSocket host resolution
if (typeof window !== 'undefined') {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) {
    const targetBase =
      import.meta.env.VITE_API_URL ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('intellmeet_api_url')) ||
      'https://intellmeet-backend.onrender.com';

    // 1. Intercept fetch calls targeting localhost:5000
    const rawFetch = window.fetch;
    window.fetch = function (input, init) {
      if (typeof input === 'string' && input.includes('localhost:5000')) {
        input = input.replace('http://localhost:5000', targetBase).replace('https://localhost:5000', targetBase);
      } else if (input instanceof Request && input.url && input.url.includes('localhost:5000')) {
        const newUrl = input.url.replace('http://localhost:5000', targetBase).replace('https://localhost:5000', targetBase);
        input = new Request(newUrl, input);
      }
      return rawFetch.call(this, input, init);
    };

    // 2. Intercept axios calls
    axios.interceptors.request.use((config) => {
      if (config.url && config.url.includes('localhost:5000')) {
        config.url = config.url.replace('http://localhost:5000', targetBase).replace('https://localhost:5000', targetBase);
      }
      return config;
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

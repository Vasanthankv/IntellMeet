import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Seamless production API and WebSocket host resolution
if (typeof window !== 'undefined') {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const targetBase =
    (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/api$/, '')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('intellmeet_api_url')) ||
    (isLocal ? 'http://localhost:5000' : 'https://intellmeet-backend-h3md.onrender.com');

  window.INTELLMEET_SERVER_BASE = targetBase;
  window.INTELLMEET_API_BASE = `${targetBase}/api`;

  if (!isLocal) {
    // 1. Intercept fetch calls targeting localhost:5000 or 127.0.0.1:5000
    const rawFetch = window.fetch;
    window.fetch = function (input, init) {
      if (typeof input === 'string') {
        if (input.includes('localhost:5000') || input.includes('127.0.0.1:5000')) {
          input = input
            .replace(/https?:\/\/localhost:5000/g, targetBase)
            .replace(/https?:\/\/127\.0\.0\.1:5000/g, targetBase);
        }
      } else if (input instanceof Request && input.url && (input.url.includes('localhost:5000') || input.url.includes('127.0.0.1:5000'))) {
        const newUrl = input.url
          .replace(/https?:\/\/localhost:5000/g, targetBase)
          .replace(/https?:\/\/127\.0\.0\.1:5000/g, targetBase);
        input = new Request(newUrl, input);
      }
      return rawFetch.call(this, input, init);
    };

    // 2. Intercept axios calls
    axios.interceptors.request.use((config) => {
      if (config.url && (config.url.includes('localhost:5000') || config.url.includes('127.0.0.1:5000'))) {
        config.url = config.url
          .replace(/https?:\/\/localhost:5000/g, targetBase)
          .replace(/https?:\/\/127\.0\.0\.1:5000/g, targetBase);
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

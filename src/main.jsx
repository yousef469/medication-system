import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Global Error Handler for Mobile Debugging
window.onerror = (msg, url, line, col, error) => {
  console.error("Global Error:", { msg, url, line, col, error });
  // Show alert ONLY in production/WebView if it crashes
  if (import.meta.env.PROD) {
    alert(`System Error: ${msg}\nLine: ${line}`);
  }
  return false;
};
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Check for updates every hour
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

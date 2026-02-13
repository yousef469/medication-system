import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Global Error Handler for Mobile Debugging
window.onerror = (msg, url, line, col, error) => {
  console.error("Global Error Caught:", { msg, url, line, col });
  // If it's a chunk loading error (common on PWA updates), force reload
  if (msg.toLowerCase().includes("loading chunk") || msg.toLowerCase().includes("unexpected token '<'")) {
    console.warn("Chunk error detected. Forcing nuclear reload...");
    setTimeout(() => window.location.reload(true), 2000);
  }
  return false;
};
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Check for updates every hour
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content available. Update happening in background...");
    updateSW(true); // Force update without prompt for better mobile sync
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

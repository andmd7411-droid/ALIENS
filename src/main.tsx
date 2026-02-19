import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log("main.tsx: Starting application...");

const container = document.getElementById('root');
if (!container) {
  console.error("main.tsx: Root container not found!");
} else {
  console.log("main.tsx: Root container found, rendering...");
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Hide loading screen after a short delay to ensure React has started rendering
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
      console.log("main.tsx: Loading screen hidden");
    }
  }, 1000);
}

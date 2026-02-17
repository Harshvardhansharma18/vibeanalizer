import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("Starting application...");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");

  createRoot(rootElement).render(
    <StrictMode>
      <App />
      <Analytics />
    </StrictMode>,
  )
} catch (error) {
  console.error("Application failed to start:", error);
  document.body.innerHTML = `
    <div style="background: #000; color: #ff0000; padding: 20px; font-family: monospace; height: 100vh;">
      <h1>CRITICAL ERROR</h1>
      <p>The application failed to start.</p>
      <pre>${error.message}\n${error.stack}</pre>
    </div>
  `;
}

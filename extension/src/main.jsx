import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

/**
 * Main Bootstrapping Entry Point
 * 
 * Responsibility:
 * - Bootstraps the React application into the popup HTML element.
 * - Imports the root CSS stylesheets.
 * 
 * Interacts with:
 * - extension/public/popup.html (DOM mount target)
 * - extension/src/popup/Popup.jsx (Will contain the core UI layout)
 */
function App() {
  return (
    <div className="scaffold-card">
      <header className="scaffold-header">
        <div className="pulse-indicator"></div>
        <h1 className="title-gradient">SafeLens</h1>
        <span className="badge">Phase 1 Scaffold</span>
      </header>
      <main className="scaffold-body">
        <p className="description">
          Privacy Shield AI is currently running in scaffolding mode.
        </p>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Module 1 Build:</span>
            <span className="status-value active">Active</span>
          </div>
          <div className="status-item">
            <span className="status-label">AI Engine:</span>
            <span className="status-value pending">Pending</span>
          </div>
        </div>
      </main>
      <footer className="scaffold-footer">
        <p>Waiting for Module 2/3/4/5/6/7 Scaffolding...</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

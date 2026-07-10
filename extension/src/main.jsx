import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Popup from './popup/Popup.jsx';

/**
 * Main Application Bootstrapping entry point.
 * Mounts the core React Popup UI.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);

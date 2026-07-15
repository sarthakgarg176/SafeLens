# 🛡️ SafeLens: Privacy Shield AI

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/sarthakgarg176/SafeLens)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**SafeLens** is an enterprise-grade browser extension and real-time telemetry dashboard designed to proactively intercept, redact, and monitor Personally Identifiable Information (PII) before it leaves your browser. 

Whether an employee is uploading a document to an external tool or sharing a screenshot, SafeLens scans the asset locally using an OCR & Fusion Model engine, redacts sensitive identifiers, and synchronizes telemetry to a central Security Console in real time.

---

## ✨ Core Features

- **🌐 Cross-Site Interception:** Globally intercepts file uploads and drag-and-drop events on external websites (e.g., image uploaders, forms).
- **🔒 On-the-Fly Redaction:** Automatically detects PII/sensitive data and overlays a redaction mask before the file is transmitted.
- **⚡ Real-Time Telemetry Sync:** Background service workers seamlessly communicate with a React-based security dashboard without page refreshes (Short-polling & Optimistic UI).
- **📊 Centralized Security Console:** Provides a unified view of "Monitored Assets" (safe uploads) and "Active Incidents" (critical/high-risk leak attempts).
- **🛠️ Frictionless Handshake:** Implements a robust bridging mechanism (`dashboardBridge.js`) to securely pass authentication tokens and state between the web app and the extension.

---

## 🏗️ Architecture & Flow

1. **Content Script (`<all_urls>`)**: Listens for file inputs and drop zones across the web.
2. **Interception Modal**: Pauses the upload and asks the user to "Protect & Upload".
3. **Background Worker (`messageRouter.js`)**: Processes the file, evaluates risk, and redacts if necessary.
4. **Backend API (`/api/scans`)**: Logs the atomic transaction (Asset + Alert creation) to the database.
5. **Dashboard UI (`SecurityContext.jsx`)**: Fetches updated schemas and reflects the changes instantly on the Security Console.

---

## 💻 Tech Stack

* **Frontend Dashboard:** React, Vite, Tailwind CSS (Glassmorphic UI)
* **Browser Extension:** Manifest V3, Chrome Extension APIs, JavaScript
* **Backend Pipeline:** Python, SQLite, RESTful API
* **Deployment:** Vercel/Netlify (Frontend), Render (Backend)

---

## 📂 Project Structure

```text
SafeLens/
├── extension/                 # Chrome Extension Codebase
│   ├── src/
│   │   ├── background/        # Service workers (messageRouter.js)
│   │   ├── content/           # Content scripts & Bridge (dashboardBridge.js)
│   │   └── communication/     # API handlers (bridgeClient.js)
│   ├── manifest.json          # MV3 Configuration
│   └── package.json           
├── src/                       # React Dashboard Codebase
│   ├── components/            # UI Elements (Cards, Tables, Toasts)
│   ├── context/               # State Management (SecurityContext.jsx)
│   ├── pages/                 # Views (Dashboard, Incidents, Scans)
│   └── services/              # API Client (apiClient.js)
├── backend/                   # API Routing & Database Models
│   ├── api/                   # Route controllers (scans.py, incidents.py)
│   └── main.py                # Server entry point
├── package.json               # Frontend dependencies
└── vite.config.js             # Vite configuration

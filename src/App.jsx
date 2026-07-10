import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardGrid from './components/DashboardGrid';
import Assets from './pages/Assets';
import ScanHistory from './pages/ScanHistory';
import Reports from './pages/Reports';
import Incidents from './pages/Incidents';
import TakedownCenter from './pages/TakedownCenter';
import SimilaritySearch from './pages/SimilaritySearch';
import RiskAnalysis from './pages/RiskAnalysis';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { SecurityProvider } from './context/SecurityContext';

/* ─── Session helpers ───────────────────────────────────────────────────────── */
const SESSION_KEY = 'cloakai_session_token';

function isAuthenticated() {
  const token = localStorage.getItem(SESSION_KEY);
  return typeof token === 'string' && token.trim().length > 0;
}

/* ─── Lock document to dark mode permanently ────────────────────────────────── */
document.documentElement.classList.add('dark');

/* ─────────────────────────────────────────────────────────────────────────────
   ProtectedRoute
   Wraps any dashboard route. Redirects unauthenticated users to /login,
   preserving the intended destination for post-login navigation.
────────────────────────────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PublicRoute
   Wraps the /login route. Redirects already-authenticated users to the
   dashboard root so they never see the login page while logged in.
────────────────────────────────────────────────────────────────────────────── */
function PublicRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/* ─────────────────────────────────────────────────────────────────────────────
   DashboardShell
   The persistent shell (Sidebar + Navbar + main content area) rendered for
   every protected dashboard route.
────────────────────────────────────────────────────────────────────────────── */
function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((p) => !p);

  return (
    <div className="flex min-h-screen bg-background text-slate-100 overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-black/5 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   App
────────────────────────────────────────────────────────────────────────────── */
export default function App() {
  /* Ensure the .dark class persists across any potential clearing */
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <BrowserRouter>
      <SecurityProvider>
        <Routes>

          {/* ── Public: Login ─────────────────────────────────────────── */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* ── Protected: Dashboard routes ───────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardShell>
                  <DashboardGrid />
                </DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <DashboardShell><Assets /></DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan-history"
            element={
              <ProtectedRoute>
                <DashboardShell><ScanHistory /></DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DashboardShell><Reports /></DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <DashboardShell><Incidents /></DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/similarity"
            element={
              <ProtectedRoute>
                <DashboardShell><SimilaritySearch /></DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/takedown"
            element={
              <ProtectedRoute>
                <DashboardShell><TakedownCenter /></DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/risk-analysis"
            element={
              <ProtectedRoute>
                <DashboardShell><RiskAnalysis /></DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardShell><Settings /></DashboardShell>
              </ProtectedRoute>
            }
          />

          {/* ── Fallback: redirect unknown paths to root ──────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </SecurityProvider>
    </BrowserRouter>
  );
}

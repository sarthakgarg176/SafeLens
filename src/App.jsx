import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardOverview from './components/dashboard/DashboardOverview';
import PolicyUploader from './components/policy/PolicyUploader';
import ActivePolicies from './components/policy/ActivePolicies';
import AgenticBrain from './components/timeline/AgenticBrain';
import DomainWhitelist from './components/whitelist/DomainWhitelist';
import InterceptionLogs from './components/logs/InterceptionLogs';
import SpoofingAlerts from './components/alerts/SpoofingAlerts';
import DashboardReports from './components/reports/Reports';
import DashboardSettings from './components/settings/Settings';
import DashboardGrid from './components/DashboardGrid';
import LlmShield from './components/features/LlmShield';
import ImageRedaction from './components/features/ImageRedaction';
import DecoySwapper from './components/features/DecoySwapper';
import ShieldStatusBar from './components/common/ShieldStatusBar';
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

/* ─── Session helpers ────────────────────────────────────────────────── */
const SESSION_KEY = 'cloakai_session_token';

function isAuthenticated() {
  const token = localStorage.getItem(SESSION_KEY);
  return typeof token === 'string' && token.trim().length > 0 && token !== 'false';
}

/* ─── Lock document to dark mode permanently ────────────────────────── */
document.documentElement.classList.add('dark');

/* ──────────────────────────────────────────────────────────────────────
   ProtectedRoute
   Wraps any dashboard route. Redirects unauthenticated users to /login,
   preserving the intended destination for post-login navigation.
──────────────────────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

/* ──────────────────────────────────────────────────────────────────────
   PublicRoute
   Wraps the /login route. Redirects already-authenticated users to the
   dashboard root so they never see the login page while logged in.
──────────────────────────────────────────────────────────────────────── */
function PublicRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/* ──────────────────────────────────────────────────────────────────────
   DashboardShell
   The persistent shell (Sidebar + Navbar + main content area) rendered for
   every protected dashboard route. Checks token on layout render for airtight
   security.
──────────────────────────────────────────────────────────────────────── */
function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((p) => !p);

  // Airtight sanity check directly on every layout render
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

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

/* ──────────────────────────────────────────────────────────────────────
   CommandCenter
   Main operations center utilizing tab-based view switching and shared states.
──────────────────────────────────────────────────────────────────────── */
function CommandCenter() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((p) => !p);

  // Lifted policies state
  const [policies, setPolicies] = useState([
    { id: 'pol-1', title: 'GDPR Data Compliance guidelines', category: 'GDPR PII', chunks: 42, date: '07/20/2026', enabled: true },
    { id: 'pol-2', title: 'AWS Secret Token Intercepts', category: 'Financial Security', chunks: 28, date: '07/21/2026', enabled: true },
    { id: 'pol-3', title: 'OAuth Whitelist Exclusions', category: 'General Exclusion', chunks: 14, date: '07/23/2026', enabled: false }
  ]);

  // Lifted threat logs state
  const [threatLogs, setThreatLogs] = useState([
    { id: 'tlog-1', domain: 'api.openai.com/v1/chat', type: 'OpenAI API Key', action: 'Synthetic Decoy Deployed', status: 'success', time: '11:32:04' },
    { id: 'tlog-2', domain: 'slack.com/api/files.upload', type: 'Corporate SSH Private Key', action: 'Synthetic Decoy Deployed', status: 'success', time: '11:28:15' },
    { id: 'tlog-3', domain: 'github.com/api/v3', type: 'Admin OAuth Credentials',action: 'Interception Block Triggered', status: 'failed', time: '11:15:42' },
    { id: 'tlog-4', domain: 'internal.sandbox-dev.net', type: 'Database Query Payload', action: 'Whitelisted Bypass Code', status: 'warning', time: '11:02:11' },
    { id: 'tlog-5', domain: 'huggingface.co/api/models', type: 'Production SecretToken', action: 'Synthetic Decoy Deployed', status: 'success', time: '10:58:30' }
  ]);

  const handleTogglePolicy = (id) => {
    setPolicies((prev) =>
      prev.map((policy) =>
        policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
      )
    );
  };

  const handleDeletePolicy = (id) => {
    setPolicies((prev) => prev.filter((policy) => policy.id !== id));
  };

  const handleUploadSuccess = (newPolicy) => {
    setPolicies((prev) => [newPolicy, ...prev]);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            policies={policies}
            threatLogs={threatLogs}
            onTogglePolicy={handleTogglePolicy}
            onDeletePolicy={handleDeletePolicy}
            onUploadSuccess={handleUploadSuccess}
          />
        );
      case 'policy':
        return (
          <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6">
            <PolicyUploader onUploadSuccess={handleUploadSuccess} />
            <ActivePolicies
              policies={policies}
              onToggle={handleTogglePolicy}
              onDelete={handleDeletePolicy}
            />
          </div>
        );
      case 'brain':
        return <AgenticBrain />;
      case 'whitelist':
        return <DomainWhitelist />;
      case 'llmshield':
        return <LlmShield />;
      case 'imageredaction':
        return <ImageRedaction />;
      case 'decoyswapper':
        return <DecoySwapper />;
      case 'logs':
        return <InterceptionLogs />;
      case 'alerts':
        return <SpoofingAlerts />;
      case 'reports':
        return <DashboardReports />;
      case 'settings':
        return <DashboardSettings />;
      default:
        return <div className="p-4 text-center font-mono">View Not Found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0d14] text-slate-100 overflow-x-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Simple navbar containing a toggle button for mobile views */}
        <header className="flex items-center justify-between px-6 py-4 bg-[#0a0d14] border-b border-white/5 md:justify-end select-none shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded bg-white/5 border border-white/10 text-gray-400 md:hidden hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Toggle Sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <ShieldStatusBar />
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] pulse-glow-green" />
              <span className="text-gray-400">ENGINE STATUS: <span className="text-white font-bold">ONLINE</span></span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0a0d14] scrollbar-thin">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   App
──────────────────────────────────────────────────────────────────────── */
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

          {/* ── Public: Login ──────────────────────────────────────── */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* ── Protected: Dashboard routes ────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CommandCenter />
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

          {/* ── Fallback: redirect unknown paths to root ───────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </SecurityProvider>
    </BrowserRouter>
  );
}
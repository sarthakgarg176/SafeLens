import React, { useState } from 'react';
import {
  User,
  Key,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  RefreshCw,
  Shield,
  Palette,
  Save,
  Webhook,
  PlusCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Globe
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import { useSecurity } from '../context/SecurityContext';


/* ─── Section heading ──────────────────────────────────────────────────────── */
function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 pb-5 border-b border-border">
      <div className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="font-display font-bold text-sm text-text-main">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── Input field ──────────────────────────────────────────────────────────── */
function SettingsInput({ label, id, type = 'text', value, onChange, disabled = false, placeholder = '' }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-slate-100/50 dark:bg-black/20 text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      />
    </div>
  );
}

/* ─── Toggle switch ────────────────────────────────────────────────────────── */
function Toggle({ enabled, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className="flex items-center gap-2 cursor-pointer group"
    >
      {enabled ? (
        <ToggleRight className="w-8 h-8 text-brand-primary transition-colors" />
      ) : (
        <ToggleLeft className="w-8 h-8 text-slate-400 group-hover:text-slate-500 transition-colors" />
      )}
      <span className="text-xs font-medium text-text-main">{label}</span>
    </button>
  );
}

/* ─── Fake API tokens (static – no need to share globally) ─────────────────── */
const mockTokens = [
  { id: 'tok_1', label: 'Production API Key', value: 'sk-prod-7x2qNbHtWm4LpK9RcEoJzXvYf3sAiDuG' },
  { id: 'tok_2', label: 'Webhook Secret', value: 'whsec_aK2jP8mNqXdRv7tBcZfG0sLhYeWiOuE1' },
];


export default function Settings() {
  /* ── Consume shared context (webhooks + actions) ────────────────────────── */
  const {
    webhooks,
    toggleWebhookStatus,
    addWebhook: contextAddWebhook,
    removeWebhook: contextRemoveWebhook,
  } = useSecurity();

  /* ── Local-only state (profile, tokens, notifications, appearance) ──────── */
  const [profile, setProfile] = useState({
    name: 'Security Admin',
    email: 'admin@privacyshield.ai',
    role: 'Security Admin',
    tier: 'Enterprise',
    orgName: 'Privacy Shield AI'
  });
  const [saved, setSaved] = useState(false);

  /* Token visibility */
  const [visibleTokens, setVisibleTokens] = useState({});
  const [copiedToken, setCopiedToken] = useState(null);

  /* Webhook input fields (local UI only — actual list lives in context) */
  const [newWebhookLabel, setNewWebhookLabel] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  /* Notification toggles */
  const [notifications, setNotifications] = useState({
    newIncident: true,
    takedownUpdate: true,
    complianceAlert: false,
    weeklyDigest: true,
  });

  /* Appearance */
  const [appearance, setAppearance] = useState({
    compactTables: false,
    animationsEnabled: true,
  });

  /* Handlers */
  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleTokenVisibility = (id) =>
    setVisibleTokens((prev) => ({ ...prev, [id]: !prev[id] }));

  const copyToken = (id, value) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const toggleNotification = (key) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleAppearance = (key) =>
    setAppearance((prev) => ({ ...prev, [key]: !prev[key] }));

  const addWebhook = () => {
    contextAddWebhook(newWebhookLabel, newWebhookUrl);
    setNewWebhookLabel('');
    setNewWebhookUrl('');
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Title */}
      <div>
        <h2 className="font-display font-bold text-2xl text-text-main tracking-tight">Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your profile, API credentials, notification triggers, and platform preferences.
        </p>
      </div>

      {/* ── 1. Profile Details ──────────────────────────────────────────────── */}
      <GlassCard hoverEffect={false}>
        <SectionHeading
          icon={User}
          title="Profile Details"
          subtitle="Update your identity and organisational information."
        />
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingsInput
              label="Display Name"
              id="settings-name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
            <SettingsInput
              label="Contact Email"
              id="settings-email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingsInput
              label="Organisation Name"
              id="settings-org"
              value={profile.orgName}
              onChange={(e) => setProfile((p) => ({ ...p, orgName: e.target.value }))}
            />
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Access Tier
              </label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-slate-100/50 dark:bg-black/20">
                <Shield className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-bold text-brand-primary">{profile.tier}</span>
                <span className="ml-auto text-[10px] font-mono font-semibold text-slate-400">{profile.role}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-xs font-semibold hover:shadow-lg hover:shadow-brand-primary/25 transition-all cursor-pointer"
            >
              {saved ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5" /> Saved
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ── 2. API Credentials ─────────────────────────────────────────────── */}
      <GlassCard hoverEffect={false}>
        <SectionHeading
          icon={Key}
          title="API Credentials"
          subtitle="View and copy system authentication tokens. Rotate keys via the security portal."
        />
        <div className="mt-5 space-y-3">
          {mockTokens.map((token) => {
            const isVisible = visibleTokens[token.id];
            const isCopied = copiedToken === token.id;
            const masked = '•'.repeat(32);
            return (
              <div key={token.id} className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  {token.label}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-slate-100/50 dark:bg-black/20 min-w-0">
                    <code className="text-xs font-mono font-bold text-text-main truncate flex-1">
                      {isVisible ? token.value : masked}
                    </code>
                  </div>
                  <button
                    onClick={() => toggleTokenVisibility(token.id)}
                    title={isVisible ? 'Hide token' : 'Show token'}
                    className="p-2.5 rounded-xl border border-border hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-text-main cursor-pointer transition-colors shrink-0"
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToken(token.id, token.value)}
                    title="Copy to clipboard"
                    className="p-2.5 rounded-xl border border-border hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors shrink-0"
                  >
                    {isCopied ? (
                      <CheckCheck className="w-4 h-4 text-risk-safe" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 hover:text-text-main" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          <button className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-primary transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
            Rotate API Keys
          </button>
        </div>
      </GlassCard>

      {/* ── 3. Notification Webhooks ────────────────────────────────────────── */}
      <GlassCard hoverEffect={false}>
        <SectionHeading
          icon={Webhook}
          title="Notification Webhook Triggers"
          subtitle="Configure outbound webhook endpoints for automated alert dispatch."
        />

        <div className="mt-5 space-y-3">
          {/* Existing webhooks */}
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-black/10"
            >
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-main">{wh.label}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">{wh.url}</p>
              </div>
              <Toggle
                enabled={wh.active}
                onToggle={() => toggleWebhookStatus(wh.id)}
                label={wh.active ? 'Active' : 'Paused'}
              />
              <button
                onClick={() => contextRemoveWebhook(wh.id)}
                className="p-1.5 rounded-lg border border-border hover:bg-risk-high/10 hover:border-risk-high/30 hover:text-risk-high text-slate-400 cursor-pointer transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}


          {/* Add new webhook */}
          <div className="pt-2 space-y-2 border-t border-border">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Add New Endpoint</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Endpoint label (e.g. Slack #incidents)"
                value={newWebhookLabel}
                onChange={(e) => setNewWebhookLabel(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-slate-100/50 dark:bg-black/20 text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
              <input
                type="url"
                placeholder="https://hooks.example.com/..."
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-slate-100/50 dark:bg-black/20 text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
              <button
                onClick={addWebhook}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary/10 border border-brand-primary/25 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 cursor-pointer transition-all shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Notification event toggles */}
          <div className="pt-2 space-y-2 border-t border-border">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Alert Events</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(notifications).map(([key, value]) => {
                const labels = {
                  newIncident: 'New Incident Detected',
                  takedownUpdate: 'Takedown Status Update',
                  complianceAlert: 'Compliance Score Drop',
                  weeklyDigest: 'Weekly Digest Summary',
                };
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-black/10"
                  >
                    <span className="text-xs font-medium text-text-main">{labels[key]}</span>
                    <Toggle
                      enabled={value}
                      onToggle={() => toggleNotification(key)}
                      label=""
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── 4. Appearance ──────────────────────────────────────────────────── */}
      <GlassCard hoverEffect={false}>
        <SectionHeading
          icon={Palette}
          title="Appearance & Display"
          subtitle="Adjust visual density and animation preferences."
        />
        <div className="mt-5 space-y-3">
          {[
            { key: 'compactTables', label: 'Compact Table Mode', desc: 'Reduces row height for higher data density in tables.' },
            { key: 'animationsEnabled', label: 'Enable Micro-Animations', desc: 'Enables hover scale effects and motion transitions.' },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-black/10"
            >
              <div>
                <p className="text-xs font-bold text-text-main">{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
              </div>
              <Toggle
                enabled={appearance[key]}
                onToggle={() => toggleAppearance(key)}
                label=""
              />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  Loader2,
  Fingerprint,
  Radar,
  Activity,
  Zap,
} from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const DEMO_EMAIL    = 'admin@cloakai.ai';
const DEMO_PASSWORD = 'Demo@123';

/* ─── Floating icon card — decorative left-panel element ────────────────────── */
function FloatCard({ icon: Icon, label, delay, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className={`absolute flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl ${className}`}
    >
      <div className="p-1.5 rounded-lg bg-brand-primary/20 text-brand-primary">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

/* ─── Validation helpers ─────────────────────────────────────────────────────── */
function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const Maps = navigate;

  /* Form state */
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [remember,    setRemember]    = useState(false);

  /* UI state */
  const [loading,     setLoading]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});   // { email, password }
  const [authError,   setAuthError]   = useState('');

  /* ── Validation ──────────────────────────────────────────────────────────── */
  function validate() {
    const errs = {};
    if (!email.trim())            errs.email    = 'Email address is required.';
    else if (!validateEmail(email)) errs.email  = 'Enter a valid email address.';
    if (!password.trim())         errs.password = 'Password is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── Submit ──────────────────────────────────────────────────────────────── */
  function handleSubmit(e) {
    e.preventDefault();
    setAuthError('');
    if (!validate()) return;

    if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setLoading(true);
      setTimeout(() => {
        const token = `safelens_token_${Date.now()}`;
        localStorage.setItem('cloakai_session_token', token);
        
        // Broadcast the token to the extension's content script targeting current origin
        window.postMessage({ type: 'SAFELENS_AUTH_INIT', token }, window.location.origin);
        console.log('Login: Auth token emitted');
        
        Maps('/');
      }, 1000);

    } else {
      setAuthError('Invalid credentials provided. Please try again.');
    }
  }

  /* ── Clear field error on change ─────────────────────────────────────────── */
  function onEmailChange(v) {
    setEmail(v);
    if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: '' }));
    setAuthError('');
  }
  function onPasswordChange(v) {
    setPassword(v);
    if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: '' }));
    setAuthError('');
  }

  return (
    <div className="min-h-screen flex bg-[#0a0b10] overflow-hidden">

      {/* ════════════════════════════════════════════════════════════════════
          LEFT PANEL — Product Showcase
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-14 overflow-hidden select-none">

        {/* Deep grid mesh background */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,58,237,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radial gradient vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(124,58,237,0.12)_0%,transparent_70%)]" />

        {/* Corner glows */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-secondary/8 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        {/* Floating stat cards */}
        <FloatCard icon={Radar}    label="12 Threats Neutralised"   delay={0.6} className="top-[18%] left-[8%]" />
        <FloatCard icon={Activity} label="Live Vector Monitoring"    delay={0.8} className="top-[28%] right-[5%]" />
        <FloatCard icon={Zap}      label="97.8% Shield Uptime"       delay={1.0} className="bottom-[22%] left-[10%]" />
        <FloatCard icon={ShieldCheck} label="GDPR · HIPAA Compliant" delay={1.2} className="bottom-[13%] right-[6%]" />

        {/* Central shield graphic */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative mb-10"
          >
            {/* Outer pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-10 bg-brand-primary" />
            {/* Shield container */}
            <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-brand-primary/30 to-brand-secondary/20 border border-brand-primary/30 flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.25)] backdrop-blur-sm">
              <Shield className="w-16 h-16 text-brand-primary drop-shadow-[0_0_12px_rgba(124,58,237,0.6)]" strokeWidth={1.5} />
              {/* Inner fingerprint badge */}
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg">
                <Fingerprint className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
            </div>
          </motion.div>

          {/* Logo word-mark */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center gap-2.5 mb-4 justify-center">
              <Lock className="w-5 h-5 text-brand-primary" />
              <span className="font-display font-extrabold text-xl tracking-widest text-slate-100 uppercase">
                Privacy Shield AI
              </span>
            </div>
            <h1 className="font-display font-extrabold text-4xl text-slate-100 leading-tight mb-4">
              Intelligent Asset<br />
              <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                Protection Suite
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-medium">
              Enterprise-grade privacy monitoring, PII redaction, legal takedown enforcement,
              and real-time threat intelligence — unified in a single command console.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-wrap gap-2 justify-center mt-8"
          >
            {['GDPR', 'HIPAA', 'PCI-DSS', 'ISO 27001'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full border border-brand-primary/25 bg-brand-primary/10 text-[11px] font-mono font-bold text-brand-primary tracking-wider"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          RIGHT PANEL — Access Gateway
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14 relative">
        {/* Subtle right-panel glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(99,102,241,0.06)_0%,transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile logo (shown only when left panel is hidden) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Shield className="w-6 h-6 text-brand-primary" />
            <span className="font-display font-extrabold text-lg text-slate-100 tracking-wide uppercase">
              Privacy Shield AI
            </span>
          </div>

          {/* Glass card */}
          <div
            className="glass-card rounded-2xl border border-white/10 p-8 shadow-2xl"
            style={{ backgroundColor: 'rgba(15,17,26,0.75)' }}
          >
            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 rounded-lg bg-brand-primary/15 border border-brand-primary/20">
                  <Lock className="w-4 h-4 text-brand-primary" />
                </div>
                <span className="text-[11px] font-mono font-bold text-brand-primary tracking-widest uppercase">
                  Console Access
                </span>
              </div>
              <h2 className="font-display font-extrabold text-2xl text-slate-100 tracking-tight">
                Sign In to Dashboard
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Authorised personnel only. All access is logged and monitored.
              </p>
            </div>

            {/* Auth error banner */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  key="auth-error"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5 mb-5 p-3 rounded-xl border border-risk-high/30 bg-risk-high/10"
                >
                  <AlertCircle className="w-4 h-4 text-risk-high shrink-0" />
                  <span className="text-xs font-semibold text-risk-high">{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@cloakai.ai"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-black/20 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.email
                        ? 'border-risk-high/50 focus:ring-risk-high/20 focus:border-risk-high'
                        : 'border-white/10 focus:ring-brand-primary/20 focus:border-brand-primary'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-risk-high font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    className={`w-full pl-10 pr-12 py-2.5 text-sm rounded-xl border bg-black/20 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.password
                        ? 'border-risk-high/50 focus:ring-risk-high/20 focus:border-risk-high'
                        : 'border-white/10 focus:ring-brand-primary/20 focus:border-brand-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-risk-high font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border border-white/20 bg-black/30 accent-brand-primary cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors font-medium">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-xs text-brand-primary hover:text-brand-secondary transition-colors font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-sm font-bold tracking-wide hover:shadow-lg hover:shadow-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Access Console
                  </>
                )}
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-6 p-3 rounded-xl border border-white/6 bg-white/[0.03]">
              <p className="text-[11px] text-slate-500 font-mono text-center leading-relaxed">
                <span className="text-slate-400 font-bold">Demo:</span>{' '}
                admin@cloakai.ai &nbsp;/&nbsp; Demo@123
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-600 mt-6 font-medium">
            Privacy Shield AI — Enterprise Cybersecurity Platform
            <br />
            <span className="text-slate-700">All sessions are encrypted end-to-end.</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
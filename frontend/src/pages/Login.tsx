import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, HelpCircle } from 'lucide-react';
import api from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = (role: 'admin' | 'operations' | 'sales') => {
    const map: Record<string, string> = {
      admin: 'admin@opsflow.local',
      operations: 'operations@opsflow.local',
      sales: 'sales@opsflow.local',
    };
    setEmail(map[role]);
    setPassword('OpsFlow@123');
    setError(null);
  };

  return (
    <div style={s.page}>
      {/* ── Main card ── */}
      <div style={s.card}>

        {/* Logo + Title */}
        <div style={s.logoWrap}>
          <div style={s.logoBox}>
            {/* Arrow/flow icon matching screenshot */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <h1 style={s.title}>OpsFlow ERP</h1>
        <p style={s.subtitle}>Enter credentials to access the enterprise<br />platform</p>

        {/* Error */}
        {error && <div style={s.errorBox}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleLogin} style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Email Address</label>
            <div style={s.inputWrap}>
              <Mail size={16} color="#94a3b8" style={s.icon} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                style={s.input}
              />
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <Lock size={16} color="#94a3b8" style={s.icon} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={s.input}
              />
            </div>
          </div>

          <button
            id="sign-in-btn"
            type="submit"
            disabled={loading}
            style={{ ...s.signInBtn, opacity: loading ? 0.75 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={s.demoSectionLabel}>DEMO ACCESS CREDENTIALS</div>
        <div style={s.demoBox}>
          <p style={s.demoHint}>Select a role to autofill:</p>
          <div style={s.chipRow}>
            <button onClick={() => handleAutoFill('admin')} style={s.chip}>Admin</button>
            <button onClick={() => handleAutoFill('operations')} style={s.chip}>Operations</button>
            <button onClick={() => handleAutoFill('sales')} style={s.chip}>Sales</button>
          </div>
          <div style={s.pwHint}>
            <HelpCircle size={13} color="#94a3b8" style={{ marginRight: 5, flexShrink: 0 }} />
            <span>Password: <strong>OpsFlow@123</strong></span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerTitle}>OpsFlow ERP</div>
        <p style={s.footerCopy}>© 2024 OpsFlow ERP. All rights reserved. Precision Enterprise Systems.</p>
        <div style={s.footerLinks}>
          <a href="#" style={s.footerLink}>Security</a>
          <a href="#" style={s.footerLink}>Terms of Service</a>
          <a href="#" style={s.footerLink}>Privacy Policy</a>
        </div>
        <div style={s.footerStatus}>
          <span style={s.statusDot} /> System Status
        </div>
      </footer>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#3b5bdb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    padding: '24px 16px',
    gap: 24,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '36px 28px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Logo
  logoWrap: { marginBottom: 14 },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#3b5bdb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 6px 0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#3b5bdb',
    textAlign: 'center',
    lineHeight: 1.5,
    margin: '0 0 24px 0',
  },

  // Error
  errorBox: {
    width: '100%',
    backgroundColor: '#fff0f0',
    border: '1px solid #ffc9c9',
    color: '#c92a2a',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    boxSizing: 'border-box',
  },

  // Form
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: 12,
    flexShrink: 0,
  },
  input: {
    width: '100%',
    padding: '11px 14px 11px 38px',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  signInBtn: {
    width: '100%',
    padding: '13px',
    backgroundColor: '#3b5bdb',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // Demo section
  demoSectionLabel: {
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    letterSpacing: '0.08em',
    marginBottom: 12,
  },
  demoBox: {
    width: '100%',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  demoHint: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    margin: 0,
  },
  chipRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    padding: '5px 14px',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    border: '1.5px solid #d1d5db',
    color: '#374151',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  pwHint: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    color: '#6b7280',
  },

  // Footer
  footer: {
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#374151',
  },
  footerCopy: {
    fontSize: 11,
    color: '#9ca3af',
    margin: 0,
    lineHeight: 1.6,
  },
  footerLinks: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: '#6b7280',
    textDecoration: 'none',
  },
  footerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusDot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    backgroundColor: '#22c55e',
  },
};

export default Login;

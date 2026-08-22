import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Settings, TrendingUp } from 'lucide-react';
import api from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div style={s.layout}>
            <div style={s.leftPane}>
        <div style={s.logoBox}>
          <div style={s.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <span style={s.logoText}>OpsFlow ERP</span>
        </div>
        
        <div style={s.textContent}>
          <h1 style={s.headline}>
            Move Freight.<br />
            <span style={s.headlineGradient}>Manage Everything.</span>
          </h1>
          <p style={s.subhead}>
            One intelligent platform for warehouse operations, inventory management, dispatch tracking, and transport analytics.
          </p>
        </div>

        <div style={s.footerText}>
          © 2026 OpsFlow ERP Enterprise Terminal. All rights reserved.
        </div>
      </div>

            <div style={s.rightPane}>
        <div style={s.loginCard}>
          <h2 style={s.cardTitle}>Sign In</h2>
          <p style={s.cardSubtitle}>ENTER YOUR TERMINAL CREDENTIALS</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.fieldGroup}>
              <label style={s.label}>USERNAME / EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                style={s.input}
              />
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>PASSWORD</label>
              <div style={s.inputWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={s.input}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                </button>
              </div>
            </div>

            <div style={s.optionsRow}>
              <label style={s.checkboxWrap}>
                <input type="checkbox" style={s.checkbox} />
                <span style={s.checkboxLabel}>Remember Me</span>
              </label>
              <a href="#" style={s.forgotLink}>Forgot Password?</a>
            </div>

            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? 'Logging in...' : 'Login ?'}
            </button>
          </form>

          <div style={s.divider}>
            <span style={s.dividerText}>ROLE TERMINALS</span>
          </div>

          <div style={s.roleGrid}>
            <button type="button" onClick={() => handleAutoFill('admin')} style={s.roleCard}>
              <div style={{...s.roleIconBox, color: '#475569', backgroundColor: '#f1f5f9'}}><User size={18} /></div>
              <span style={s.roleText}>ADMIN</span>
            </button>
            <button type="button" onClick={() => handleAutoFill('operations')} style={s.roleCard}>
              <div style={{...s.roleIconBox, color: '#475569', backgroundColor: '#f1f5f9'}}><Settings size={18} /></div>
              <span style={s.roleText}>OPS</span>
            </button>
            <button type="button" onClick={() => handleAutoFill('sales')} style={s.roleCard}>
              <div style={{...s.roleIconBox, color: '#475569', backgroundColor: '#f1f5f9'}}><TrendingUp size={18} /></div>
              <span style={s.roleText}>SALES</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  },
  leftPane: {
    flex: 1,
    background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '40px 60px',
    color: '#ffffff',
  },
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '10px 20px',
    borderRadius: '12px',
    width: 'fit-content',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  textContent: {
    maxWidth: '560px',
  },
  headline: {
    fontSize: '56px',
    fontWeight: '800',
    lineHeight: 1.1,
    margin: '0 0 20px 0',
  },
  headlineGradient: {
    background: 'linear-gradient(90deg, #f8fafc 0%, #94a3b8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subhead: {
    fontSize: '17px',
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  footerText: {
    fontSize: '12px',
    color: '#64748b',
  },
  rightPane: {
    flex: 1,
    backgroundColor: '#f8fafc',
    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px'
  },
  loginCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '440px',
    padding: '48px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
  },
  cardTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  cardSubtitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    margin: '0 0 32px 0',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
    border: '1px solid #fecaca',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    letterSpacing: '0.5px',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  checkboxWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '14px',
    height: '14px',
  },
  checkboxLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1e293b',
  },
  forgotLink: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    textDecoration: 'none',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#334155',
    background: 'linear-gradient(90deg, #475569 0%, #1e293b 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '12px',
    boxShadow: '0 8px 16px rgba(15, 23, 42, 0.25)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '32px 0 24px',
    borderTop: '1px solid #e2e8f0',
    position: 'relative',
  },
  dividerText: {
    position: 'absolute',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    padding: '0 12px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: '1px',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  roleCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #f1f5f9',
    borderRadius: '12px',
    padding: '16px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    transition: 'transform 0.2s',
  },
  roleIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: '0.5px',
  }
};

export default Login;

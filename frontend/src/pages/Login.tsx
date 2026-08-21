import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Server, ShieldCheck, HelpCircle } from 'lucide-react';
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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('OpsFlow@123');
  };

  return (
    <div style={styles.container}>
      {/* Background Decorative Blurs */}
      <div style={styles.blurTop} />
      <div style={styles.blurBottom} />

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Server size={32} color="#818cf8" />
          </div>
          <h1 style={styles.title}>OpsFlow ERP</h1>
          <p style={styles.subtitle}>Enter credentials to access the enterprise platform</p>
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <ShieldCheck size={18} color="#f87171" style={{ marginRight: 8 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>Demo Access Credentials</span>
        </div>

        <div style={styles.demoSection}>
          <p style={styles.demoLabel}>Select a role to autofill:</p>
          <div style={styles.demoButtonsContainer}>
            <button onClick={() => handleAutoFill('admin@opsflow.local')} style={styles.demoBtn}>
              Admin
            </button>
            <button onClick={() => handleAutoFill('operations@opsflow.local')} style={styles.demoBtn}>
              Operations
            </button>
            <button onClick={() => handleAutoFill('sales@opsflow.local')} style={styles.demoBtn}>
              Sales
            </button>
          </div>
          <div style={styles.credentialsHint}>
            <HelpCircle size={14} color="#64748b" style={{ marginRight: 4 }} />
            <span>Password: <code>OpsFlow@123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090a0f',
    color: '#f8fafc',
    fontFamily: '"Outfit", "Inter", system-ui, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  blurTop: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  blurBottom: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(0,0,0,0) 70%)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '440px',
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    borderRadius: '16px',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    marginBottom: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
    background: 'linear-gradient(to right, #ffffff, #c7d2fe)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f87171',
    fontSize: '14px',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#cbd5e1',
    letterSpacing: '0.5px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(10, 11, 20, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  button: {
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '28px 0',
  },
  dividerText: {
    flex: '1',
    textAlign: 'center',
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  demoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'center',
  },
  demoLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '12px',
  },
  demoButtonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  demoBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  credentialsHint: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#64748b',
  },
};
export default Login;

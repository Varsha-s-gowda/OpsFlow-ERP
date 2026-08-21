import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Shield, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import api, { User } from '../services/api';

export const DashboardPlaceholder: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.getMe();
        setUser(profile.data.user);
      } catch (err) {
        api.clearToken();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    api.clearToken();
    navigate('/login');
  };

  const handleTestEndpoint = async (role: 'admin' | 'operations' | 'sales') => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await api.testRoleEndpoint(role);
      setTestResult({ success: true, message: res.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || `Denied access to ${role} endpoint` });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <Server size={24} color="#818cf8" style={{ marginRight: 10 }} />
          <span style={styles.brandText}>OpsFlow ERP</span>
          <span style={styles.badge}>Phase 1 Foundation</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} style={{ marginRight: 8 }} />
          Sign Out
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          {/* User Profile Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <UserIcon size={20} color="#818cf8" style={{ marginRight: 8 }} />
              <h2 style={styles.cardTitle}>Identity & Authentication</h2>
            </div>
            <div style={styles.profileDetail}>
              <div style={styles.avatar}>
                {user?.name.charAt(0)}
              </div>
              <div>
                <h3 style={styles.profileName}>{user?.name}</h3>
                <p style={styles.profileEmail}>{user?.email}</p>
                <div style={styles.roleTag}>
                  <Shield size={12} style={{ marginRight: 4 }} />
                  {user?.role}
                </div>
              </div>
            </div>
          </div>

          {/* RBAC Verification Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Shield size={20} color="#818cf8" style={{ marginRight: 8 }} />
              <h2 style={styles.cardTitle}>RBAC Middleware Test Bench</h2>
            </div>
            <p style={styles.cardDescription}>
              Trigger backend API calls with your active JSON Web Token to verify role-based middleware functionality.
            </p>

            <div style={styles.testBtnGroup}>
              <button
                onClick={() => handleTestEndpoint('admin')}
                disabled={testLoading}
                style={{ ...styles.testBtn, ...styles.adminBtn }}
              >
                Test Admin Auth
              </button>
              <button
                onClick={() => handleTestEndpoint('operations')}
                disabled={testLoading}
                style={{ ...styles.testBtn, ...styles.opsBtn }}
              >
                Test Operations Auth
              </button>
              <button
                onClick={() => handleTestEndpoint('sales')}
                disabled={testLoading}
                style={{ ...styles.testBtn, ...styles.salesBtn }}
              >
                Test Sales Auth
              </button>
            </div>

            {testResult && (
              <div
                style={{
                  ...styles.resultBox,
                  backgroundColor: testResult.success ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: testResult.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {testResult.success ? (
                    <CheckCircle2 size={18} color="#4ade80" style={{ marginRight: 8, marginTop: 2 }} />
                  ) : (
                    <AlertCircle size={18} color="#f87171" style={{ marginRight: 8, marginTop: 2 }} />
                  )}
                  <div>
                    <h4 style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: testResult.success ? '#4ade80' : '#f87171',
                      margin: '0 0 4px 0'
                    }}>
                      {testResult.success ? 'HTTP 200: Access Granted' : 'HTTP 403: Forbidden'}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#cbd5e1',
                      lineHeight: '1.4'
                    }}>
                      {testResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#090a0f',
    color: '#f8fafc',
    fontFamily: '"Outfit", "Inter", system-ui, sans-serif',
  },
  loadingContainer: {
    minHeight: '100vh',
    backgroundColor: '#090a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: '70px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    backdropFilter: 'blur(10px)',
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
  },
  brandText: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    marginRight: '12px',
  },
  badge: {
    fontSize: '11px',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#a5b4fc',
    padding: '3px 8px',
    borderRadius: '10px',
    fontWeight: '600',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  main: {
    padding: '40px 32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
  },
  card: {
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    padding: '32px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  cardDescription: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  profileDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
  },
  profileName: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  profileEmail: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0 0 12px 0',
  },
  roleTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    color: '#a5b4fc',
    fontSize: '12px',
    fontWeight: '600',
  },
  testBtnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  testBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    paddingLeft: '16px',
  },
  adminBtn: {
    borderLeft: '4px solid #f43f5e',
  },
  opsBtn: {
    borderLeft: '4px solid #10b981',
  },
  salesBtn: {
    borderLeft: '4px solid #3b82f6',
  },
  resultBox: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '16px',
  },
};
export default DashboardPlaceholder;

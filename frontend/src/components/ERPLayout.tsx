import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Package,
  ClipboardList,
  RefreshCw,
  ShoppingBag,
  LogOut,
  User,
  LayoutDashboard,
  Bell,
  Settings,
  ChevronRight
} from 'lucide-react';
import api, { User as UserType } from '../services/api';

interface ERPLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export const ERPLayout: React.FC<ERPLayoutProps> = ({ children, pageTitle }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.getMe();
        setUser(res.data.user);
      } catch {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    api.clearToken();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard',       path: '/',            icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'OPERATIONS', 'SALES'] },
    { name: 'Inventory',       path: '/inventory',   icon: <Package size={18} />,         roles: ['ADMIN', 'OPERATIONS', 'SALES'] },
    { name: 'Work Orders',     path: '/work-orders', icon: <ClipboardList size={18} />,   roles: ['ADMIN', 'OPERATIONS'] },
    { name: 'Transfers',       path: '/transfers',   icon: <RefreshCw size={18} />,       roles: ['ADMIN', 'OPERATIONS'] },
    { name: 'Customer Orders', path: '/orders',      icon: <ShoppingBag size={18} />,     roles: ['ADMIN', 'SALES'] },
  ];

  const allowedItems = menuItems.filter(item => user && item.roles.includes(user.role));

  // Role subtitle shown under brand name
  const roleLabel: Record<string, string> = {
    ADMIN: 'Admin Controls',
    OPERATIONS: 'Warehouse Control',
    SALES: 'Sales Control',
  };

  return (
    <div style={s.shell}>
      <style>{`
        body { margin: 0; background: #f1f5f9; overflow-x: hidden; }
        a { text-decoration: none; }
        .nav-link-item:hover { background: #f1f5f9 !important; color: #1e293b !important; }
        .logout-btn:hover { background: #fee2e2 !important; color: #dc2626 !important; }
        .header-icon-btn:hover { background: #f1f5f9 !important; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div>
            <div style={s.brandName}>OpsFlow ERP</div>
            <div style={s.brandSub}>{user ? roleLabel[user.role] : 'Loading…'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          {allowedItems.map((item, i) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={i}
                to={item.path}
                className="nav-link-item"
                style={{
                  ...s.navLink,
                  backgroundColor: active ? '#334155' : 'transparent',
                  color: active ? '#ffffff' : '#475569',
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span style={{ marginRight: 10, display: 'flex', alignItems: 'center', opacity: active ? 1 : 0.7 }}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        {user && (
          <div style={s.userSection}>
            <div style={s.userAvatar}>
              <User size={16} color="#334155" />
            </div>
            <div style={s.userInfo}>
              <div style={s.userName}>{user.name}</div>
              <div style={s.userRole}>{user.role}</div>
            </div>
            <button
              className="logout-btn"
              title="Sign Out"
              onClick={handleLogout}
              style={s.logoutBtn}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* ── Main area ── */}
      <div style={s.main}>
        {/* Top header */}
        <header style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.breadcrumb}>
              <span style={s.breadHome}>Platform</span>
              <ChevronRight size={12} color="#94a3b8" />
              <span style={s.breadCurrent}>{pageTitle}</span>
            </div>
            <h2 style={s.pageTitle}>{pageTitle}</h2>
          </div>

          <div style={s.headerRight}>
            <div style={s.statusBadge}>
              <span style={s.statusDot} />
              <span style={s.statusText}>Systems Connected</span>
            </div>
            <button className="header-icon-btn" style={s.iconBtn}><Bell size={18} color="#64748b" /></button>
            <button className="header-icon-btn" style={s.iconBtn} onClick={() => navigate('/settings')}><Settings size={18} color="#64748b" /></button>
            {user && (
              <div style={s.headerAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={s.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  },

  // Sidebar
  sidebar: {
    width: 220,
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  brand: {
    height: 64,
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 18px',
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  nav: {
    flex: 1,
    padding: '16px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 12px',
    borderRadius: 8,
    fontSize: 13,
    color: '#475569',
    transition: 'all 0.15s',
  },
  userSection: {
    borderTop: '1px solid #e2e8f0',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1.5px solid #cbd5e1',
  },
  userInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  userName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: 10,
    color: '#334155',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '6px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
  },

  // Main area
  main: {
    marginLeft: 220,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    height: 64,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
  },
  breadHome: { color: '#94a3b8', fontWeight: 500 },
  breadCurrent: { color: '#334155', fontWeight: 600 },
  pageTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
    lineHeight: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 20,
    padding: '5px 12px',
    marginRight: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    display: 'inline-block',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 600,
    color: '#16a34a',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    backgroundColor: '#334155',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: '28px 32px',
    overflowY: 'auto',
  },
};

export default ERPLayout;

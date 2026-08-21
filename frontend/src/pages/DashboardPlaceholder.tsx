import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  ClipboardList,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import api, { User } from '../services/api';
import ERPLayout from '../components/ERPLayout';

export const DashboardPlaceholder: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInventory: 0,
    availableStock: 0,
    reservedStock: 0,
    activeWorkOrders: 0,
    pendingTransfers: 0,
    pendingCustomerOrders: 0
  });

  const [recentWorkOrders, setRecentWorkOrders] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile.data.user);

      // Fetch lists for metrics calculation
      const role = profile.data.user.role;

      let inventoryList: any[] = [];
      let workOrdersList: any[] = [];
      let transfersList: any[] = [];
      let ordersList: any[] = [];

      // Safe conditional fetching matching role visibility
      const fetches: Promise<any>[] = [];
      
      if (role === 'ADMIN' || role === 'OPERATIONS') {
        fetches.push(api.getInventory().then(res => inventoryList = res.data || []));
        fetches.push(api.getWorkOrders().then(res => workOrdersList = res.data || []));
        fetches.push(api.getTransfers().then(res => transfersList = res.data || []));
      }
      if (role === 'ADMIN' || role === 'SALES') {
        fetches.push(api.getOrders().then(res => ordersList = res.data || []));
      }

      await Promise.all(fetches);

      // Calculate stock stats
      const totalInventory = inventoryList.reduce((acc, curr) => acc + curr.physicalQuantity, 0);
      const reservedStock = inventoryList.reduce((acc, curr) => acc + curr.reservedQuantity, 0);
      const availableStock = totalInventory - reservedStock;

      // Filter lists
      const activeWorkOrders = workOrdersList.filter(wo => wo.status !== 'COMPLETED').length;
      const pendingTransfers = transfersList.filter(tr => tr.status !== 'RECEIVED').length;
      const pendingCustomerOrders = ordersList.filter(o => o.status === 'CONFIRMED').length;

      setStats({
        totalInventory,
        availableStock,
        reservedStock,
        activeWorkOrders,
        pendingTransfers,
        pendingCustomerOrders
      });

      // Filter low stock
      const lowStock = inventoryList.filter(inv => (inv.physicalQuantity - inv.reservedQuantity) < 15);
      setLowStockItems(lowStock.slice(0, 5));

      setRecentWorkOrders(workOrdersList.slice(0, 5));
      setRecentTransfers(transfersList.slice(0, 5));
      setRecentOrders(ordersList.slice(0, 5));

    } catch (err) {
      console.error('Failed to retrieve dashboard figures', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" />
      </div>
    );
  }

  const role = user?.role || 'OPERATIONS';

  return (
    <ERPLayout pageTitle="Operations Dashboard">
      <div style={styles.dashboardContainer}>
        {/* Welcome Section */}
        <div style={styles.welcomeBanner}>
          <div>
            <h3 style={styles.welcomeTitle}>Welcome back, {user?.name}</h3>
            <p style={styles.welcomeSub}>
              Role: <strong style={{ color: '#818cf8' }}>{role}</strong> &bull; Location scope: Global Management
            </p>
          </div>
          <div style={styles.bannerStatus}>
            <UserCheck size={18} color="#818cf8" style={{ marginRight: 8 }} />
            <span>Session Secure</span>
          </div>
        </div>

        {/* Dashboard KPI Grid */}
        <div style={styles.kpiGrid}>
          {/* Card 1: Total Inventory */}
          {(role === 'ADMIN' || role === 'OPERATIONS') && (
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiLabel}>Total Physical Stock</span>
                <div style={styles.kpiIconBox}><Package size={20} color="#a5b4fc" /></div>
              </div>
              <div style={styles.kpiValue}>{stats.totalInventory}</div>
              <div style={styles.kpiIndicator}>
                <TrendingUp size={14} color="#4ade80" style={{ marginRight: 4 }} />
                <span style={{ color: '#4ade80', fontWeight: '600' }}>Active items ledger</span>
              </div>
            </div>
          )}

          {/* Card 2: Available Stock */}
          {(role === 'ADMIN' || role === 'OPERATIONS') && (
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiLabel}>Available Stock</span>
                <div style={styles.kpiIconBox}><Package size={20} color="#34d399" /></div>
              </div>
              <div style={styles.kpiValue}>{stats.availableStock}</div>
              <div style={styles.kpiIndicator}>
                <span style={{ color: '#34d399', fontWeight: '600' }}>Unreserved pool</span>
              </div>
            </div>
          )}

          {/* Card 3: Reserved Stock */}
          {(role === 'ADMIN' || role === 'OPERATIONS' || role === 'SALES') && (
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiLabel}>Reserved Stock</span>
                <div style={styles.kpiIconBox}><ShoppingBag size={20} color="#fbbf24" /></div>
              </div>
              <div style={styles.kpiValue}>{stats.reservedStock}</div>
              <div style={styles.kpiIndicator}>
                <span style={{ color: '#fbbf24', fontWeight: '600' }}>Customer reservations</span>
              </div>
            </div>
          )}

          {/* Card 4: Active Work Orders */}
          {(role === 'ADMIN' || role === 'OPERATIONS') && (
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiLabel}>Active Work Orders</span>
                <div style={styles.kpiIconBox}><ClipboardList size={20} color="#60a5fa" /></div>
              </div>
              <div style={styles.kpiValue}>{stats.activeWorkOrders}</div>
              <div style={styles.kpiIndicator}>
                <span style={{ color: '#60a5fa', fontWeight: '600' }}>Pending completions</span>
              </div>
            </div>
          )}

          {/* Card 5: Pending Transfers */}
          {(role === 'ADMIN' || role === 'OPERATIONS') && (
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiLabel}>Pending Stock Transfers</span>
                <div style={styles.kpiIconBox}><RefreshCw size={20} color="#a78bfa" /></div>
              </div>
              <div style={styles.kpiValue}>{stats.pendingTransfers}</div>
              <div style={styles.kpiIndicator}>
                <span style={{ color: '#a78bfa', fontWeight: '600' }}>In transit</span>
              </div>
            </div>
          )}

          {/* Card 6: Pending Customer Orders */}
          {(role === 'ADMIN' || role === 'SALES') && (
            <div style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiLabel}>Confirmed Orders</span>
                <div style={styles.kpiIconBox}><ShoppingBag size={20} color="#f472b6" /></div>
              </div>
              <div style={styles.kpiValue}>{stats.pendingCustomerOrders}</div>
              <div style={styles.kpiIndicator}>
                <span style={{ color: '#f472b6', fontWeight: '600' }}>Pending fulfillment</span>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Panels */}
        <div style={styles.panelsGrid}>
          {/* Left / Primary Column */}
          <div style={styles.panelsColPrimary}>
            {/* Recent Work Orders (Admin/Operations) */}
            {(role === 'ADMIN' || role === 'OPERATIONS') && (
              <div style={styles.panelCard}>
                <div style={styles.panelHeader}>
                  <h4 style={styles.panelTitle}>Active Work Orders</h4>
                  <Link to="/work-orders" style={styles.panelLink}>
                    View All <ArrowRight size={14} style={{ marginLeft: 4 }} />
                  </Link>
                </div>
                {recentWorkOrders.length === 0 ? (
                  <p style={styles.emptyText}>No work orders currently active.</p>
                ) : (
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>WO ID</th>
                          <th style={styles.th}>Item</th>
                          <th style={styles.th}>Shortage</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentWorkOrders.map((wo) => (
                          <tr key={wo.id} style={styles.tr}>
                            <td style={styles.tdBold}>{wo.workOrderId}</td>
                            <td style={styles.td}>{wo.item?.name}</td>
                            <td style={styles.td}>
                              <span style={{ color: wo.shortage > 0 ? '#f87171' : '#4ade80', fontWeight: '600' }}>
                                {wo.shortage > 0 ? `${wo.shortage} units` : 'No shortage'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={styles.badge}>{wo.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Recent Stock Transfers (Admin/Operations) */}
            {(role === 'ADMIN' || role === 'OPERATIONS') && (
              <div style={styles.panelCard}>
                <div style={styles.panelHeader}>
                  <h4 style={styles.panelTitle}>Stock Transfers</h4>
                  <Link to="/transfers" style={styles.panelLink}>
                    View All <ArrowRight size={14} style={{ marginLeft: 4 }} />
                  </Link>
                </div>
                {recentTransfers.length === 0 ? (
                  <p style={styles.emptyText}>No transfers requested.</p>
                ) : (
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Transfer ID</th>
                          <th style={styles.th}>Item</th>
                          <th style={styles.th}>Qty</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransfers.map((tr) => (
                          <tr key={tr.id} style={styles.tr}>
                            <td style={styles.tdBold}>{tr.transferId}</td>
                            <td style={styles.td}>{tr.item?.name}</td>
                            <td style={styles.td}>{tr.quantity}</td>
                            <td style={styles.td}>
                              <span style={styles.badge}>{tr.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Recent Orders (Admin/Sales) */}
            {(role === 'ADMIN' || role === 'SALES') && (
              <div style={styles.panelCard}>
                <div style={styles.panelHeader}>
                  <h4 style={styles.panelTitle}>Recent Customer Orders</h4>
                  <Link to="/orders" style={styles.panelLink}>
                    View All <ArrowRight size={14} style={{ marginLeft: 4 }} />
                  </Link>
                </div>
                {recentOrders.length === 0 ? (
                  <p style={styles.emptyText}>No customer orders recorded.</p>
                ) : (
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Order ID</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Items Count</th>
                          <th style={styles.th}>Creator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((o) => (
                          <tr key={o.id} style={styles.tr}>
                            <td style={styles.tdBold}>{o.orderId}</td>
                            <td style={styles.td}>
                              <span style={{ color: '#4ade80', fontWeight: '600' }}>{o.status}</span>
                            </td>
                            <td style={styles.td}>{o.items?.length || 0}</td>
                            <td style={styles.td}>{o.createdBy?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right / Secondary Column */}
          <div style={styles.panelsColSecondary}>
            {/* Stock Alerts (Admin/Operations) */}
            {(role === 'ADMIN' || role === 'OPERATIONS') && (
              <div style={styles.panelCard}>
                <div style={styles.panelHeader}>
                  <h4 style={styles.panelTitle}>Low Stock Indicators</h4>
                </div>
                {lowStockItems.length === 0 ? (
                  <p style={styles.successText}>All stock lines healthy.</p>
                ) : (
                  <div style={styles.alertList}>
                    {lowStockItems.map((inv) => {
                      const av = inv.physicalQuantity - inv.reservedQuantity;
                      return (
                        <div key={inv.id} style={styles.alertItem}>
                          <AlertTriangle size={18} color="#fbbf24" style={{ marginRight: 10, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={styles.alertItemTitle}>{inv.item?.name} ({inv.location?.name})</div>
                            <div style={styles.alertItemDetail}>
                              Batch: {inv.batch?.batchNumber} &bull; Available: <strong>{av}</strong> units
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Panel */}
            <div style={styles.panelCard}>
              <div style={styles.panelHeader}>
                <h4 style={styles.panelTitle}>ERP Quick Links</h4>
              </div>
              <div style={styles.actionsList}>
                {(role === 'ADMIN' || role === 'OPERATIONS') && (
                  <button onClick={() => navigate('/inventory')} className="btn-hover" style={styles.actionBtn}>
                    Manage Inventory
                  </button>
                )}
                {role === 'ADMIN' && (
                  <button onClick={() => navigate('/work-orders')} className="btn-hover" style={styles.actionBtn}>
                    Schedule Work Order
                  </button>
                )}
                {(role === 'ADMIN' || role === 'OPERATIONS') && (
                  <button onClick={() => navigate('/transfers')} className="btn-hover" style={styles.actionBtn}>
                    Initiate Stock Transfer
                  </button>
                )}
                {(role === 'ADMIN' || role === 'SALES') && (
                  <button onClick={() => navigate('/orders')} className="btn-hover" style={styles.actionBtn}>
                    Create Customer Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ERPLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  welcomeBanner: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },
  welcomeTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 6px 0',
    color: '#1e293b'
  },
  welcomeSub: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  bannerStatus: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#3b5bdb',
    border: '1px solid #bfdbfe'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px'
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },
  kpiHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px'
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  kpiIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #bfdbfe'
  },
  kpiValue: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '4px 0 0 0'
  },
  kpiIndicator: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    color: '#94a3b8'
  },
  panelsGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  panelsColPrimary: {
    flex: '2 1 600px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  panelsColSecondary: {
    flex: '1 1 280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  panelCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: '700',
    margin: 0,
    color: '#1e293b'
  },
  panelLink: {
    fontSize: '13px',
    color: '#3b5bdb',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
    textAlign: 'center',
    padding: '16px 0'
  },
  successText: {
    fontSize: '13px',
    color: '#16a34a',
    margin: 0,
    fontWeight: '600',
    textAlign: 'center',
    padding: '16px 0'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px'
  },
  th: {
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  tr: {
    borderBottom: '1px solid #f8fafc'
  },
  td: {
    padding: '11px 12px',
    color: '#475569'
  },
  tdBold: {
    padding: '11px 12px',
    fontWeight: '700',
    color: '#1e293b'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    fontSize: '10px',
    fontWeight: '700',
    color: '#475569'
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px'
  },
  alertItemTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#92400e'
  },
  alertItemDetail: {
    fontSize: '11px',
    color: '#78716c',
    marginTop: '2px'
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  actionBtn: {
    width: '100%',
    padding: '11px 14px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#374151',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
};
export default DashboardPlaceholder;


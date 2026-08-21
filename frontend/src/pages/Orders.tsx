import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ShoppingBag, ShieldAlert } from 'lucide-react';
import api, { User } from '../services/api';

interface DraftItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export const Orders: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form & Draft Order State
  const [showAddForm, setShowAddForm] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  const fetchAllData = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile.data.user);

      const [ordersRes, itemsRes] = await Promise.all([
        api.getOrders(),
        api.getItems(),
      ]);

      setOrders(ordersRes.data || []);
      setItems(itemsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer orders data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddDraftItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    const selectedItem = items.find((i) => i.id === selectedItemId);
    if (!selectedItem) return;

    // Check if item is already in draft list, update quantity
    const existingIndex = draftItems.findIndex((d) => d.itemId === selectedItemId);
    if (existingIndex > -1) {
      const updated = [...draftItems];
      updated[existingIndex].quantity += Number(quantity);
      setDraftItems(updated);
    } else {
      setDraftItems([
        ...draftItems,
        {
          itemId: selectedItemId,
          itemName: selectedItem.name,
          quantity: Number(quantity),
        },
      ]);
    }

    // Reset line state
    setSelectedItemId('');
    setQuantity(1);
  };

  const handleRemoveDraftItem = (index: number) => {
    const updated = [...draftItems];
    updated.splice(index, 1);
    setDraftItems(updated);
  };

  const handleSubmitOrder = async () => {
    setError('');
    setSuccess('');

    if (!orderId.trim()) {
      setError('Order ID is required');
      return;
    }
    if (draftItems.length === 0) {
      setError('Add at least one item to the order');
      return;
    }

    try {
      await api.createOrder({
        orderId: orderId.trim(),
        items: draftItems.map((d) => ({
          itemId: d.itemId,
          quantity: d.quantity,
        })),
      });

      setSuccess('Customer Order submitted and stock reserved successfully!');
      setShowAddForm(false);
      setOrderId('');
      setDraftItems([]);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit customer order');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" />
      </div>
    );
  }

  const isSales = user?.role === 'SALES';
  const isAuthorizedToView = user?.role === 'SALES' || user?.role === 'ADMIN';

  if (!isAuthorizedToView) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <Link to="/" style={styles.backLink}>
            <ArrowLeft size={18} style={{ marginRight: 8 }} />
            Dashboard
          </Link>
        </header>
        <main style={styles.main}>
          <div style={styles.warningBox}>
            <ShieldAlert size={20} style={{ marginRight: 10 }} />
            Your current role does not have authorization to view customer orders.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <Link to="/" style={styles.backLink}>
            <ArrowLeft size={18} style={{ marginRight: 8 }} />
            Dashboard
          </Link>
          <ShoppingBag size={24} color="#818cf8" style={{ marginRight: 10, marginLeft: 20 }} />
          <span style={styles.brandText}>OpsFlow ERP</span>
          <span style={styles.badge}>Customer Orders</span>
        </div>
        <div style={styles.userRole}>
          Role: <strong style={{ color: '#818cf8', marginLeft: 4 }}>{user?.role}</strong>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>Customer Orders</h1>
          {isSales && !showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={styles.primaryBtn}>
              <Plus size={16} style={{ marginRight: 6 }} /> Create New Order
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {/* Add Customer Order Panel */}
        {isSales && showAddForm && (
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>New Customer Order Request</h2>

            <div style={{ ...styles.formGroup, marginBottom: '24px' }}>
              <label style={styles.label}>Order ID (Unique alphanumeric string)</label>
              <input
                type="text"
                placeholder="e.g., ORD-2026-99"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            {/* Add Line Item form */}
            <div style={styles.lineFormCard}>
              <h3 style={styles.subCardTitle}>Add Order Item</h3>
              <form onSubmit={handleAddDraftItem} style={styles.inlineForm}>
                <div style={{ ...styles.formGroup, flex: 2 }}>
                  <label style={styles.label}>Item</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose Item --</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    style={styles.input}
                    required
                  />
                </div>

                <button type="submit" style={styles.addLineBtn}>
                  Add Item
                </button>
              </form>
            </div>

            {/* Draft Items List */}
            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
              <h3 style={{ ...styles.subCardTitle, marginBottom: '12px' }}>Order Review List</h3>
              {draftItems.length === 0 ? (
                <p style={styles.emptyText}>No items added to this order draft yet.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Item Name</th>
                        <th style={styles.th}>Quantity</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftItems.map((draft, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={styles.td}>{draft.itemName}</td>
                          <td style={styles.td}>{draft.quantity}</td>
                          <td style={styles.td}>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftItem(idx)}
                              style={styles.deleteBtn}
                            >
                              <Trash2 size={14} style={{ marginRight: 4 }} /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={styles.btnRow}>
              <button onClick={handleSubmitOrder} style={styles.primaryBtn}>
                Submit and Reserve Stock
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setOrderId('');
                  setDraftItems([]);
                }}
                style={styles.secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Customer Orders Ledger */}
        <div style={styles.card}>
          <h2 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Orders Ledger</h2>
          {orders.length === 0 ? (
            <p style={styles.emptyText}>No customer orders found.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ordered Items</th>
                    <th style={styles.th}>Creator</th>
                    <th style={styles.th}>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => {
                    const statusColor = ord.status === 'CONFIRMED' ? '#4ade80' : '#f87171';
                    return (
                      <tr key={ord.id} style={styles.tr}>
                        <td style={styles.tdId}>{ord.orderId}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: `${statusColor}1A`,
                              border: `1px solid ${statusColor}4D`,
                              color: statusColor,
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <ul style={styles.itemList}>
                            {ord.items?.map((it: any, i: number) => (
                              <li key={i}>
                                {it.itemName} &times; <strong>{it.quantity}</strong>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td style={styles.td}>{ord.createdBy?.name || 'Unknown'}</td>
                        <td style={styles.tdTime}>
                          {new Date(ord.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
  },
  userRole: {
    fontSize: '13px',
    color: '#cbd5e1',
  },
  main: {
    padding: '40px 32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    margin: 0,
    background: 'linear-gradient(to right, #ffffff, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  card: {
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '32px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 10px 0',
  },
  subCardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#cbd5e1',
    margin: '0 0 8px 0',
  },
  formCard: {
    background: 'rgba(99, 102, 241, 0.04)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '32px',
  },
  lineFormCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inlineForm: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
  },
  formGroupHalf: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  select: {
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
    fontSize: '14px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
    fontSize: '14px',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondaryBtn: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addLineBtn: {
    padding: '12px 24px',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '8px',
    color: '#a5b4fc',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#f87171',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
  },
  errorBox: {
    padding: '16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
  },
  successBox: {
    padding: '16px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#4ade80',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    border: '1px solid rgba(234, 179, 8, 0.2)',
    color: '#fde047',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: '14px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  th: {
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  td: {
    padding: '16px',
  },
  tdId: {
    padding: '16px',
    fontWeight: '600',
    color: '#fbbf24',
  },
  tdTime: {
    padding: '16px',
    color: '#94a3b8',
  },
  itemList: {
    margin: 0,
    paddingLeft: '20px',
  },
};
export default Orders;

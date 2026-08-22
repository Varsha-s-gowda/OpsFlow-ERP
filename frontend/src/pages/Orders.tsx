import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ShieldAlert, Search } from 'lucide-react';
import api, { User } from '../services/api';
import ERPLayout from '../components/ERPLayout';

interface DraftItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export const Orders: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]); // For live stock summary checks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

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

      const [ordersRes, itemsRes, invRes] = await Promise.all([
        api.getOrders(),
        api.getItems(),
        api.getInventory()
      ]);

      setOrders(ordersRes.data || []);
      setItems(itemsRes.data || []);
      setInventory(invRes.data || []);
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

  // Live stock pool calculation for selected item
  const selectedItemInv = inventory.filter((inv) => inv.itemId === selectedItemId);
  const totalAvailable = selectedItemInv.reduce(
    (sum, inv) => sum + (inv.physicalQuantity - inv.reservedQuantity),
    0
  );
  const exceedsStock = quantity > totalAvailable;

  // Apply filters
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !searchTerm ||
      o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items?.some((it: any) => it.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <ERPLayout pageTitle="Customer Orders & Reservations">
      <div style={styles.viewContainer}>
        {/* Title Row */}
        <div style={styles.titleRow}>
          <div>
            <p style={styles.subtitleText}>Create orders and reserve available physical stock atomically.</p>
          </div>
          {isSales && !showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={styles.primaryBtn}>
              <Plus size={16} style={{ marginRight: 6 }} /> Create New Order
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {!isAuthorizedToView && (
          <div style={styles.warningBox}>
            <ShieldAlert size={20} style={{ marginRight: 10 }} />
            Your current role does not have authorization to view customer orders.
          </div>
        )}

        {/* Filter Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
            <input
              type="text"
              placeholder="Search by Order ID or Item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Add Customer Order Panel */}
        {isSales && showAddForm && (
          <div style={styles.formCard}>
            <h3 style={styles.cardTitle}>New Customer Order Request</h3>

            <div style={{ ...styles.formGroup, marginBottom: '24px' }}>
              <label style={styles.label}>Order ID (Unique alphanumeric string)</label>
              <input
                type="text"
                placeholder="e.g., 001"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            {/* Add Line Item form */}
            <div style={styles.lineFormCard}>
              <h4 style={styles.subCardTitle}>Add Order Item</h4>
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

              {/* Real-time stock reservation status indicator */}
              {selectedItemId && (
                <div style={styles.stockStatusPreview}>
                  <span style={{ color: exceedsStock ? '#f87171' : '#34d399', fontWeight: '600' }}>
                    {exceedsStock
                      ? `Insufficient stock. Requested: ${quantity}, Available: ${totalAvailable}`
                      : `Available Stock: ${totalAvailable}`}
                  </span>
                </div>
              )}
            </div>

            {/* Draft Items List */}
            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
              <h4 style={{ ...styles.subCardTitle, marginBottom: '12px' }}>Order Review List</h4>
              {draftItems.length === 0 ? (
                <p style={styles.emptyText}>No items added to this order draft yet.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Item Name</th>
                        <th style={styles.thRight}>Quantity</th>
                        <th style={styles.thRight}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftItems.map((draft, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={styles.td}>{draft.itemName}</td>
                          <td style={styles.tdQty}>{draft.quantity}</td>
                          <td style={styles.tdRight}>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftItem(idx)}
                              style={styles.deleteBtn}
                            >
                              <Trash2 size={13} style={{ marginRight: 4 }} /> Remove
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
              <button onClick={handleSubmitOrder} style={styles.submitBtn}>
                Submit and Reserve Stock
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setOrderId('');
                  setDraftItems([]);
                }}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Customer Orders Ledger */}
        <div style={styles.card}>
          {filteredOrders.length === 0 ? (
            <div style={styles.emptyContainer}>
              <p style={styles.emptyText}>No customer orders recorded.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ordered Items</th>
                    <th style={styles.th}>Creator</th>
                    <th style={styles.thRight}>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => {
                    const statusColor = ord.status === 'CONFIRMED' ? '#475569' : '#ef4444';
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
                              fontSize: '11px',
                              fontWeight: '700',
                            }}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <ul style={styles.itemList}>
                            {ord.items?.map((it: any, i: number) => (
                              <li key={i} style={styles.itemLi}>
                                {it.itemName} &times; <strong style={{ color: '#1e293b' }}>{it.quantity}</strong>
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
      </div>
    </ERPLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px'
  },
  subtitleText: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  toolbar: {
    backgroundColor: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchBox: {
    flex: 1,
    minWidth: '260px',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#1e293b',
    padding: '10px 0',
    fontSize: '13px',
    outline: 'none'
  },
  primaryBtn: {
      backgroundColor: '#334155',
      border: 'none',
      color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center'
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 20px 0',
    color: '#1e293b'
  },
  subCardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 10px 0'
  },
  formCard: {
    backgroundColor: '#fff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '24px'
  },
  lineFormCard: {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inlineForm: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap'
  },
  stockStatusPreview: {
    marginTop: '10px',
    fontSize: '12px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b'
  },
  select: {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    color: '#1e293b',
    padding: '10px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  input: {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    color: '#1e293b',
    padding: '10px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  addLineBtn: {
    backgroundColor: 'rgba(71, 85, 105, 0.12)',
    border: '1px solid rgba(71, 85, 105, 0.25)',
    borderRadius: '8px',
    color: '#334155',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center'
  },
  btnRow: {
    display: 'flex',
    gap: '12px'
  },
  submitBtn: {
      backgroundColor: '#334155',
      border: 'none',
      borderRadius: '8px',
      color: '#ffffff',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    color: '#64748b',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px'
  },
  successBox: {
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px'
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
  emptyContainer: {
    padding: '40px 0',
    textAlign: 'center'
  },
  emptyText: {
    color: '#64748b',
    fontSize: '13px',
    margin: 0
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
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    color: '#64748b',
    fontWeight: '600'
  },
  thRight: {
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'right'
  },
  tr: {
    borderBottom: '1px solid #f8fafc',
  },
  td: {
      padding: '12px 16px',
      color: '#475569'
    },
  tdRight: {
      padding: '12px 16px',
      textAlign: 'right',
      color: '#475569'
    },
  tdId: {
    padding: '12px 16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  tdQty: {
    padding: '12px 16px',
    textAlign: 'right',
    color: '#374151'
  },
  tdTime: {
    padding: '12px 16px',
    textAlign: 'right',
    color: '#64748b'
  },
  itemList: {
    margin: 0,
    paddingLeft: '16px'
  },
  itemLi: {
    color: '#64748b',
    marginBottom: '4px'
  }
};
export default Orders;


import React, { useEffect, useState } from 'react';
import { Plus, ShieldAlert, Search, ArrowRight, Check } from 'lucide-react';
import api, { User } from '../services/api';
import ERPLayout from '../components/ERPLayout';

export const Transfers: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [transferId, setTransferId] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const fetchAllData = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile.data.user);

      const [trRes, itemRes, locRes, batchRes] = await Promise.all([
        api.getTransfers(),
        api.getItems(),
        api.getLocations(),
        api.getBatches(),
      ]);

      setTransfers(trRes.data || []);
      setItems(itemRes.data || []);
      setLocations(locRes.data || []);
      setBatches(batchRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transfer records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createTransfer({
        transferId,
        sourceLocationId,
        destinationLocationId,
        itemId: selectedItemId,
        batchId: selectedBatchId || null,
        quantity: Number(quantity),
      });
      setSuccess('Transfer request created successfully!');
      setShowAddForm(false);
      // Reset form
      setTransferId('');
      setSourceLocationId('');
      setDestinationLocationId('');
      setSelectedItemId('');
      setSelectedBatchId('');
      setQuantity(1);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to create transfer request');
    }
  };

  const handleDeleteTransfer = async (id: string) => { if (window.confirm('Are you sure you want to delete this transfer?')) { try { await api.deleteTransfer(id); fetchAllData(); } catch (err: any) { alert(err.message || 'Failed to delete transfer'); } } };
  const handleDispatch = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await api.dispatchTransfer(id);
      setSuccess('Transfer dispatched successfully! Source inventory decreased.');
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch transfer');
    }
  };

  const handleReceive = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await api.receiveTransfer(id);
      setSuccess('Transfer received successfully! Destination inventory increased.');
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to receive transfer');
    }
  };

  if (loading) {
    return (
      <ERPLayout pageTitle="Stock Transfers">
        <div style={styles.loadingContainer}>
          <div className="spinner" />
        </div>
      </ERPLayout>
    );
  }

  const isAuthorized = user?.role === 'ADMIN' || user?.role === 'OPERATIONS';

  // Apply filters
  const filteredTransfers = transfers.filter((tr) => {
    const matchesSearch =
      !searchTerm ||
      tr.transferId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tr.item?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || tr.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <ERPLayout pageTitle="Internal Stock Transfers">
      <div style={styles.viewContainer}>
        {/* Title Row */}
        <div style={styles.titleRow}>
          <div>
            <p style={styles.subtitleText}>Request and process internal warehouse logistics transfers.</p>
          </div>
          {isAuthorized && !showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={styles.primaryBtn}>
              <Plus size={16} style={{ marginRight: 6 }} /> Create Transfer
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {!isAuthorized && (
          <div style={styles.warningBox}>
            <ShieldAlert size={20} style={{ marginRight: 10 }} />
            Your current role does not have authorization to request or adjust transfers.
          </div>
        )}

        {/* Filter Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
            <input
              type="text"
              placeholder="Search by Transfer ID or Item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="RECEIVED">Received</option>
            </select>

            {(searchTerm || filterStatus) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                }}
                style={styles.clearBtn}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Create Transfer Form */}
        {isAuthorized && showAddForm && (
          <div style={styles.formCard}>
            <h3 style={styles.cardTitle}>New Transfer Order Request</h3>
            <form onSubmit={handleCreateTransfer} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Transfer ID (Unique identifier)</label>
                  <input
                    type="text"
                    placeholder="e.g., 001"
                    value={transferId}
                    onChange={(e) => setTransferId(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Select Item</label>
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

                <div style={styles.formGroup}>
                  <label style={styles.label}>Select Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">-- Choose Batch (Optional) --</option>
                    {batches
                      .filter((b) => !selectedItemId || b.itemId === selectedItemId)
                      .map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batchNumber}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Source Warehouse</label>
                  <select
                    value={sourceLocationId}
                    onChange={(e) => setSourceLocationId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose Source --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Destination Warehouse</label>
                  <select
                    value={destinationLocationId}
                    onChange={(e) => setDestinationLocationId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose Destination --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantity to Transfer</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.btnRow}>
                <button type="submit" style={styles.submitBtn}>
                  Save Transfer Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ledger Panel */}
        <div style={styles.card}>
          {filteredTransfers.length === 0 ? (
            <div style={styles.emptyContainer}>
              <p style={styles.emptyText}>No transfers matching the criteria.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Transfer ID</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Route</th>
                    <th style={styles.thRight}>Quantity</th>
                    <th style={styles.th}>Progress Lifecycle</th>
                    <th style={styles.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((tr) => {

                    return (
                      <tr key={tr.id} style={styles.tr}>
                        <td style={styles.tdBold}>{tr.transferId}</td>
                        <td style={styles.td}>{tr.item?.name}</td>
                        <td style={styles.td}>
                          <div style={styles.routeContainer}>
                            <span>{tr.sourceLocation?.name}</span>
                            <ArrowRight size={14} color="#64748b" style={{ margin: '0 8px' }} />
                            <span>{tr.destinationLocation?.name}</span>
                          </div>
                        </td>
                        <td style={styles.tdQty}>{tr.quantity}</td>
                        <td style={styles.td}>
                          <div style={styles.lifecycleLine}>
                            <span
                              style={{
                                color: tr.status === 'REQUESTED' ? '#818cf8' : '#64748b',
                                fontWeight: tr.status === 'REQUESTED' ? '700' : '500',
                              }}
                            >
                              Requested
                            </span>
                            <span style={styles.lifecycleSeparator}>&rarr;</span>
                            <span
                              style={{
                                color: tr.status === 'DISPATCHED' ? '#fbbf24' : '#64748b',
                                fontWeight: tr.status === 'DISPATCHED' ? '700' : '500',
                              }}
                            >
                              Dispatched
                            </span>
                            <span style={styles.lifecycleSeparator}>&rarr;</span>
                            <span
                              style={{
                                color: tr.status === 'RECEIVED' ? '#475569' : '#64748b',
                                fontWeight: tr.status === 'RECEIVED' ? '700' : '500',
                              }}
                            >
                              Received
                            </span>
                          </div>
                        </td>
                        <td style={styles.tdRight}>
                          <div style={styles.actionGroup}>
                            {isAuthorized && tr.status === 'REQUESTED' && (
                              <button
                                className="dispatch-btn-hover"
                                onClick={() => handleDispatch(tr.id)}
                                style={styles.dispatchBtn}
                              >
                                Dispatch
                              </button>
                            )}
                            {isAuthorized && tr.status === 'DISPATCHED' && (
                              <button
                                className="receive-btn-hover"
                                onClick={() => handleReceive(tr.id)}
                                style={styles.receiveBtn}
                              >
                                Receive
                              </button>
                            )}
                            {tr.status === 'RECEIVED' && (
                              <span style={styles.receivedLabel}>
                                <Check size={14} style={{ marginRight: 4 }} /> Received
                              </span>
                            )}
                          </div>
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
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterSelect: {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    color: '#374151',
    padding: '10px 16px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer'
  },
  clearBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
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
  formCard: {
    backgroundColor: '#fff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '24px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
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
    outline: 'none'
  },
  input: {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    color: '#1e293b',
    padding: '10px 12px',
    fontSize: '13px',
    outline: 'none'
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
  tdBold: {
    padding: '12px 16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  tdQty: {
    padding: '12px 16px',
    textAlign: 'right',
    color: '#374151',
    fontWeight: '600'
  },
  routeContainer: {
    display: 'flex',
    alignItems: 'center',
    color: '#374151',
    fontSize: '12px'
  },
  lifecycleLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px'
  },
  lifecycleSeparator: {
    color: '#334155'
  },
  actionGroup: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  dispatchBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    color: '#fbbf24',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  receiveBtn: {
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  receivedLabel: {
    color: '#475569',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center'
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
  }
};
export default Transfers;


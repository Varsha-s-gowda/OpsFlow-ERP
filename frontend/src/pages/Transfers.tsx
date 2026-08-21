import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, ArrowLeft, Plus, ShieldAlert } from 'lucide-react';
import api, { User } from '../services/api';

export const Transfers: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        batchId: selectedBatchId || undefined,
        quantity: Number(quantity),
      });
      setSuccess('Stock transfer requested successfully!');
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
      setError(err.message || 'Failed to request stock transfer');
    }
  };

  const handleDispatch = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await api.dispatchTransfer(id);
      setSuccess('Transfer successfully dispatched. Source inventory decreased.');
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
      setSuccess('Transfer successfully received. Destination inventory increased.');
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to receive transfer');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" />
      </div>
    );
  }

  const isAuthorized = user?.role === 'ADMIN' || user?.role === 'OPERATIONS';

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <Link to="/" style={styles.backLink}>
            <ArrowLeft size={18} style={{ marginRight: 8 }} />
            Dashboard
          </Link>
          <Server size={24} color="#818cf8" style={{ marginRight: 10, marginLeft: 20 }} />
          <span style={styles.brandText}>OpsFlow ERP</span>
          <span style={styles.badge}>Internal Transfers</span>
        </div>
        <div style={styles.userRole}>
          Role: <strong style={{ color: '#818cf8', marginLeft: 4 }}>{user?.role}</strong>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>Internal Stock Transfers</h1>
          {isAuthorized && !showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={styles.primaryBtn}>
              <Plus size={16} style={{ marginRight: 6 }} /> Request Transfer
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {!isAuthorized && (
          <div style={styles.warningBox}>
            <ShieldAlert size={20} style={{ marginRight: 10 }} />
            Your current role does not have authorization to request or process stock transfers.
          </div>
        )}

        {/* Create Transfer Request Form */}
        {showAddForm && (
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>New Transfer Request</h2>
            <form onSubmit={handleCreateTransfer} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Transfer ID (Unique String)</label>
                <input
                  type="text"
                  placeholder="e.g., TR-2026-001"
                  value={transferId}
                  onChange={(e) => setTransferId(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>Source Location</label>
                  <select
                    value={sourceLocationId}
                    onChange={(e) => setSourceLocationId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose Source --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>Destination Location</label>
                  <select
                    value={destinationLocationId}
                    onChange={(e) => setDestinationLocationId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose Destination --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
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

                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>Batch (Optional)</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">-- Select Specific Batch --</option>
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

              <div style={styles.btnRow}>
                <button type="submit" style={styles.primaryBtn}>
                  Request Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={styles.secondaryBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transfers List */}
        <div style={styles.card}>
          <h2 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Active Transfers Ledger</h2>
          {transfers.length === 0 ? (
            <p style={styles.emptyText}>No transfers scheduled.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Transfer ID</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Source</th>
                    <th style={styles.th}>Destination</th>
                    <th style={styles.th}>Batch Context</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Status</th>
                    {isAuthorized && <th style={styles.th}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tr) => {
                    const statusColor =
                      tr.status === 'RECEIVED'
                        ? '#4ade80'
                        : tr.status === 'DISPATCHED'
                        ? '#fbbf24'
                        : '#6366f1';
                    return (
                      <tr key={tr.id} style={styles.tr}>
                        <td style={styles.tdId}>{tr.transferId}</td>
                        <td style={styles.td}>{tr.item?.name}</td>
                        <td style={styles.td}>{tr.sourceLocation?.name}</td>
                        <td style={styles.td}>{tr.destinationLocation?.name}</td>
                        <td style={styles.tdBatch}>{tr.batch?.batchNumber || 'Auto-allocated'}</td>
                        <td style={styles.td}>{tr.quantity}</td>
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
                            {tr.status}
                          </span>
                        </td>
                        {isAuthorized && (
                          <td style={styles.td}>
                            {tr.status === 'REQUESTED' && (
                              <button
                                onClick={() => handleDispatch(tr.id)}
                                style={{ ...styles.actionBtn, borderColor: '#fbbf24', color: '#fbbf24' }}
                              >
                                Dispatch
                              </button>
                            )}
                            {tr.status === 'DISPATCHED' && (
                              <button
                                onClick={() => handleReceive(tr.id)}
                                style={{ ...styles.actionBtn, borderColor: '#4ade80', color: '#4ade80' }}
                              >
                                Receive
                              </button>
                            )}
                            {tr.status === 'RECEIVED' && (
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Archived</span>
                            )}
                          </td>
                        )}
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
  formCard: {
    background: 'rgba(99, 102, 241, 0.04)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
  btnRow: {
    display: 'flex',
    gap: '12px',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    backgroundColor: 'transparent',
    border: '1px solid',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
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
    color: '#818cf8',
  },
  tdBatch: {
    padding: '16px',
    color: '#a5b4fc',
    fontStyle: 'italic',
  },
};
export default Transfers;

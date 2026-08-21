import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, ArrowLeft, Plus, Edit2, ShieldAlert } from 'lucide-react';
import api, { User } from '../services/api';

export const Inventory: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [physicalQuantity, setPhysicalQuantity] = useState(0);
  const [reservedQuantity, setReservedQuantity] = useState(0);

  // Edit State
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editPhysical, setEditPhysical] = useState(0);
  const [editReserved, setEditReserved] = useState(0);

  const fetchAllData = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile.data.user);

      const [invRes, itemRes, locRes, batchRes] = await Promise.all([
        api.getInventory(),
        api.getItems(),
        api.getLocations(),
        api.getBatches(),
      ]);

      setRecords(invRes.data || []);
      setItems(itemRes.data || []);
      setLocations(locRes.data || []);
      setBatches(batchRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createInventory({
        itemId: selectedItemId,
        locationId: selectedLocationId,
        batchId: selectedBatchId,
        physicalQuantity: Number(physicalQuantity),
        reservedQuantity: Number(reservedQuantity),
      });
      setSuccess('Inventory record created successfully!');
      setShowAddForm(false);
      // Reset form
      setSelectedItemId('');
      setSelectedLocationId('');
      setSelectedBatchId('');
      setPhysicalQuantity(0);
      setReservedQuantity(0);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to create inventory record');
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.updateInventory(editingRecord.id, {
        physicalQuantity: Number(editPhysical),
        reservedQuantity: Number(editReserved),
      });
      setSuccess('Inventory record updated successfully!');
      setEditingRecord(null);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to update inventory record');
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
          <span style={styles.badge}>Inventory Control</span>
        </div>
        <div style={styles.userRole}>
          Role: <strong style={{ color: '#818cf8', marginLeft: 4 }}>{user?.role}</strong>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>Inventory Management</h1>
          {isAuthorized && !showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={styles.primaryBtn}>
              <Plus size={16} style={{ marginRight: 6 }} /> Add Stock Record
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {!isAuthorized && (
          <div style={styles.warningBox}>
            <ShieldAlert size={20} style={{ marginRight: 10 }} />
            Your current role does not have authorization to add or modify inventory records.
          </div>
        )}

        {/* Add Inventory Form */}
        {showAddForm && (
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>New Inventory Combination</h2>
            <form onSubmit={handleAddInventory} style={styles.form}>
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
                <label style={styles.label}>Select Location</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">-- Choose Location --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
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
                  required
                >
                  <option value="">-- Choose Batch --</option>
                  {batches
                    .filter((b) => !selectedItemId || b.itemId === selectedItemId)
                    .map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchNumber} - (Item: {batch.item?.name})
                      </option>
                    ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>Physical Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={physicalQuantity}
                    onChange={(e) => setPhysicalQuantity(Number(e.target.value))}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>Reserved Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={reservedQuantity}
                    onChange={(e) => setReservedQuantity(Number(e.target.value))}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.btnRow}>
                <button type="submit" style={styles.primaryBtn}>
                  Save Stock Record
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

        {/* Edit Inventory Form */}
        {editingRecord && (
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>
              Update Stock for: {editingRecord.item?.name} at {editingRecord.location?.name}
            </h2>
            <form onSubmit={handleUpdateInventory} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>Physical Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={editPhysical}
                    onChange={(e) => setEditPhysical(Number(e.target.value))}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>Reserved Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={editReserved}
                    onChange={(e) => setEditReserved(Number(e.target.value))}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.btnRow}>
                <button type="submit" style={styles.primaryBtn}>
                  Update Record
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  style={styles.secondaryBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stock Ledger */}
        <div style={styles.card}>
          <h2 style={{ ...styles.cardTitle, marginBottom: '20px' }}>Active Inventory Ledger</h2>
          {records.length === 0 ? (
            <p style={styles.emptyText}>No inventory records found.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>SKU</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Batch</th>
                    <th style={styles.th}>Physical Qty</th>
                    <th style={styles.th}>Reserved Qty</th>
                    <th style={styles.th}>Available Qty</th>
                    {isAuthorized && <th style={styles.th}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id} style={styles.tr}>
                      <td style={styles.td}>{rec.item?.name}</td>
                      <td style={styles.tdSku}>{rec.item?.sku}</td>
                      <td style={styles.td}>{rec.location?.name}</td>
                      <td style={styles.tdBatch}>{rec.batch?.batchNumber}</td>
                      <td style={styles.tdQty}>{rec.physicalQuantity}</td>
                      <td style={styles.tdQtyReserved}>{rec.reservedQuantity}</td>
                      <td style={styles.tdQtyAvailable}>{rec.availableQuantity}</td>
                      {isAuthorized && (
                        <td style={styles.td}>
                          <button
                            onClick={() => {
                              setEditingRecord(rec);
                              setEditPhysical(rec.physicalQuantity);
                              setEditReserved(rec.reservedQuantity);
                            }}
                            style={styles.iconBtn}
                            title="Edit Quantities"
                          >
                            <Edit2 size={14} style={{ marginRight: 4 }} /> Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
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
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    color: '#cbd5e1',
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
  tdSku: {
    padding: '16px',
    fontFamily: 'monospace',
    color: '#38bdf8',
  },
  tdBatch: {
    padding: '16px',
    color: '#a5b4fc',
  },
  tdQty: {
    padding: '16px',
    fontWeight: '600',
  },
  tdQtyReserved: {
    padding: '16px',
    color: '#f87171',
    fontWeight: '600',
  },
  tdQtyAvailable: {
    padding: '16px',
    color: '#4ade80',
    fontWeight: '600',
  },
};
export default Inventory;

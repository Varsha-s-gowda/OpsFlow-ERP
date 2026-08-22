import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, Play, Search } from 'lucide-react';
import api, { User } from '../services/api';
import ERPLayout from '../components/ERPLayout';

export const WorkOrders: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]); // For live stock/shortage summary
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [workOrderId, setWorkOrderId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState(1);

  const fetchAllData = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile.data.user);

      const [woRes, itemRes, locRes, userRes, invRes] = await Promise.all([
        api.getWorkOrders(),
        api.getItems(),
        api.getLocations(),
        api.getUsers(),
        api.getInventory()
      ]);

      setWorkOrders(woRes.data || []);
      setItems(itemRes.data || []);
      setLocations(locRes.data || []);
      setUsers(userRes.data || []);
      setInventory(invRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createWorkOrder({
        workOrderId,
        locationId: selectedLocationId,
        itemId: selectedItemId,
        requiredQuantity: Number(requiredQuantity),
        assignedUserId: selectedUserId,
      });
      setSuccess('Work Order created successfully!');
      setShowAddForm(false);
      // Reset form
      setWorkOrderId('');
      setSelectedItemId('');
      setSelectedLocationId('');
      setSelectedUserId('');
      setRequiredQuantity(1);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to create work order');
    }
  };

  const handleAdvanceStatus = async (id: string, nextStatus: string) => {
    setError('');
    setSuccess('');
    try {
      await api.updateWorkOrderStatus(id, nextStatus);
      setSuccess(`Work Order advanced to ${nextStatus} successfully!`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to update work order status');
    }
  };

  if (loading) {
    return (
      <ERPLayout pageTitle="Work Orders">
        <div style={styles.loadingContainer}>
          <div className="spinner" />
        </div>
      </ERPLayout>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  // Live stock calculations
  const matchingInv = inventory.find(
    (inv: any) => inv.itemId === selectedItemId && inv.locationId === selectedLocationId
  );
  const availableStock = matchingInv ? (matchingInv.physicalQuantity - matchingInv.reservedQuantity) : 0;
  const expectedShortage = Math.max(requiredQuantity - availableStock, 0);

  // Apply filters
  const filteredWorkOrders = workOrders.filter((wo: any) => {
    const matchesSearch =
      !searchTerm ||
      wo.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.item?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || wo.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <ERPLayout pageTitle="Work Orders Control">
      <div style={styles.viewContainer}>
        {/* Title Row */}
        <div style={styles.titleRow}>
          <div>
            <p style={styles.subtitleText}>Plan and track operational assembly or warehouse work orders.</p>
          </div>
          {isAdmin && !showAddForm && (
            <button onClick={() => setShowAddForm(true)} style={styles.primaryBtn}>
              <Plus size={16} style={{ marginRight: 6 }} /> Create Work Order
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {/* Filter Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
            <input
              type="text"
              placeholder="Search by WO ID or Item name..."
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
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
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

        {/* Create Work Order Side Form */}
        {isAdmin && showAddForm && (
          <div style={styles.formCard}>
            <h3 style={styles.cardTitle}>New Work Order Request</h3>
            <form onSubmit={handleCreateWorkOrder} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Work Order ID (Unique identifier)</label>
                  <input
                    type="text"
                    placeholder="e.g., 001"
                    value={workOrderId}
                    onChange={(e) => setWorkOrderId(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Item</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose Item --</option>
                    {items.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Target Warehouse Location</label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose Location --</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Assignee User</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>Required Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={requiredQuantity}
                    onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                    style={styles.input}
                    required
                  />
                </div>

                {/* Expected shortage live summary */}
                <div style={{ ...styles.formGroupHalf, ...styles.stockPreview }}>
                  <div style={styles.previewLine}>
                    <span>Available Stock at Location:</span>
                    <strong style={{ color: availableStock > 0 ? '#34d399' : '#94a3b8' }}>
                      {availableStock} units
                    </strong>
                  </div>
                  <div style={styles.previewLine}>
                    <span>Expected Shortage:</span>
                    <strong style={{ color: expectedShortage > 0 ? '#f87171' : '#4ade80' }}>
                      {expectedShortage} units
                    </strong>
                  </div>
                </div>
              </div>

              <div style={styles.btnRow}>
                <button type="submit" style={styles.submitBtn}>
                  Save Work Order
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
          {filteredWorkOrders.length === 0 ? (
            <div style={styles.emptyContainer}>
              <p style={styles.emptyText}>No work orders matching filters.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>WO ID</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.thRight}>Required</th>
                    <th style={styles.thRight}>Available</th>
                    <th style={styles.thRight}>Shortage</th>
                    <th style={styles.th}>Assignee</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkOrders.map((wo: any) => {
                    const statusColor =
                      wo.status === 'COMPLETED'
                        ? '#475569'
                        : wo.status === 'IN_PROGRESS'
                        ? '#475569'
                        : '#94a3b8';

                    return (
                      <tr key={wo.id} style={styles.tr}>
                        <td style={styles.tdBold}>{wo.workOrderId}</td>
                        <td style={styles.td}>{wo.item?.name}</td>
                        <td style={styles.td}>{wo.location?.name}</td>
                        <td style={styles.tdQty}>{wo.requiredQuantity}</td>
                        <td style={styles.tdQtyAvailable}>{wo.availableQuantity}</td>
                        <td style={styles.td}>
                          <div style={{ textAlign: 'right', paddingRight: '12px' }}>
                            <span
                              style={{
                                color: wo.shortage > 0 ? '#f87171' : '#4ade80',
                                fontWeight: '700',
                              }}
                            >
                              {wo.shortage > 0 ? wo.shortage : 'No shortage'}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>{wo.assignedUser?.name}</td>
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
                            {wo.status}
                          </span>
                        </td>
                        <td style={styles.tdRight}>
                          <div style={styles.actionButtonGroup}>
                             {wo.status === 'ASSIGNED' && (
                               <button
                                 className="action-btn-hover"
                                 onClick={() => handleAdvanceStatus(wo.id, 'IN_PROGRESS')}
                                 style={styles.actionBtn}
                               >
                                 <Play size={12} style={{ marginRight: 4 }} /> Start Work
                               </button>
                             )}
                             {wo.status === 'IN_PROGRESS' && (
                               <button
                                 className="success-action-btn-hover"
                                 onClick={() => handleAdvanceStatus(wo.id, 'COMPLETED')}
                                 style={styles.successActionBtn}
                               >
                                 <CheckCircle size={12} style={{ marginRight: 4 }} /> Complete Work
                               </button>
                             )}
                            {wo.status === 'COMPLETED' && (
                              <span style={styles.completedText}>Completed</span>
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
  loadingContainer: { minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  viewContainer: { display: 'flex', flexDirection: 'column', gap: '24px' },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
  subtitleText: { fontSize: '13px', color: '#64748b', margin: 0 },
  toolbar: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  searchBox: { flex: 1, minWidth: '260px', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '0 12px', display: 'flex', alignItems: 'center' },
  searchInput: { flex: 1, background: 'none', border: 'none', color: '#1e293b', padding: '10px 0', fontSize: '13px', outline: 'none' },
  filterGroup: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  filterSelect: { backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', color: '#475569', padding: '9px 14px', fontSize: '13px', outline: 'none', cursor: 'pointer' },
  clearBtn: { backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  primaryBtn: { backgroundColor: '#334155', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  card: { backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: '15px', fontWeight: '700', margin: '0 0 20px 0', color: '#1e293b' },
  formCard: { backgroundColor: '#fff', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(59,130,246,0.06)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formRow: { display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' },
  formGroupHalf: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  stockPreview: { backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#64748b' },
  previewLine: { display: 'flex', justifyContent: 'space-between' },
  label: { fontSize: '12px', fontWeight: '600', color: '#475569' },
  select: { backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', padding: '10px 12px', fontSize: '13px', outline: 'none' },
  input: { backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', padding: '10px 12px', fontSize: '13px', outline: 'none' },
  btnRow: { display: 'flex', gap: '12px' },
  submitBtn: { backgroundColor: '#334155', border: 'none', borderRadius: '8px', color: '#ffffff', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', color: '#64748b', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  errorBox: { backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '12px 16px', fontSize: '13px' },
  successBox: { backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '8px', padding: '12px 16px', fontSize: '13px' },
  emptyContainer: { padding: '40px 0', textAlign: 'center' },
  emptyText: { color: '#94a3b8', fontSize: '13px', margin: 0 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  th: { padding: '11px 16px', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f8fafc' },
  thRight: { padding: '11px 16px', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontWeight: '700', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f8fafc' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '12px 16px', color: '#475569' },
  tdRight: { padding: '12px 16px', textAlign: 'right', color: '#475569' },
  tdBold: { padding: '12px 16px', fontWeight: '700', color: '#1e293b' },
  tdQty: { padding: '12px 16px', textAlign: 'right', color: '#374151', fontWeight: '600' },
  tdQtyAvailable: { padding: '12px 16px', textAlign: 'right', color: '#64748b', fontWeight: '500' },
  actionButtonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '6px' },
  actionBtn: { backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  successActionBtn: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  completedText: { fontSize: '12px', color: '#94a3b8', fontWeight: '600' }
};
export default WorkOrders;

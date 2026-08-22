import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Search, Package, X, Trash2 } from 'lucide-react';
import api, { User } from '../services/api';
import ERPLayout from '../components/ERPLayout';

type FormMode = 'none' | 'addItem' | 'addStock' | 'editStock';

export const Inventory: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formMode, setFormMode] = useState<FormMode>('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [physicalQuantity, setPhysicalQuantity] = useState(0);
  const [reservedQuantity, setReservedQuantity] = useState(0);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editPhysical, setEditPhysical] = useState(0);
  const [editReserved, setEditReserved] = useState(0);

  const fetchAllData = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile.data.user);

      const [invRes, itemRes, catRes, locRes, batchRes] = await Promise.all([
        api.getInventory(),
        api.getItems(),
        api.getCategories(),
        api.getLocations(),
        api.getBatches(),
      ]);

      setRecords(invRes.data || []);
      setItems(itemRes.data || []);
      setCategories(catRes.data || []);
      setLocations(locRes.data || []);
      setBatches(batchRes.data || []);
      const existingNums = (itemRes.data || [])
        .map((it: any) => {
          const m = it.sku?.match(/^(\d+)$/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n: number) => n > 0);
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
      setNewItemSku(`${String(nextNum).padStart(3, '0')}`);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const openForm = (mode: FormMode) => {
    clearMessages();
    setFormMode(mode);
    setEditingRecord(null);
  };

  const closeForm = () => {
    setFormMode('none');
    setEditingRecord(null);
    clearMessages();
  };
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      let categoryId = newItemCategoryId;
      if (showNewCategory && newCategoryName.trim()) {
        const catRes = await api.createCategory({ name: newCategoryName.trim() });
        categoryId = catRes.data.id;
      }

      if (!categoryId) { setError('Please select or create a category.'); return; }

      const itemRes = await api.createItem({ name: newItemName, sku: newItemSku, categoryId });
      const itemId = itemRes.data.id;
      if (newBatchNumber.trim()) {
        await api.createBatch({ batchNumber: newBatchNumber.trim(), itemId });
      }

      setSuccess(`Item "${newItemName}" (${newItemSku}) created successfully!`);
      setNewItemName('');
      setNewBatchNumber('');
      setNewItemCategoryId('');
      setNewCategoryName('');
      setShowNewCategory(false);
      closeForm();
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    }
  };
  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      let finalBatchId = null;
      if (batchInput.trim()) {
        const batchRes = await api.createBatch({ batchNumber: batchInput.trim(), itemId: selectedItemId });
        finalBatchId = batchRes.data.id;
      }
      await api.createInventory({
        itemId: selectedItemId,
        locationId: selectedLocationId,
        batchId: finalBatchId,
        physicalQuantity: Number(physicalQuantity),
        reservedQuantity: Number(reservedQuantity),
      });
      setSuccess('Stock record created successfully!');
      setSelectedItemId(''); setSelectedLocationId('');
      setBatchInput(''); setPhysicalQuantity(0); setReservedQuantity(0);
      closeForm();
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to create stock record');
    }
  };
  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await api.updateInventory(editingRecord.id, {
        physicalQuantity: Number(editPhysical),
        reservedQuantity: Number(editReserved),
      });
      setSuccess('Stock updated successfully!');
      closeForm();
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to update stock');
    }
  };

  const handleDeleteInventory = async (id: string) => {
    clearMessages();
    try {
      await api.deleteInventory(id);
      setSuccess('Stock record deleted successfully!');
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete stock record');
    }
  };

  if (loading) {
    return (
      <ERPLayout pageTitle="Inventory Stock Control">
        <div style={s.loadingContainer}>
          <div style={s.spinner} />
        </div>
      </ERPLayout>
    );
  }

  const isAuthorized = user?.role === 'ADMIN' || user?.role === 'OPERATIONS';

  const filteredRecords = records.filter((rec: any) => {
    const matchesSearch =
      !searchTerm ||
      rec.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.item?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.batch?.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !filterLocation || rec.locationId === filterLocation;
    const av = rec.physicalQuantity - rec.reservedQuantity;
    let matchesStock = true;
    if (filterStock === 'healthy') matchesStock = av >= 15;
    else if (filterStock === 'low') matchesStock = av > 0 && av < 15;
    else if (filterStock === 'out') matchesStock = av === 0;
    return matchesSearch && matchesLocation && matchesStock;
  });

  const filteredBatches = batches.filter(
    (b: any) => !selectedItemId || b.itemId === selectedItemId
  );

  return (
    <ERPLayout pageTitle="Inventory Stock Control">
      <div style={s.page}>

                <div style={s.header}>
          <p style={s.subtitle}>Manage warehouse stock levels, items, and batch records.</p>
          {isAuthorized && (
            <div style={s.headerBtns}>
              <button onClick={() => openForm('addItem')} style={s.outlineBtn}>
                <Package size={15} style={{ marginRight: 6 }} />
                New Item
              </button>
              <button onClick={() => openForm('addStock')} style={s.primaryBtn}>
                <Plus size={15} style={{ marginRight: 6 }} />
                Add Stock Record
              </button>
            </div>
          )}
        </div>

                {error && <div style={s.errorBox}>{error}</div>}
        {success && <div style={s.successBox}>{success}</div>}

                {isAuthorized && formMode === 'addItem' && (
          <div style={s.formCard}>
            <div style={s.formCardHeader}>
              <h3 style={s.formTitle}>Create New Item</h3>
              <button onClick={closeForm} style={s.closeBtn}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div style={s.formGrid3}>

                                <div style={s.formGroup}>
                  <label style={s.label}>Item Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Steel Rod 10mm"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    style={s.input}
                    required
                  />
                </div>

                                <div style={s.formGroup}>
                  <label style={s.label}>Product ID (auto-generated)</label>
                  <input
                    type="text"
                    value={newItemSku}
                    onChange={e => setNewItemSku(e.target.value)}
                    style={{ ...s.input, fontFamily: 'monospace', color: '#0f6fde' }}
                    required
                  />
                </div>

                                <div style={s.formGroup}>
                  <label style={s.label}>Category *</label>
                  {!showNewCategory ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={newItemCategoryId}
                        onChange={e => setNewItemCategoryId(e.target.value)}
                        style={{ ...s.select, flex: 1 }}
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setShowNewCategory(true); setNewItemCategoryId(''); }}
                        style={s.smallOutlineBtn}
                        title="Create new category"
                      >+ New</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        style={{ ...s.input, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                        style={s.smallOutlineBtn}
                      >Cancel</button>
                    </div>
                  )}
                </div>

                                <div style={s.formGroup}>
                  <label style={s.label}>Initial Batch Number <span style={{ color: '#94a3b8' }}>(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g., BATCH-2026-A"
                    value={newBatchNumber}
                    onChange={e => setNewBatchNumber(e.target.value)}
                    style={s.input}
                  />
                </div>
              </div>

              <div style={s.btnRow}>
                <button type="submit" style={s.primaryBtn}>Create Item</button>
                <button type="button" onClick={closeForm} style={s.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        )}

                {isAuthorized && formMode === 'addStock' && (
          <div style={s.formCard}>
            <div style={s.formCardHeader}>
              <h3 style={s.formTitle}>Add Stock Record</h3>
              <button onClick={closeForm} style={s.closeBtn}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddInventory}>
              <div style={s.formGrid3}>
                <div style={s.formGroup}>
                  <label style={s.label}>Item *</label>
                  <select
                    value={selectedItemId}
                    onChange={e => { setSelectedItemId(e.target.value); setSelectedBatchId(''); }}
                    style={s.select}
                    required
                  >
                    <option value="">-- Choose Item --</option>
                    {items.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                    ))}
                  </select>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Location *</label>
                  <select
                    value={selectedLocationId}
                    onChange={e => setSelectedLocationId(e.target.value)}
                    style={s.select}
                    required
                  >
                    <option value="">-- Choose Location --</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                    ))}
                  </select>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Batch (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BAT-001 (Type to create)"
                    value={batchInput}
                    onChange={e => setBatchInput(e.target.value)}
                    style={s.input}
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Physical Quantity *</label>
                  <input
                    type="number" min="0"
                    value={physicalQuantity}
                    onChange={e => setPhysicalQuantity(Number(e.target.value))}
                    style={s.input} required
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Reserved Quantity</label>
                  <input
                    type="number" min="0"
                    value={reservedQuantity}
                    onChange={e => setReservedQuantity(Number(e.target.value))}
                    style={s.input}
                  />
                </div>

                                <div style={{ ...s.formGroup, justifyContent: 'flex-end' }}>
                  <label style={s.label}>Calculated Available</label>
                  <div style={s.availablePreview}>
                    {Math.max(0, physicalQuantity - reservedQuantity)} units
                  </div>
                </div>
              </div>

              <div style={s.btnRow}>
                <button type="submit" style={s.primaryBtn}>Save Stock Record</button>
                <button type="button" onClick={closeForm} style={s.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        )}

                {isAuthorized && editingRecord && formMode === 'editStock' && (
          <div style={s.formCard}>
            <div style={s.formCardHeader}>
              <h3 style={s.formTitle}>
                Update: {editingRecord.item?.name} @ {editingRecord.location?.name}
              </h3>
              <button onClick={closeForm} style={s.closeBtn}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdateInventory}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
                <div style={{ ...s.formGroup, flex: 1, minWidth: 180 }}>
                  <label style={s.label}>Physical Quantity</label>
                  <input
                    type="number" min="0"
                    value={editPhysical}
                    onChange={e => setEditPhysical(Number(e.target.value))}
                    style={s.input} required
                  />
                </div>
                <div style={{ ...s.formGroup, flex: 1, minWidth: 180 }}>
                  <label style={s.label}>Reserved Quantity</label>
                  <input
                    type="number" min="0"
                    value={editReserved}
                    onChange={e => setEditReserved(Number(e.target.value))}
                    style={s.input} required
                  />
                </div>
                <div style={{ ...s.formGroup, flex: 1, minWidth: 180 }}>
                  <label style={s.label}>Calculated Available</label>
                  <div style={s.availablePreview}>
                    {Math.max(0, editPhysical - editReserved)} units
                  </div>
                </div>
              </div>
              <div style={s.btnRow}>
                <button type="submit" style={s.primaryBtn}>Update Record</button>
                <button type="button" onClick={closeForm} style={s.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        )}

                <div style={s.toolbar}>
          <div style={s.searchBox}>
            <Search size={16} color="#94a3b8" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, SKU or batch..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={s.searchInput}
            />
          </div>
          <div style={s.filterRow}>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={s.filterSelect}>
              <option value="">All Locations</option>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select value={filterStock} onChange={e => setFilterStock(e.target.value)} style={s.filterSelect}>
              <option value="">All Stock Levels</option>
              <option value="healthy">Healthy (≥ 15)</option>
              <option value="low">Low Stock (&lt; 15)</option>
              <option value="out">Out of Stock (= 0)</option>
            </select>
            {(searchTerm || filterLocation || filterStock) && (
              <button onClick={() => { setSearchTerm(''); setFilterLocation(''); setFilterStock(''); }} style={s.clearBtn}>
                Clear
              </button>
            )}
          </div>
        </div>

                <div style={s.tableCard}>
          <div style={s.tableInfo}>
            <span style={s.tableCount}>{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
          </div>
          {filteredRecords.length === 0 ? (
            <div style={s.empty}>
              <Package size={36} color="#cbd5e1" />
              <p style={s.emptyText}>No inventory records match the current filters.</p>
              {isAuthorized && (
                <button onClick={() => openForm('addStock')} style={s.primaryBtn}>
                  <Plus size={14} style={{ marginRight: 6 }} /> Add First Record
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr style={s.theadRow}>
                    <th style={s.th}>Item</th>
                    <th style={s.th}>Product ID</th>
                    <th style={s.th}>Category</th>
                    <th style={s.th}>Location</th>
                    <th style={s.th}>Batch</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Physical</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Reserved</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Available</th>
                    <th style={s.th}>Status</th>
                    {isAuthorized && <th style={{ ...s.th, textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((rec: any) => {
                    const av = rec.physicalQuantity - rec.reservedQuantity;
                    const status = av === 0 ? 'out' : av < 15 ? 'low' : 'ok';
                    const statusMap = {
                      ok:  { label: 'Healthy',      bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
                      low: { label: 'Low Stock',    bg: '#fef9c3', color: '#b45309', border: '#fde68a' },
                      out: { label: 'Out of Stock', bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
                    }[status];

                    return (
                      <tr key={rec.id} style={s.tr}>
                        <td style={s.tdBold}>{rec.item?.name}</td>
                        <td style={s.tdSku}>{rec.item?.sku}</td>
                        <td style={s.td}>{rec.item?.category?.name || '—'}</td>
                        <td style={s.td}>{rec.location?.name}</td>
                        <td style={s.tdMono}>{rec.batch?.batchNumber}</td>
                        <td style={s.tdNum}>{rec.physicalQuantity}</td>
                        <td style={{ ...s.tdNum, color: '#64748b' }}>{rec.reservedQuantity}</td>
                        <td style={{ ...s.tdNum, color: av > 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{av}</td>
                        <td style={s.td}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: statusMap.bg,
                            color: statusMap.color,
                            border: `1px solid ${statusMap.border}`,
                          }}>
                            {statusMap.label}
                          </span>
                        </td>
                        {isAuthorized && (
                          <td style={{ ...s.td, textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setEditingRecord(rec);
                                  setEditPhysical(rec.physicalQuantity);
                                  setEditReserved(rec.reservedQuantity);
                                  openForm('editStock');
                                }}
                                style={s.actionBtn}
                              >
                                <Edit2 size={13} style={{ marginRight: 4 }} /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this inventory record?')) {
                                    handleDeleteInventory(rec.id);
                                  }
                                }}
                                style={{ ...s.actionBtn, marginLeft: 8, color: '#ef4444', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                              >
                                <Trash2 size={13} style={{ marginRight: 4 }} /> Delete
                              </button>
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
      </div>
    </ERPLayout>
  );
};
const s: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh', backgroundColor: '#f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #475569',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
  },
  subtitle: { fontSize: 13, color: '#64748b', margin: 0 },
  headerBtns: { display: 'flex', gap: 10 },
  primaryBtn: {
    backgroundColor: '#475569', border: 'none', color: '#fff',
    padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
  },
  outlineBtn: {
    backgroundColor: '#fff', border: '1.5px solid #475569', color: '#475569',
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b',
    padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  clearBtn: {
    backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626',
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  smallOutlineBtn: {
    backgroundColor: '#f1f5f9', border: '1.5px solid #cbd5e1', color: '#475569',
    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  actionBtn: {
    backgroundColor: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#374151',
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', padding: 4,
  },
  formCard: {
    backgroundColor: '#fff', border: '1.5px solid #cbd5e1',
    borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(59,130,246,0.07)',
  },
  formCardHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  formTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 },
  formGrid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 18, marginBottom: 20,
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  btnRow: { display: 'flex', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#475569' },
  input: {
    backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0',
    borderRadius: 8, color: '#1e293b', padding: '9px 12px',
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  select: {
    backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0',
    borderRadius: 8, color: '#1e293b', padding: '9px 12px',
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  availablePreview: {
    backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0',
    borderRadius: 8, color: '#16a34a', padding: '9px 14px',
    fontSize: 14, fontWeight: 700,
  },
  toolbar: {
    backgroundColor: '#fff', border: '1.5px solid #e2e8f0',
    borderRadius: 10, padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  searchBox: {
    flex: 1, minWidth: 240, backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: 8,
    padding: '0 12px', display: 'flex', alignItems: 'center',
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none',
    color: '#1e293b', padding: '9px 0', fontSize: 13, outline: 'none',
  },
  filterRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterSelect: {
    backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0',
    borderRadius: 8, color: '#475569', padding: '8px 14px',
    fontSize: 13, outline: 'none', cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#fee2e2', border: '1px solid #fecaca',
    color: '#dc2626', borderRadius: 8, padding: '12px 16px', fontSize: 13,
  },
  successBox: {
    backgroundColor: '#dcfce7', border: '1px solid #bbf7d0',
    color: '#16a34a', borderRadius: 8, padding: '12px 16px', fontSize: 13,
  },
  tableCard: {
    backgroundColor: '#fff', border: '1.5px solid #e2e8f0',
    borderRadius: 12, overflow: 'hidden',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
  },
  tableInfo: {
    padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
  tableCount: { fontSize: 12, fontWeight: 600, color: '#64748b' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  theadRow: { backgroundColor: '#f8fafc' },
  th: {
    padding: '12px 16px', textAlign: 'left',
    color: '#64748b', fontWeight: 700, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', color: '#374151' },
  tdBold: { padding: '12px 16px', fontWeight: 700, color: '#1e293b' },
  tdSku: { padding: '12px 16px', fontWeight: 700, color: '#475569', fontFamily: 'monospace' },
  tdMono: { padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 },
  tdNum: { padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' },

  empty: {
    padding: '60px 20px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  emptyText: { color: '#94a3b8', fontSize: 14, margin: 0 },
};

export default Inventory;

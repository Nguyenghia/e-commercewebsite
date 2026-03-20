import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

type Tab = 'overview' | 'products' | 'orders' | 'users';

interface Stats {
    userCount: number;
    productCount: number;
    totalOrders: number;
    totalRevenue: number;
    ordersByStatus: Record<string, number>;
    recentOrders: RecentOrder[];
    lowStock: { id: number; name: string; stock: number }[];
}
interface RecentOrder {
    id: number; username: string; email: string;
    status: string; total: number; created_at: string;
}
interface Category { id: number; name: string; }
interface Product {
    id: number; name: string; description: string;
    price: number; stock: number; discount: number;
    category_id?: number; image_url?: string; category_name?: string;
}
interface OrderItem { id: number; name: string; quantity: number; price: number; }
interface Order {
    id: number; username: string; email: string;
    status: string; total: number; created_at: string; items: OrderItem[];
}
interface User { id: number; username: string; email: string; role: string; points: number; tier: string; created_at: string; }

const STATUS_COLORS: Record<string, string> = {
    pending: '#f0a500', processing: '#007bff', shipped: '#17a2b8',
    delivered: '#28a745', cancelled: '#dc3545',
};
const emptyForm = { name: '', description: '', price: '', stock: '', discount: '0', category_id: '', image_url: '' };

const AdminDashboard: React.FC = () => {
    const [tab, setTab] = useState<Tab>('overview');
    const [stats, setStats] = useState<Stats | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [form, setForm] = useState<Record<string, string>>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [inlineEdit, setInlineEdit] = useState<Record<number, { price: string; discount: string }>>({});
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState<'success' | 'error'>('success');

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.role === 'admin';

    const flash = (text: string, type: 'success' | 'error' = 'success') => {
        setMsg(text); setMsgType(type);
        setTimeout(() => setMsg(''), 3000);
    };

    const loadStats = () =>
        axios.get('/api/dashboard/stats', { headers })
            .then(r => setStats(r.data))
            .catch(() => flash('Failed to load stats', 'error'));

    const loadProducts = () =>
        Promise.all([
            axios.get('/api/products', { headers }),
            axios.get('/api/products/categories', { headers }),
        ]).then(([p, c]) => { setProducts(p.data); setCategories(c.data); });

    const loadOrders = () =>
        axios.get('/api/orders', { headers }).then(r => setOrders(r.data));

    const loadUsers = () =>
        axios.get('/api/users', { headers }).then(r => setUsers(r.data));

    useEffect(() => {
        if (tab === 'overview') loadStats();
        if (tab === 'products') loadProducts();
        if (tab === 'orders') loadOrders();
        if (tab === 'users') loadUsers();
    }, [tab]);

    // ── Products ──────────────────────────────────────
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
    const openEdit = (p: Product) => {
        setForm({
            name: p.name, description: p.description || '',
            price: String(p.price), stock: String(p.stock),
            discount: String(p.discount || 0),
            category_id: p.category_id ? String(p.category_id) : '',
            image_url: p.image_url || '',
        });
        setEditingId(p.id); setShowForm(true);
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: form.name, description: form.description,
            price: parseFloat(form.price), stock: parseInt(form.stock) || 0,
            discount: parseInt(form.discount) || 0,
            category_id: form.category_id ? parseInt(form.category_id) : null,
            image_url: form.image_url || null,
        };
        try {
            if (editingId) {
                await axios.put(`/api/products/${editingId}`, payload, { headers });
                flash('Product updated.');
            } else {
                await axios.post('/api/products', payload, { headers });
                flash('Product created.');
            }
            setShowForm(false); loadProducts();
        } catch (err: any) {
            flash(err.response?.data?.message || 'Error saving product', 'error');
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Delete this product?')) return;
        try {
            await axios.delete(`/api/products/${id}`, { headers });
            flash('Product deleted.'); loadProducts();
        } catch { flash('Error deleting product', 'error'); }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        await axios.post('/api/products/categories/new', { name: newCategory }, { headers });
        setNewCategory(''); flash('Category added.'); loadProducts();
    };

    // ── Inline price / discount editing ──────────────
    const startInlineEdit = (p: Product) =>
        setInlineEdit(prev => ({ ...prev, [p.id]: { price: String(p.price), discount: String(p.discount || 0) } }));

    const cancelInlineEdit = (id: number) =>
        setInlineEdit(prev => { const n = { ...prev }; delete n[id]; return n; });

    const saveInlineEdit = async (p: Product) => {
        const edit = inlineEdit[p.id];
        if (!edit) return;
        try {
            await axios.put(`/api/products/${p.id}`, {
                name: p.name, description: p.description,
                price: parseFloat(edit.price), stock: p.stock,
                discount: parseInt(edit.discount) || 0,
                category_id: p.category_id, image_url: p.image_url,
            }, { headers });
            flash('Price / promotion updated.');
            cancelInlineEdit(p.id); loadProducts();
        } catch { flash('Error updating price', 'error'); }
    };

    // ── Orders ────────────────────────────────────────
    const handleStatusChange = async (orderId: number, status: string) => {
        await axios.patch(`/api/orders/${orderId}/status`, { status }, { headers });
        flash('Order status updated.'); loadOrders();
    };

    // ── Users ─────────────────────────────────────────
    const handleRoleChange = async (userId: number, role: string) => {
        await axios.patch(`/api/users/${userId}/role`, { role }, { headers });
        flash('User role updated.'); loadUsers();
    };

    const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
    const filteredTotal = filteredOrders.reduce((s, o) => s + Number(o.total), 0);

    return (
        <div style={s.page}>
            <Navbar />
            <div style={s.container}>
                <h2 style={s.pageTitle}>Admin Dashboard</h2>

                {msg && (
                    <div style={{ ...s.flash, background: msgType === 'error' ? '#f8d7da' : '#d4edda', color: msgType === 'error' ? '#721c24' : '#155724' }}>
                        {msg}
                    </div>
                )}

                {/* ── Tabs ── */}
                <div style={s.tabs}>
                    {(['overview', 'products', 'orders', 'users'] as Tab[]).map(t => (
                        <button key={t} style={tab === t ? s.tabActive : s.tab} onClick={() => setTab(t)}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
                {tab === 'overview' && (
                    <div>
                        {!stats ? (
                            <p style={s.loading}>Loading stats...</p>
                        ) : (
                            <>
                                {/* Stat cards */}
                                <div style={s.statGrid}>
                                    <StatCard label="Total Revenue"   value={`$${Number(stats.totalRevenue).toFixed(2)}`} color="#e94560" sub="all time" />
                                    <StatCard label="Total Orders"    value={stats.totalOrders}  color="#007bff" />
                                    <StatCard label="Registered Users" value={stats.userCount}   color="#28a745" />
                                    <StatCard label="Total Products"  value={stats.productCount} color="#f0a500" />
                                </div>

                                {/* Order status breakdown */}
                                <div style={s.section}>
                                    <h3 style={s.sectionTitle}>Order Status Summary</h3>
                                    <div style={s.statusGrid}>
                                        {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                                            <div key={status} style={{ ...s.statusCard, borderColor: STATUS_COLORS[status] }}>
                                                <div style={{ ...s.dot, background: STATUS_COLORS[status] }} />
                                                <p style={s.statusLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</p>
                                                <p style={{ ...s.statusCount, color: STATUS_COLORS[status] }}>{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Low stock */}
                                {stats.lowStock.length > 0 && (
                                    <div style={s.section}>
                                        <h3 style={{ ...s.sectionTitle, color: '#dc3545' }}>⚠ Low Stock Alerts</h3>
                                        <div style={s.alertList}>
                                            {stats.lowStock.map(item => (
                                                <div key={item.id} style={s.alertItem}>
                                                    <span>{item.name}</span>
                                                    <span style={{ color: item.stock === 0 ? '#dc3545' : '#f0a500', fontWeight: 700 }}>
                                                        {item.stock === 0 ? 'Out of stock' : `${item.stock} left`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent orders */}
                                <div style={s.section}>
                                    <h3 style={s.sectionTitle}>Recent Orders (last 10)</h3>
                                    <table style={s.table}>
                                        <thead>
                                            <tr style={s.thead}>
                                                <th style={s.th}>Order #</th>
                                                <th style={s.th}>Customer</th>
                                                <th style={s.th}>Status</th>
                                                <th style={s.th}>Total</th>
                                                <th style={s.th}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentOrders.length === 0 ? (
                                                <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#aaa' }}>No orders yet.</td></tr>
                                            ) : stats.recentOrders.map(o => (
                                                <tr key={o.id} style={s.tr}>
                                                    <td style={s.td}>#{o.id}</td>
                                                    <td style={s.td}>
                                                        {o.username}
                                                        <br />
                                                        <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{o.email}</span>
                                                    </td>
                                                    <td style={s.td}>
                                                        <span style={{ ...s.badge, background: STATUS_COLORS[o.status] || '#888' }}>{o.status}</span>
                                                    </td>
                                                    <td style={s.td}>${Number(o.total).toFixed(2)}</td>
                                                    <td style={s.td}>{new Date(o.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ══════════════════ PRODUCTS TAB ══════════════════ */}
                {tab === 'products' && (
                    <div>
                        {isAdmin && (
                            <div style={s.toolbar}>
                                <button style={s.primaryBtn} onClick={openAdd}>+ Add Product</button>
                                <form onSubmit={handleAddCategory} style={s.catForm}>
                                    <input style={s.catInput} placeholder="New category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                                    <button type="submit" style={s.secondaryBtn}>Add Category</button>
                                </form>
                            </div>
                        )}
                        {!isAdmin && (
                            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                👁 View only — price and product management requires admin access.
                            </p>
                        )}

                        {/* Add / Edit form */}
                        {showForm && (
                            <form onSubmit={handleProductSubmit} style={s.form}>
                                <h3 style={s.formTitle}>{editingId ? 'Edit Product' : 'New Product'}</h3>
                                <div style={s.formGrid}>
                                    <div style={s.field}>
                                        <label style={s.label}>Name *</label>
                                        <input style={s.input} name="name" value={form.name} onChange={handleFormChange} required />
                                    </div>
                                    <div style={s.field}>
                                        <label style={s.label}>Price ($) *</label>
                                        <input style={s.input} name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleFormChange} required />
                                    </div>
                                    <div style={s.field}>
                                        <label style={s.label}>Stock</label>
                                        <input style={s.input} name="stock" type="number" min="0" value={form.stock} onChange={handleFormChange} />
                                    </div>
                                    <div style={s.field}>
                                        <label style={s.label}>Discount (%) 0–100</label>
                                        <input style={s.input} name="discount" type="number" min="0" max="100" value={form.discount} onChange={handleFormChange} />
                                    </div>
                                    <div style={s.field}>
                                        <label style={s.label}>Category</label>
                                        <select style={s.input} name="category_id" value={form.category_id} onChange={handleFormChange}>
                                            <option value="">None</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={s.field}>
                                        <label style={s.label}>Image URL</label>
                                        <input style={s.input} name="image_url" value={form.image_url} onChange={handleFormChange} placeholder="https://..." />
                                    </div>
                                    <div style={{ ...s.field, gridColumn: 'span 2' }}>
                                        <label style={s.label}>Description</label>
                                        <textarea style={{ ...s.input, height: '80px', resize: 'vertical' } as React.CSSProperties} name="description" value={form.description} onChange={handleFormChange} />
                                    </div>
                                </div>
                                <div style={s.formActions}>
                                    <button type="submit" style={s.primaryBtn}>{editingId ? 'Update' : 'Create'}</button>
                                    <button type="button" style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Price & Promotion table */}
                        <h3 style={s.sectionTitle}>Price &amp; Promotion Management</h3>
                        <table style={s.table}>
                            <thead>
                                <tr style={s.thead}>
                                    <th style={s.th}>Name</th>
                                    <th style={s.th}>Category</th>
                                    <th style={s.th}>Price ($)</th>
                                    <th style={s.th}>Discount (%)</th>
                                    <th style={s.th}>Final Price</th>
                                    <th style={s.th}>Stock</th>
                                    <th style={s.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => {
                                    const editing = inlineEdit[p.id];
                                    const pDiscount = editing ? parseInt(editing.discount) || 0 : p.discount || 0;
                                    const pPrice   = editing ? parseFloat(editing.price) || 0 : Number(p.price);
                                    const finalPrice = pPrice * (1 - pDiscount / 100);
                                    return (
                                        <tr key={p.id} style={s.tr}>
                                            <td style={s.td}>{p.name}</td>
                                            <td style={s.td}>{p.category_name || '—'}</td>
                                            <td style={s.td}>
                                                {editing ? (
                                                    <input type="number" step="0.01" min="0" style={s.inlineInput}
                                                        value={editing.price}
                                                        onChange={e => setInlineEdit(prev => ({ ...prev, [p.id]: { ...prev[p.id], price: e.target.value } }))} />
                                                ) : `$${Number(p.price).toFixed(2)}`}
                                            </td>
                                            <td style={s.td}>
                                                {editing ? (
                                                    <input type="number" min="0" max="100" style={s.inlineInput}
                                                        value={editing.discount}
                                                        onChange={e => setInlineEdit(prev => ({ ...prev, [p.id]: { ...prev[p.id], discount: e.target.value } }))} />
                                                ) : (
                                                    <span style={{ color: pDiscount > 0 ? '#e94560' : '#aaa' }}>
                                                        {pDiscount > 0 ? `${pDiscount}%` : '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={s.td}>
                                                <span style={{ fontWeight: pDiscount > 0 ? 700 : 400, color: pDiscount > 0 ? '#28a745' : '#444' }}>
                                                    ${finalPrice.toFixed(2)}
                                                </span>
                                                {pDiscount > 0 && <span style={s.discountBadge}>-{pDiscount}%</span>}
                                            </td>
                                            <td style={s.td}>{p.stock}</td>
                                            <td style={s.td}>
                                                {isAdmin && (
                                                    editing ? (
                                                        <>
                                                            <button style={s.saveBtn} onClick={() => saveInlineEdit(p)}>Save</button>
                                                            <button style={s.cancelSmBtn} onClick={() => cancelInlineEdit(p.id)}>✕</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button style={s.priceBtn} onClick={() => startInlineEdit(p)}>Price</button>
                                                            <button style={s.editBtn}  onClick={() => openEdit(p)}>Edit</button>
                                                            <button style={s.deleteBtn} onClick={() => handleDeleteProduct(p.id)}>Del</button>
                                                        </>
                                                    )
                                                )}
                                                {!isAdmin && <span style={{ color: '#ccc', fontSize: '0.8rem' }}>—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ══════════════════ ORDERS TAB ══════════════════ */}
                {tab === 'orders' && (
                    <div>
                        {/* Status filter */}
                        <div style={s.toolbar}>
                            <span style={s.filterLabel}>Filter:</span>
                            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
                                <button key={st}
                                    style={statusFilter === st
                                        ? { ...s.filterBtn, background: STATUS_COLORS[st] || '#1a1a2e', color: '#fff', borderColor: STATUS_COLORS[st] || '#1a1a2e' }
                                        : s.filterBtn}
                                    onClick={() => setStatusFilter(st)}>
                                    {st}
                                </button>
                            ))}
                        </div>

                        <p style={s.summary}>
                            <strong>{filteredOrders.length}</strong> order(s) &nbsp;|&nbsp;
                            Total value: <strong>${filteredTotal.toFixed(2)}</strong>
                        </p>

                        {filteredOrders.length === 0 ? (
                            <p style={s.empty}>No orders found.</p>
                        ) : (
                            <div style={s.orderList}>
                                {filteredOrders.map(order => (
                                    <div key={order.id} style={s.orderCard}>
                                        <div style={s.orderHeader}>
                                            <div>
                                                <strong>Order #{order.id}</strong>
                                                <span style={s.orderMeta}> — {order.username} ({order.email})</span>
                                                <br />
                                                <span style={s.orderDate}>{new Date(order.created_at).toLocaleString()}</span>
                                            </div>
                                            <div style={s.orderRight}>
                                                <span style={{ ...s.badge, background: STATUS_COLORS[order.status] || '#888' }}>{order.status}</span>
                                                <select style={s.statusSelect} value={order.status}
                                                    onChange={e => handleStatusChange(order.id, e.target.value)}>
                                                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
                                                        <option key={st} value={st}>{st}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div style={s.orderItems}>
                                            {order.items.map(item => (
                                                <span key={item.id} style={s.orderItem}>{item.name} x{item.quantity}</span>
                                            ))}
                                        </div>
                                        <p style={s.orderTotal}>Total: <strong>${Number(order.total).toFixed(2)}</strong></p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════ USERS TAB ══════════════════ */}
                {tab === 'users' && (
                    <div>
                        <p style={s.summary}><strong>{users.length}</strong> user(s) registered</p>
                        <table style={s.table}>
                            <thead>
                                <tr style={s.thead}>
                                    <th style={s.th}>ID</th>
                                    <th style={s.th}>Username</th>
                                    <th style={s.th}>Email</th>
                                    <th style={s.th}>Role</th>
                                    <th style={s.th}>Points / Tier</th>
                                    <th style={s.th}>Joined</th>
                                    {isAdmin && <th style={s.th}>Change Role</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={s.tr}>
                                        <td style={s.td}>{u.id}</td>
                                        <td style={s.td}>{u.username}</td>
                                        <td style={s.td}>{u.email}</td>
                                        <td style={s.td}>
                                            <span style={{ ...s.badge, background: u.role === 'admin' ? '#1a1a2e' : '#28a745' }}>{u.role}</span>
                                        </td>
                                        <td style={s.td}>
                                            <span style={{ fontWeight: 600 }}>{(u.points || 0).toLocaleString()} pts</span>
                                            <br />
                                            <span style={{ fontSize: '0.75rem', color: '#888' }}>{u.tier || 'Bronze'}</span>
                                        </td>
                                        <td style={s.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                                        {isAdmin && (
                                            <td style={s.td}>
                                                <select style={s.statusSelect} value={u.role}
                                                    onChange={e => handleRoleChange(u.id, e.target.value)}>
                                                    <option value="customer">customer</option>
                                                    <option value="sales">sales</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Stat card sub-component ───────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; color: string; sub?: string }> = ({ label, value, color, sub }) => (
    <div style={{ ...s.statCard, borderLeft: `4px solid ${color}` }}>
        <p style={s.statLabel}>{label}</p>
        <p style={{ ...s.statValue, color }}>{value}</p>
        {sub && <p style={s.statSub}>{sub}</p>}
    </div>
);

// ── Styles ────────────────────────────────────────────
const s: { [k: string]: React.CSSProperties } = {
    page:       { minHeight: '100vh', background: '#f4f6f9' },
    container:  { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
    pageTitle:  { fontSize: '1.7rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.75rem' },
    flash:      { padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' },
    loading:    { textAlign: 'center', color: '#888', padding: '2rem' },
    tabs:       { display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' },
    tab:        { padding: '0.5rem 1.4rem', border: '1px solid #ddd', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' },
    tabActive:  { padding: '0.5rem 1.4rem', border: '1px solid #1a1a2e', background: '#1a1a2e', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' },

    // stat cards
    statGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' },
    statCard:   { background: '#fff', padding: '1.25rem 1.5rem', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
    statLabel:  { margin: '0 0 0.4rem', fontSize: '0.85rem', color: '#888', fontWeight: 500 },
    statValue:  { margin: 0, fontSize: '1.8rem', fontWeight: 700 },
    statSub:    { margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#aaa' },

    // order status summary
    section:      { background: '#fff', padding: '1.25rem 1.5rem', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '1.5rem' },
    sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1rem' },
    statusGrid:   { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    statusCard:   { flex: '1 1 100px', border: '2px solid #ddd', borderRadius: '8px', padding: '0.75rem 1rem', textAlign: 'center' },
    dot:          { width: '10px', height: '10px', borderRadius: '50%', margin: '0 auto 0.4rem' },
    statusLabel:  { fontSize: '0.8rem', color: '#666', margin: '0 0 0.25rem' },
    statusCount:  { fontSize: '1.5rem', fontWeight: 700, margin: 0 },

    // low stock
    alertList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    alertItem: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#fff9f0', borderRadius: '6px', fontSize: '0.9rem' },

    // table
    table:  { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
    thead:  { background: '#1a1a2e', color: '#fff' },
    th:     { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600 },
    tr:     { borderBottom: '1px solid #f0f0f0' },
    td:     { padding: '0.65rem 1rem', fontSize: '0.88rem', color: '#444' },
    badge:  { padding: '0.2rem 0.65rem', borderRadius: '20px', color: '#fff', fontSize: '0.75rem', fontWeight: 600 },

    // products toolbar / form
    toolbar:     { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' },
    catForm:     { display: 'flex', gap: '0.5rem' },
    catInput:    { padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' },
    form:        { background: '#fff', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '1.5rem' },
    formTitle:   { margin: '0 0 1rem', color: '#1a1a2e', fontWeight: 700 },
    formGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    field:       { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    label:       { fontSize: '0.82rem', color: '#555', fontWeight: 500 },
    input:       { padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' },
    formActions: { display: 'flex', gap: '0.75rem', marginTop: '1rem' },

    // inline price edit
    inlineInput:    { width: '80px', padding: '0.3rem 0.5rem', border: '1px solid #007bff', borderRadius: '4px', fontSize: '0.85rem' },
    discountBadge:  { marginLeft: '6px', background: '#e94560', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 },

    // buttons
    primaryBtn:  { padding: '0.55rem 1.2rem', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
    secondaryBtn:{ padding: '0.55rem 1.2rem', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
    cancelBtn:   { padding: '0.55rem 1.2rem', border: '1px solid #ccc', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
    saveBtn:     { padding: '0.3rem 0.7rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '4px' },
    cancelSmBtn: { padding: '0.3rem 0.6rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
    priceBtn:    { padding: '0.3rem 0.6rem', border: '1px solid #007bff', color: '#007bff', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' },
    editBtn:     { padding: '0.3rem 0.6rem', border: '1px solid #6c757d', color: '#6c757d', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' },
    deleteBtn:   { padding: '0.3rem 0.6rem', border: '1px solid #dc3545', color: '#dc3545', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem' },

    // orders
    filterLabel:  { fontSize: '0.85rem', color: '#555', fontWeight: 500 },
    filterBtn:    { padding: '0.35rem 0.85rem', border: '1px solid #ddd', background: '#fff', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem' },
    summary:      { color: '#555', fontSize: '0.9rem', marginBottom: '1rem' },
    empty:        { textAlign: 'center', color: '#888', padding: '2rem' },
    orderList:    { display: 'flex', flexDirection: 'column', gap: '1rem' },
    orderCard:    { background: '#fff', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
    orderHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' },
    orderMeta:    { color: '#888', fontSize: '0.88rem' },
    orderDate:    { fontSize: '0.78rem', color: '#aaa' },
    orderRight:   { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    orderItems:   { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' },
    orderItem:    { background: '#f0f0f0', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', color: '#555' },
    orderTotal:   { textAlign: 'right', color: '#1a1a2e', margin: 0 },
    statusSelect: { padding: '0.3rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' },
};

export default AdminDashboard;

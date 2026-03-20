import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

type Tab = 'products' | 'orders' | 'users';

interface Category { id: number; name: string; }
interface Product { id: number; name: string; description: string; price: number; stock: number; category_id?: number; image_url?: string; category_name?: string; }
interface OrderItem { id: number; name: string; quantity: number; price: number; }
interface Order { id: number; username: string; email: string; status: string; total: number; created_at: string; items: OrderItem[]; }
interface User { id: number; username: string; email: string; role: string; created_at: string; }

const statusColors: Record<string, string> = {
    pending: '#f0a500', processing: '#007bff', shipped: '#17a2b8',
    delivered: '#28a745', cancelled: '#dc3545'
};

const emptyProduct = { name: '', description: '', price: '', stock: '', category_id: '', image_url: '' };

const AdminPanel: React.FC = () => {
    const [tab, setTab] = useState<Tab>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<Record<string, string>>(emptyProduct);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [msg, setMsg] = useState('');
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 2500); };

    const loadProducts = () => {
        Promise.all([
            axios.get('/api/products', { headers }),
            axios.get('/api/products/categories', { headers })
        ]).then(([p, c]) => { setProducts(p.data); setCategories(c.data); });
    };

    const loadOrders = () => {
        axios.get('/api/orders', { headers }).then(r => setOrders(r.data));
    };

    const loadUsers = () => {
        axios.get('/api/users', { headers }).then(r => setUsers(r.data));
    };

    useEffect(() => {
        setLoading(true);
        if (tab === 'products') loadProducts();
        if (tab === 'orders') loadOrders();
        if (tab === 'users') loadUsers();
        setLoading(false);
    }, [tab]);

    // --- Products ---
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const openAdd = () => { setForm(emptyProduct); setEditingId(null); setShowForm(true); };
    const openEdit = (p: Product) => {
        setForm({
            name: p.name, description: p.description || '', price: String(p.price),
            stock: String(p.stock), category_id: p.category_id ? String(p.category_id) : '', image_url: p.image_url || ''
        });
        setEditingId(p.id);
        setShowForm(true);
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: form.name, description: form.description,
            price: parseFloat(form.price), stock: parseInt(form.stock) || 0,
            category_id: form.category_id ? parseInt(form.category_id) : null,
            image_url: form.image_url || null
        };
        try {
            if (editingId) {
                await axios.put(`/api/products/${editingId}`, payload, { headers });
                flash('Product updated.');
            } else {
                await axios.post('/api/products', payload, { headers });
                flash('Product created.');
            }
            setShowForm(false);
            loadProducts();
        } catch (err: any) {
            flash(err.response?.data?.message || 'Error saving product');
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Delete this product?')) return;
        await axios.delete(`/api/products/${id}`, { headers });
        flash('Product deleted.');
        loadProducts();
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        await axios.post('/api/products/categories/new', { name: newCategory }, { headers });
        setNewCategory('');
        flash('Category added.');
        loadProducts();
    };

    // --- Orders ---
    const handleStatusChange = async (orderId: number, status: string) => {
        await axios.patch(`/api/orders/${orderId}/status`, { status }, { headers });
        flash('Order status updated.');
        loadOrders();
    };

    // --- Users ---
    const handleRoleChange = async (userId: number, role: string) => {
        await axios.patch(`/api/users/${userId}/role`, { role }, { headers });
        flash('User role updated.');
        loadUsers();
    };

    return (
        <div style={styles.page}>
            <Navbar />
            <div style={styles.container}>
                <h2 style={styles.title}>Admin Panel</h2>
                {msg && <div style={styles.flash}>{msg}</div>}

                <div style={styles.tabs}>
                    {(['products', 'orders', 'users'] as Tab[]).map(t => (
                        <button key={t} style={tab === t ? styles.tabActive : styles.tab} onClick={() => setTab(t)}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {loading && <p style={styles.loading}>Loading...</p>}

                {/* PRODUCTS TAB */}
                {tab === 'products' && (
                    <div>
                        <div style={styles.toolbar}>
                            <button style={styles.primaryBtn} onClick={openAdd}>+ Add Product</button>
                            <form onSubmit={handleAddCategory} style={styles.catForm}>
                                <input
                                    style={styles.catInput}
                                    placeholder="New category name"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                />
                                <button type="submit" style={styles.secondaryBtn}>Add Category</button>
                            </form>
                        </div>

                        {showForm && (
                            <form onSubmit={handleProductSubmit} style={styles.form}>
                                <h3 style={styles.formTitle}>{editingId ? 'Edit Product' : 'New Product'}</h3>
                                <div style={styles.formGrid}>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Name *</label>
                                        <input style={styles.input} name="name" value={form.name} onChange={handleFormChange} required />
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Price *</label>
                                        <input style={styles.input} name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleFormChange} required />
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Stock</label>
                                        <input style={styles.input} name="stock" type="number" min="0" value={form.stock} onChange={handleFormChange} />
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Category</label>
                                        <select style={styles.input} name="category_id" value={form.category_id} onChange={handleFormChange}>
                                            <option value="">None</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ ...styles.field, gridColumn: 'span 2' }}>
                                        <label style={styles.label}>Image URL</label>
                                        <input style={styles.input} name="image_url" value={form.image_url} onChange={handleFormChange} placeholder="https://..." />
                                    </div>
                                    <div style={{ ...styles.field, gridColumn: 'span 2' }}>
                                        <label style={styles.label}>Description</label>
                                        <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' } as React.CSSProperties} name="description" value={form.description} onChange={handleFormChange} />
                                    </div>
                                </div>
                                <div style={styles.formActions}>
                                    <button type="submit" style={styles.primaryBtn}>{editingId ? 'Update' : 'Create'}</button>
                                    <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </form>
                        )}

                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thead}>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Category</th>
                                    <th style={styles.th}>Price</th>
                                    <th style={styles.th}>Stock</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} style={styles.tr}>
                                        <td style={styles.td}>{p.id}</td>
                                        <td style={styles.td}>{p.name}</td>
                                        <td style={styles.td}>{p.category_name || '—'}</td>
                                        <td style={styles.td}>${Number(p.price).toFixed(2)}</td>
                                        <td style={styles.td}>{p.stock}</td>
                                        <td style={styles.td}>
                                            <button style={styles.editBtn} onClick={() => openEdit(p)}>Edit</button>
                                            <button style={styles.deleteBtn} onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ORDERS TAB */}
                {tab === 'orders' && (
                    <div>
                        {orders.length === 0 ? <p style={styles.empty}>No orders yet.</p> : (
                            <div style={styles.orderList}>
                                {orders.map(order => (
                                    <div key={order.id} style={styles.orderCard}>
                                        <div style={styles.orderHeader}>
                                            <div>
                                                <strong>Order #{order.id}</strong>
                                                <span style={styles.orderMeta}> — {order.username} ({order.email})</span>
                                                <span style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</span>
                                            </div>
                                            <div style={styles.orderRight}>
                                                <span style={{ ...styles.statusBadge, backgroundColor: statusColors[order.status] || '#888' }}>
                                                    {order.status}
                                                </span>
                                                <select
                                                    style={styles.statusSelect}
                                                    value={order.status}
                                                    onChange={e => handleStatusChange(order.id, e.target.value)}
                                                >
                                                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div style={styles.orderItems}>
                                            {order.items.map(item => (
                                                <span key={item.id} style={styles.orderItem}>
                                                    {item.name} x{item.quantity}
                                                </span>
                                            ))}
                                        </div>
                                        <p style={styles.orderTotal}>Total: <strong>${Number(order.total).toFixed(2)}</strong></p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* USERS TAB */}
                {tab === 'users' && (
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thead}>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Username</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Joined</th>
                                <th style={styles.th}>Change Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={styles.tr}>
                                    <td style={styles.td}>{u.id}</td>
                                    <td style={styles.td}>{u.username}</td>
                                    <td style={styles.td}>{u.email}</td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.roleBadge, backgroundColor: u.role === 'admin' ? '#1a1a2e' : '#28a745' }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td style={styles.td}>
                                        <select
                                            style={styles.roleSelect}
                                            value={u.role}
                                            onChange={e => handleRoleChange(u.id, e.target.value)}
                                        >
                                            <option value="customer">customer</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', backgroundColor: '#f4f6f9' },
    container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' },
    title: { fontSize: '1.6rem', fontWeight: 700, marginBottom: '1rem', color: '#1a1a2e' },
    flash: {
        padding: '0.75rem 1rem', backgroundColor: '#d4edda', color: '#155724',
        borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem'
    },
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
    tab: {
        padding: '0.5rem 1.5rem', border: '1px solid #ddd', background: '#fff',
        borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem'
    },
    tabActive: {
        padding: '0.5rem 1.5rem', border: '1px solid #1a1a2e', background: '#1a1a2e',
        color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem'
    },
    loading: { color: '#888', textAlign: 'center' },
    toolbar: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' },
    catForm: { display: 'flex', gap: '0.5rem' },
    catInput: { padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' },
    form: {
        background: '#fff', padding: '1.5rem', borderRadius: '10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '1.5rem'
    },
    formTitle: { margin: '0 0 1rem', color: '#1a1a2e' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    field: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    label: { fontSize: '0.85rem', color: '#555', fontWeight: 500 },
    input: { padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' },
    formActions: { display: 'flex', gap: '0.75rem', marginTop: '1rem' },
    primaryBtn: {
        padding: '0.55rem 1.2rem', backgroundColor: '#1a1a2e', color: '#fff',
        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
    },
    secondaryBtn: {
        padding: '0.55rem 1.2rem', backgroundColor: '#6c757d', color: '#fff',
        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
    },
    cancelBtn: {
        padding: '0.55rem 1.2rem', border: '1px solid #ccc', background: '#fff',
        borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
    },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
    thead: { backgroundColor: '#1a1a2e', color: '#fff' },
    th: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 },
    tr: { borderBottom: '1px solid #f0f0f0' },
    td: { padding: '0.7rem 1rem', fontSize: '0.9rem', color: '#444' },
    editBtn: {
        padding: '0.3rem 0.7rem', marginRight: '0.4rem', border: '1px solid #007bff',
        color: '#007bff', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
    },
    deleteBtn: {
        padding: '0.3rem 0.7rem', border: '1px solid #dc3545',
        color: '#dc3545', background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
    },
    empty: { textAlign: 'center', color: '#888', padding: '2rem' },
    orderList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    orderCard: {
        background: '#fff', borderRadius: '10px', padding: '1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
    },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' },
    orderMeta: { color: '#888', fontSize: '0.9rem' },
    orderDate: { display: 'block', fontSize: '0.8rem', color: '#aaa', marginTop: '0.2rem' },
    orderRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    statusBadge: { padding: '0.25rem 0.75rem', borderRadius: '20px', color: '#fff', fontSize: '0.8rem', fontWeight: 600 },
    statusSelect: { padding: '0.3rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' },
    orderItems: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' },
    orderItem: { background: '#f0f0f0', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', color: '#555' },
    orderTotal: { textAlign: 'right', color: '#1a1a2e' },
    roleBadge: { padding: '0.2rem 0.6rem', borderRadius: '20px', color: '#fff', fontSize: '0.75rem' },
    roleSelect: { padding: '0.3rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }
};

export default AdminPanel;

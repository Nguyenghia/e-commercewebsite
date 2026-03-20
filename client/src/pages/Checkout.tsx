import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';

const Checkout: React.FC = () => {
    const { items, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;
        setLoading(true);
        setError('');
        try {
            await axios.post('/api/orders', {
                items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                shipping_address: address
            }, { headers: { Authorization: `Bearer ${token}` } });
            clearCart();
            navigate('/orders');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div style={styles.page}>
                <Navbar />
                <div style={styles.container}>
                    <p style={styles.empty}>Your cart is empty. <button style={styles.link} onClick={() => navigate('/shop')}>Go to shop</button></p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <Navbar />
            <div style={styles.container}>
                <h2 style={styles.title}>Checkout</h2>
                <div style={styles.layout}>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <h3 style={styles.sectionTitle}>Shipping Address</h3>
                        {error && <p style={styles.error}>{error}</p>}
                        <textarea
                            style={styles.textarea}
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Enter your full shipping address..."
                            required
                            rows={4}
                        />
                        <button type="submit" style={styles.placeBtn} disabled={loading}>
                            {loading ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </form>
                    <div style={styles.summary}>
                        <h3 style={styles.sectionTitle}>Order Summary</h3>
                        {items.map(item => (
                            <div key={item.productId} style={styles.summaryItem}>
                                <span>{item.name} x{item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <hr style={styles.hr} />
                        <div style={styles.total}>
                            <span>Total</span>
                            <span style={styles.totalAmount}>${totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', backgroundColor: '#f4f6f9' },
    container: { maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem' },
    title: { fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1a1a2e' },
    layout: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
    form: {
        flex: 1, minWidth: '280px', background: '#fff', padding: '1.5rem',
        borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column', gap: '1rem'
    },
    sectionTitle: { fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#1a1a2e' },
    error: { color: '#e94560', fontSize: '0.85rem', margin: 0 },
    textarea: {
        padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px',
        fontSize: '0.95rem', resize: 'vertical', outline: 'none'
    },
    placeBtn: {
        padding: '0.85rem', backgroundColor: '#e94560', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600
    },
    summary: {
        width: '280px', background: '#fff', padding: '1.5rem',
        borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', alignSelf: 'flex-start'
    },
    summaryItem: {
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.9rem', marginBottom: '0.5rem', color: '#555'
    },
    hr: { border: 'none', borderTop: '1px solid #eee', margin: '0.75rem 0' },
    total: { display: 'flex', justifyContent: 'space-between', fontWeight: 700 },
    totalAmount: { color: '#e94560', fontSize: '1.1rem' },
    empty: { textAlign: 'center', color: '#888', padding: '3rem' },
    link: {
        background: 'none', border: 'none', color: '#1a1a2e',
        cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit'
    }
};

export default Checkout;

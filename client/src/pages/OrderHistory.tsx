import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

interface OrderItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    status: string;
    total: number;
    shipping_address: string;
    created_at: string;
    items: OrderItem[];
}

const statusColors: Record<string, string> = {
    pending: '#f0a500',
    processing: '#007bff',
    shipped: '#17a2b8',
    delivered: '#28a745',
    cancelled: '#dc3545'
};

const OrderHistory: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        axios.get('http://localhost:5000/api/orders/my', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setOrders(res.data))
            .finally(() => setLoading(false));
    }, [token]);

    return (
        <div style={styles.page}>
            <Navbar />
            <div style={styles.container}>
                <h2 style={styles.title}>My Orders</h2>
                {loading ? (
                    <p style={styles.loading}>Loading orders...</p>
                ) : orders.length === 0 ? (
                    <p style={styles.empty}>You have no orders yet.</p>
                ) : (
                    <div style={styles.list}>
                        {orders.map(order => (
                            <div key={order.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <div>
                                        <span style={styles.orderId}>Order #{order.id}</span>
                                        <span style={styles.date}>{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <span style={{ ...styles.status, backgroundColor: statusColors[order.status] || '#888' }}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </div>
                                <div style={styles.items}>
                                    {order.items.map(item => (
                                        <div key={item.id} style={styles.item}>
                                            <span>{item.name}</span>
                                            <span style={styles.itemMeta}>x{item.quantity} — ${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                {order.shipping_address && (
                                    <p style={styles.address}>Ship to: {order.shipping_address}</p>
                                )}
                                <p style={styles.total}>Total: <strong>${Number(order.total).toFixed(2)}</strong></p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', backgroundColor: '#f4f6f9' },
    container: { maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' },
    title: { fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1a1a2e' },
    loading: { color: '#888', textAlign: 'center', padding: '2rem' },
    empty: { color: '#888', textAlign: 'center', padding: '3rem' },
    list: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    card: {
        background: '#fff', borderRadius: '10px', padding: '1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
    },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
    orderId: { fontWeight: 700, color: '#1a1a2e', marginRight: '0.75rem' },
    date: { fontSize: '0.85rem', color: '#888' },
    status: {
        padding: '0.25rem 0.75rem', borderRadius: '20px', color: '#fff',
        fontSize: '0.8rem', fontWeight: 600
    },
    items: { borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem', marginBottom: '0.5rem' },
    item: {
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.9rem', padding: '0.2rem 0', color: '#555'
    },
    itemMeta: { color: '#888' },
    address: { fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' },
    total: { textAlign: 'right', color: '#1a1a2e', marginTop: '0.5rem' }
};

export default OrderHistory;

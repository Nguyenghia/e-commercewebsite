import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';

const Cart: React.FC = () => {
    const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
    const navigate = useNavigate();

    return (
        <div style={styles.page}>
            <Navbar />
            <div style={styles.container}>
                <h2 style={styles.title}>Your Cart</h2>
                {items.length === 0 ? (
                    <div style={styles.empty}>
                        <p>Your cart is empty.</p>
                        <button onClick={() => navigate('/shop')} style={styles.shopBtn}>Continue Shopping</button>
                    </div>
                ) : (
                    <div style={styles.layout}>
                        <div style={styles.items}>
                            {items.map(item => (
                                <div key={item.productId} style={styles.item}>
                                    <div style={styles.itemImage}>
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} style={styles.img} />
                                        ) : (
                                            <div style={styles.imgPlaceholder} />
                                        )}
                                    </div>
                                    <div style={styles.itemInfo}>
                                        <p style={styles.itemName}>{item.name}</p>
                                        <p style={styles.itemPrice}>${Number(item.price).toFixed(2)} each</p>
                                    </div>
                                    <div style={styles.qtyControls}>
                                        <button style={styles.qtyBtn} onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                                        <span style={styles.qty}>{item.quantity}</span>
                                        <button style={styles.qtyBtn} onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                                    </div>
                                    <p style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                                    <button style={styles.removeBtn} onClick={() => removeFromCart(item.productId)}>Remove</button>
                                </div>
                            ))}
                        </div>
                        <div style={styles.summary}>
                            <h3 style={styles.summaryTitle}>Order Summary</h3>
                            <div style={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            <hr style={styles.hr} />
                            <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '1.1rem' }}>
                                <span>Total</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            <button onClick={() => navigate('/checkout')} style={styles.checkoutBtn}>
                                Proceed to Checkout
                            </button>
                            <button onClick={() => navigate('/shop')} style={styles.continueBtn}>
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', backgroundColor: '#f4f6f9' },
    container: { maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' },
    title: { fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1a1a2e' },
    empty: { textAlign: 'center', padding: '3rem', color: '#888' },
    shopBtn: {
        marginTop: '1rem', padding: '0.7rem 1.5rem', backgroundColor: '#1a1a2e',
        color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer'
    },
    layout: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
    items: { flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' },
    item: {
        background: '#fff', borderRadius: '10px', padding: '1rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
    },
    itemImage: { width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    imgPlaceholder: { width: '100%', height: '100%', background: '#e9ecef' },
    itemInfo: { flex: 1 },
    itemName: { fontWeight: 600, margin: 0, color: '#1a1a2e' },
    itemPrice: { fontSize: '0.85rem', color: '#888', margin: '0.2rem 0 0' },
    qtyControls: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    qtyBtn: {
        width: '28px', height: '28px', border: '1px solid #ddd', background: '#f8f9fa',
        borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
    },
    qty: { minWidth: '24px', textAlign: 'center', fontWeight: 600 },
    itemTotal: { fontWeight: 700, color: '#e94560', minWidth: '60px', textAlign: 'right' },
    removeBtn: {
        padding: '0.3rem 0.7rem', border: '1px solid #e94560', color: '#e94560',
        background: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
    },
    summary: {
        width: '280px', background: '#fff', borderRadius: '10px', padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', alignSelf: 'flex-start'
    },
    summaryTitle: { fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1a1a2e' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
    hr: { border: 'none', borderTop: '1px solid #eee', margin: '0.75rem 0' },
    checkoutBtn: {
        width: '100%', padding: '0.8rem', backgroundColor: '#e94560', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem',
        marginTop: '1rem', fontWeight: 600
    },
    continueBtn: {
        width: '100%', padding: '0.7rem', backgroundColor: 'transparent', color: '#1a1a2e',
        border: '1px solid #1a1a2e', borderRadius: '8px', cursor: 'pointer',
        fontSize: '0.9rem', marginTop: '0.75rem'
    }
};

export default Cart;

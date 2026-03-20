import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const TIER_COLORS: Record<string, string> = {
    Platinum: '#a855f7',
    Gold:     '#f59e0b',
    Silver:   '#94a3b8',
    Bronze:   '#b45309',
};

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { totalItems } = useCart();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isStaff = user?.role === 'admin' || user?.role === 'sales';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        navigate('/login');
    };

    return (
        <nav style={s.nav}>
            <Link to={isStaff ? '/admin' : '/shop'} style={s.brand}>ShopZone</Link>
            <div style={s.links}>
                {isStaff ? (
                    <>
                        <Link to="/admin" style={s.link}>Dashboard</Link>
                        <Link to="/shop"  style={s.link}>Shop</Link>
                    </>
                ) : (
                    <>
                        <Link to="/shop"    style={s.link}>Shop</Link>
                        <Link to="/orders"  style={s.link}>My Orders</Link>
                        <Link to="/profile" style={s.link}>Profile</Link>
                        <Link to="/cart" style={s.cartLink}>
                            Cart
                            {totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
                        </Link>
                    </>
                )}

                {/* Tier badge — customers only */}
                {user?.tier && !isStaff && (
                    <span style={{ ...s.tierBadge, background: TIER_COLORS[user.tier] || '#888' }}>
                        {user.tier}
                    </span>
                )}

                <span style={s.username}>{user?.username}</span>
                <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
            </div>
        </nav>
    );
};

const s: { [k: string]: React.CSSProperties } = {
    nav: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 2rem', backgroundColor: '#1a1a2e', color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 100,
    },
    brand:    { color: '#fff', textDecoration: 'none', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '1px' },
    links:    { display: 'flex', alignItems: 'center', gap: '1.2rem' },
    link:     { color: '#ccc', textDecoration: 'none', fontSize: '0.95rem' },
    cartLink: { color: '#fff', textDecoration: 'none', fontSize: '0.95rem', position: 'relative', paddingRight: '0.5rem' },
    badge:    { backgroundColor: '#e94560', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem', marginLeft: '4px' },
    tierBadge:{ padding: '0.2rem 0.65rem', borderRadius: '20px', color: '#fff', fontSize: '0.72rem', fontWeight: 700 },
    username: { color: '#aaa', fontSize: '0.85rem' },
    logoutBtn:{ padding: '0.4rem 0.9rem', backgroundColor: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
};

export default Navbar;

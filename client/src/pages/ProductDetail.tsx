import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    image_url?: string;
    category_name?: string;
}

const ProductDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();
    const token = localStorage.getItem('token');

    useEffect(() => {
        axios.get(`http://localhost:5000/api/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setProduct(res.data))
            .catch(() => navigate('/shop'))
            .finally(() => setLoading(false));
    }, [id, token, navigate]);

    const handleAddToCart = () => {
        if (!product) return;
        addToCart({ productId: product.id, name: product.name, price: product.price, image_url: product.image_url });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) return <><Navbar /><div style={styles.loading}>Loading...</div></>;
    if (!product) return null;

    return (
        <div style={styles.page}>
            <Navbar />
            <div style={styles.container}>
                <button onClick={() => navigate('/shop')} style={styles.backBtn}>← Back to Shop</button>
                <div style={styles.detail}>
                    <div style={styles.imageBox}>
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} style={styles.image} />
                        ) : (
                            <div style={styles.imagePlaceholder}>No Image</div>
                        )}
                    </div>
                    <div style={styles.info}>
                        <p style={styles.categoryTag}>{product.category_name || 'Uncategorized'}</p>
                        <h1 style={styles.name}>{product.name}</h1>
                        <p style={styles.price}>${Number(product.price).toFixed(2)}</p>
                        <p style={styles.description}>{product.description || 'No description available.'}</p>
                        <p style={styles.stock}>
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </p>
                        <button
                            style={product.stock > 0 ? styles.addBtn : styles.addBtnDisabled}
                            disabled={product.stock === 0}
                            onClick={handleAddToCart}
                        >
                            {added ? 'Added!' : product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', backgroundColor: '#f4f6f9' },
    container: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' },
    loading: { textAlign: 'center', padding: '3rem', color: '#555' },
    backBtn: {
        background: 'none', border: 'none', color: '#1a1a2e', cursor: 'pointer',
        fontSize: '0.95rem', marginBottom: '1.5rem', padding: 0
    },
    detail: { display: 'flex', gap: '2rem', background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexWrap: 'wrap' },
    imageBox: { flex: '0 0 320px', height: '320px', borderRadius: '8px', overflow: 'hidden' },
    image: { width: '100%', height: '100%', objectFit: 'cover' },
    imagePlaceholder: {
        width: '100%', height: '100%', background: '#e9ecef',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa'
    },
    info: { flex: 1, minWidth: '220px' },
    categoryTag: { fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' },
    name: { fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#1a1a2e' },
    price: { fontSize: '1.5rem', fontWeight: 700, color: '#e94560', marginBottom: '1rem' },
    description: { color: '#555', lineHeight: 1.6, marginBottom: '1rem' },
    stock: { fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' },
    addBtn: {
        padding: '0.8rem 2rem', backgroundColor: '#1a1a2e', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
    },
    addBtnDisabled: {
        padding: '0.8rem 2rem', backgroundColor: '#ccc', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '1rem'
    }
};

export default ProductDetail;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

interface Category {
    id: number;
    name: string;
}

const Shop: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            axios.get('/api/products', { headers }),
            axios.get('/api/products/categories', { headers })
        ]).then(([prodRes, catRes]) => {
            setProducts(prodRes.data);
            setCategories(catRes.data);
        }).finally(() => setLoading(false));
    }, [token]);

    const filtered = products.filter(p => {
        const matchCat = selectedCategory === null || p.category_name === categories.find(c => c.id === selectedCategory)?.name;
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    if (loading) return <><Navbar /><div style={styles.loading}>Loading products...</div></>;

    return (
        <div style={styles.page}>
            <Navbar />
            <div style={styles.container}>
                <div style={styles.toolbar}>
                    <input
                        style={styles.search}
                        placeholder="Search products..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div style={styles.filters}>
                        <button
                            style={selectedCategory === null ? styles.filterActive : styles.filterBtn}
                            onClick={() => setSelectedCategory(null)}
                        >All</button>
                        {categories.map(c => (
                            <button
                                key={c.id}
                                style={selectedCategory === c.id ? styles.filterActive : styles.filterBtn}
                                onClick={() => setSelectedCategory(c.id)}
                            >{c.name}</button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <p style={styles.empty}>No products found.</p>
                ) : (
                    <div style={styles.grid}>
                        {filtered.map(product => (
                            <div key={product.id} style={styles.card}>
                                <div
                                    style={styles.imageBox}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                >
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} style={styles.image} />
                                    ) : (
                                        <div style={styles.imagePlaceholder}>No Image</div>
                                    )}
                                </div>
                                <div style={styles.cardBody}>
                                    <p style={styles.categoryTag}>{product.category_name || 'Uncategorized'}</p>
                                    <h3
                                        style={styles.productName}
                                        onClick={() => navigate(`/product/${product.id}`)}
                                    >{product.name}</h3>
                                    <p style={styles.price}>${Number(product.price).toFixed(2)}</p>
                                    <p style={styles.stock}>
                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                    </p>
                                    <button
                                        style={product.stock > 0 ? styles.addBtn : styles.addBtnDisabled}
                                        disabled={product.stock === 0}
                                        onClick={() => addToCart({
                                            productId: product.id,
                                            name: product.name,
                                            price: product.price,
                                            image_url: product.image_url
                                        })}
                                    >
                                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>
                                </div>
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
    container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
    loading: { textAlign: 'center', padding: '3rem', color: '#555' },
    toolbar: { display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', alignItems: 'center' },
    search: {
        padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #ddd',
        fontSize: '0.95rem', width: '250px', outline: 'none'
    },
    filters: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
    filterBtn: {
        padding: '0.4rem 1rem', border: '1px solid #ccc', borderRadius: '20px',
        background: '#fff', cursor: 'pointer', fontSize: '0.85rem'
    },
    filterActive: {
        padding: '0.4rem 1rem', border: '1px solid #1a1a2e', borderRadius: '20px',
        background: '#1a1a2e', color: '#fff', cursor: 'pointer', fontSize: '0.85rem'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1.5rem'
    },
    card: {
        background: '#fff', borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden',
        transition: 'transform 0.2s', cursor: 'default'
    },
    imageBox: { height: '180px', overflow: 'hidden', cursor: 'pointer' },
    image: { width: '100%', height: '100%', objectFit: 'cover' },
    imagePlaceholder: {
        width: '100%', height: '100%', background: '#e9ecef',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#aaa', fontSize: '0.9rem'
    },
    cardBody: { padding: '1rem' },
    categoryTag: { fontSize: '0.75rem', color: '#888', margin: '0 0 0.3rem' },
    productName: {
        margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600,
        cursor: 'pointer', color: '#1a1a2e'
    },
    price: { fontSize: '1.1rem', fontWeight: 700, color: '#e94560', margin: '0 0 0.3rem' },
    stock: { fontSize: '0.8rem', color: '#888', margin: '0 0 0.8rem' },
    addBtn: {
        width: '100%', padding: '0.6rem', backgroundColor: '#1a1a2e',
        color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
    },
    addBtnDisabled: {
        width: '100%', padding: '0.6rem', backgroundColor: '#ccc',
        color: '#fff', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontSize: '0.9rem'
    },
    empty: { textAlign: 'center', color: '#888', fontSize: '1.1rem', marginTop: '3rem' }
};

export default Shop;

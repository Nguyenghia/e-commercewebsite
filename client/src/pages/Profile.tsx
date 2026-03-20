import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

interface Order {
    id: number; status: string; total: number;
    points_earned: number; created_at: string;
}
interface ProfileData {
    id: number; username: string; email: string;
    role: string; points: number; tier: string;
    tierColor: string; created_at: string; orders: Order[];
}

const TIERS = [
    { name: 'Bronze',   min: 0,     max: 999,   color: '#b45309' },
    { name: 'Silver',   min: 1000,  max: 4999,  color: '#94a3b8' },
    { name: 'Gold',     min: 5000,  max: 9999,  color: '#f59e0b' },
    { name: 'Platinum', min: 10000, max: null,   color: '#a855f7' },
];

const STATUS_COLORS: Record<string, string> = {
    pending: '#f0a500', processing: '#007bff', shipped: '#17a2b8',
    delivered: '#28a745', cancelled: '#dc3545',
};

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState<'success' | 'error'>('success');
    const token = localStorage.getItem('token');

    const flash = (text: string, type: 'success' | 'error' = 'success') => {
        setMsg(text); setMsgType(type);
        setTimeout(() => setMsg(''), 3500);
    };

    const loadProfile = () => {
        axios.get('http://localhost:5000/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => {
            setProfile(r.data);
            setUsername(r.data.username);
            setEmail(r.data.email);
        }).catch(() => flash('Failed to load profile', 'error'));
    };

    useEffect(() => { loadProfile(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.put('http://localhost:5000/api/users/profile',
                { username, email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update localStorage with fresh token + user data
            localStorage.setItem('token', res.data.token);
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...stored, ...res.data.user }));
            setEditing(false);
            flash('Profile updated successfully!');
            loadProfile();
        } catch (err: any) {
            flash(err.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!profile) return (
        <div style={s.page}><Navbar /><p style={s.loading}>Loading profile...</p></div>
    );

    const tierInfo = TIERS.find(t => t.name === profile.tier) || TIERS[0];
    const nextTier = TIERS[TIERS.indexOf(tierInfo) + 1] || null;
    const progress = nextTier
        ? Math.min(100, ((profile.points - tierInfo.min) / (nextTier.min - tierInfo.min)) * 100)
        : 100;
    const pointsToNext = nextTier ? nextTier.min - profile.points : 0;

    const tierEmoji: Record<string, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

    return (
        <div style={s.page}>
            <Navbar />
            <div style={s.container}>

                {msg && (
                    <div style={{ ...s.flash, background: msgType === 'error' ? '#f8d7da' : '#d4edda', color: msgType === 'error' ? '#721c24' : '#155724' }}>
                        {msg}
                    </div>
                )}

                <div style={s.grid}>

                    {/* ── Left column ── */}
                    <div style={s.leftCol}>

                        {/* Avatar + tier */}
                        <div style={s.avatarCard}>
                            <div style={{ ...s.avatar, background: tierInfo.color }}>
                                {profile.username.charAt(0).toUpperCase()}
                            </div>
                            <h2 style={s.avatarName}>{profile.username}</h2>
                            <span style={{ ...s.tierBadge, background: tierInfo.color }}>
                                {tierEmoji[profile.tier]} {profile.tier}
                            </span>
                            <p style={s.memberSince}>
                                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </p>
                        </div>

                        {/* Membership card */}
                        <div style={{ ...s.memberCard, borderColor: tierInfo.color }}>
                            <h3 style={s.memberTitle}>Membership Points</h3>

                            <div style={s.pointsRow}>
                                <span style={s.pointsLabel}>Total Points</span>
                                <span style={{ ...s.pointsVal, color: tierInfo.color }}>
                                    {profile.points.toLocaleString()} pts
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div style={s.progressWrap}>
                                <div style={{ ...s.progressBar, width: `${progress}%`, background: tierInfo.color }} />
                            </div>

                            {nextTier ? (
                                <p style={s.progressLabel}>
                                    <strong>{pointsToNext.toLocaleString()} pts</strong> more to reach{' '}
                                    <span style={{ color: nextTier.color, fontWeight: 700 }}>{tierEmoji[nextTier.name]} {nextTier.name}</span>
                                </p>
                            ) : (
                                <p style={s.progressLabel}>You've reached the highest tier! 🎉</p>
                            )}

                            {/* Tier ladder */}
                            <div style={s.tierLadder}>
                                {TIERS.map(t => (
                                    <div key={t.name} style={{ ...s.tierStep, opacity: profile.points >= t.min ? 1 : 0.35 }}>
                                        <div style={{ ...s.tierDot, background: t.color }} />
                                        <span style={{ fontSize: '0.8rem', color: profile.points >= t.min ? t.color : '#aaa', fontWeight: 600 }}>
                                            {tierEmoji[t.name]} {t.name}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: '#aaa' }}>
                                            {t.min.toLocaleString()}+ pts
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <p style={s.earnRate}>Earn <strong>10 points</strong> per $1 spent</p>
                        </div>
                    </div>

                    {/* ── Right column ── */}
                    <div style={s.rightCol}>

                        {/* Personal info */}
                        <div style={s.infoCard}>
                            <div style={s.cardHeader}>
                                <h3 style={s.cardTitle}>Personal Information</h3>
                                {!editing && (
                                    <button style={s.editBtn} onClick={() => setEditing(true)}>Edit</button>
                                )}
                            </div>

                            {editing ? (
                                <form onSubmit={handleSave} style={s.form}>
                                    <div style={s.field}>
                                        <label style={s.label}>Username</label>
                                        <input style={s.input} value={username} onChange={e => setUsername(e.target.value)} required />
                                    </div>
                                    <div style={s.field}>
                                        <label style={s.label}>Email</label>
                                        <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div style={s.formActions}>
                                        <button type="submit" style={s.saveBtn} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button type="button" style={s.cancelBtn} onClick={() => { setEditing(false); setUsername(profile.username); setEmail(profile.email); }}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div style={s.infoGrid}>
                                    <InfoRow label="Username" value={profile.username} />
                                    <InfoRow label="Email"    value={profile.email} />
                                    <InfoRow label="Role"     value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} />
                                    <InfoRow label="Points"   value={`${profile.points.toLocaleString()} pts`} />
                                    <InfoRow label="Tier"     value={`${tierEmoji[profile.tier]} ${profile.tier}`} />
                                </div>
                            )}
                        </div>

                        {/* Order history */}
                        <div style={s.infoCard}>
                            <h3 style={s.cardTitle}>Order History</h3>
                            {profile.orders.length === 0 ? (
                                <p style={s.empty}>No orders yet.</p>
                            ) : (
                                <table style={s.table}>
                                    <thead>
                                        <tr style={s.thead}>
                                            <th style={s.th}>Order #</th>
                                            <th style={s.th}>Status</th>
                                            <th style={s.th}>Total</th>
                                            <th style={s.th}>Points Earned</th>
                                            <th style={s.th}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profile.orders.map(o => (
                                            <tr key={o.id} style={s.tr}>
                                                <td style={s.td}>#{o.id}</td>
                                                <td style={s.td}>
                                                    <span style={{ ...s.statusBadge, background: STATUS_COLORS[o.status] || '#888' }}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td style={s.td}>${Number(o.total).toFixed(2)}</td>
                                                <td style={s.td}>
                                                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                                                        +{o.points_earned} pts
                                                    </span>
                                                </td>
                                                <td style={s.td}>{new Date(o.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div style={{ borderBottom: '1px solid #f0f0f0', padding: '0.65rem 0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', color: '#888' }}>{label}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>{value}</span>
    </div>
);

const s: { [k: string]: React.CSSProperties } = {
    page:        { minHeight: '100vh', background: '#f4f6f9' },
    container:   { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' },
    loading:     { textAlign: 'center', padding: '3rem', color: '#888' },
    flash:       { padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.9rem' },

    grid:        { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' },
    leftCol:     { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    rightCol:    { display: 'flex', flexDirection: 'column', gap: '1.25rem' },

    // Avatar card
    avatarCard:  { background: '#fff', borderRadius: '12px', padding: '2rem 1.5rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
    avatar:      { width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff', margin: '0 auto 1rem' },
    avatarName:  { fontSize: '1.3rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 0.5rem' },
    tierBadge:   { display: 'inline-block', padding: '0.25rem 0.9rem', borderRadius: '20px', color: '#fff', fontSize: '0.82rem', fontWeight: 700 },
    memberSince: { fontSize: '0.78rem', color: '#aaa', marginTop: '0.5rem' },

    // Membership card
    memberCard:  { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '3px solid #ddd' },
    memberTitle: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1rem' },
    pointsRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
    pointsLabel: { fontSize: '0.85rem', color: '#888' },
    pointsVal:   { fontSize: '1.4rem', fontWeight: 700 },
    progressWrap:{ height: '8px', background: '#e9ecef', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.5rem' },
    progressBar: { height: '100%', borderRadius: '10px', transition: 'width 0.4s ease' },
    progressLabel:{ fontSize: '0.82rem', color: '#666', margin: '0.25rem 0 1rem' },

    tierLadder:  { display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' },
    tierStep:    { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    tierDot:     { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
    earnRate:    { fontSize: '0.78rem', color: '#aaa', marginTop: '0.5rem', textAlign: 'center' },

    // Info / order cards
    infoCard:    { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
    cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    cardTitle:   { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
    infoGrid:    { display: 'flex', flexDirection: 'column' },
    empty:       { color: '#aaa', textAlign: 'center', padding: '1.5rem 0' },

    // Edit form
    form:        { display: 'flex', flexDirection: 'column', gap: '1rem' },
    field:       { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    label:       { fontSize: '0.82rem', color: '#555', fontWeight: 500 },
    input:       { padding: '0.55rem 0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' },
    formActions: { display: 'flex', gap: '0.75rem' },
    saveBtn:     { padding: '0.55rem 1.2rem', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
    cancelBtn:   { padding: '0.55rem 1.2rem', border: '1px solid #ccc', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
    editBtn:     { padding: '0.35rem 0.9rem', border: '1px solid #1a1a2e', color: '#1a1a2e', background: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },

    // Order table
    table:       { width: '100%', borderCollapse: 'collapse' },
    thead:       { background: '#f8f9fa' },
    th:          { padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', color: '#666', fontWeight: 600, borderBottom: '1px solid #eee' },
    tr:          { borderBottom: '1px solid #f5f5f5' },
    td:          { padding: '0.6rem 0.75rem', fontSize: '0.875rem', color: '#444' },
    statusBadge: { padding: '0.2rem 0.6rem', borderRadius: '20px', color: '#fff', fontSize: '0.72rem', fontWeight: 600 },
};

export default Profile;

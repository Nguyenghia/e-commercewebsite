const TIERS = [
    { name: 'Platinum', min: 10000, color: '#a855f7' },
    { name: 'Gold',     min: 5000,  color: '#f59e0b' },
    { name: 'Silver',   min: 1000,  color: '#94a3b8' },
    { name: 'Bronze',   min: 0,     color: '#b45309' },
];

const getTier = (points) => {
    return TIERS.find(t => points >= t.min) || TIERS[TIERS.length - 1];
};

const getNextTier = (points) => {
    const idx = TIERS.findIndex(t => points >= t.min);
    if (idx === 0) return null; // already Platinum
    return TIERS[idx - 1];
};

// 10 points per $1 spent
const calcPoints = (orderTotal) => Math.floor(parseFloat(orderTotal) * 10);

module.exports = { getTier, getNextTier, calcPoints, TIERS };

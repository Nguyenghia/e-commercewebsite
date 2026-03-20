exports.requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

exports.requireAdminOrSales = (req, res, next) => {
    if (!['admin', 'sales'].includes(req.user?.role)) {
        return res.status(403).json({ message: 'Staff access required' });
    }
    next();
};

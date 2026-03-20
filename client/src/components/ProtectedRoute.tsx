import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
    children: React.ReactNode;
    requiredRole?: string;
    requiredRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredRole, requiredRoles }) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return <Navigate to="/login" replace />;

    const user = JSON.parse(userStr);

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/shop" replace />;
    }
    if (requiredRoles && !requiredRoles.includes(user.role)) {
        return <Navigate to="/shop" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

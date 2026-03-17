import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ role }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (role === 'admin' && !user.isAdmin) {
        return <Navigate to="/" />;
    }

    return <Outlet />;
};

export default PrivateRoute;
// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

const AdminRoute = ({ children }) => {
    const { currentUser } = useAuth();

    if (currentUser === undefined) {
        // Still checking auth state, show a loader
        return <div className="grid h-screen place-items-center"><Spinner /></div>;
    }

    // The user must be logged in AND have the isAdmin flag set to true
    if (!currentUser || !currentUser.isAdmin) {
        // Redirect them to the home page if they are not an admin
        return <Navigate to="/" />;
    }

    return children;
};

export default AdminRoute;
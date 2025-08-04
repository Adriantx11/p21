import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    // User is not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin()) {
    // User is not an admin, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated (and is an admin if adminOnly is true)
  return children;
};

export default ProtectedRoute;
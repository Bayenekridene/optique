import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { userInfo } = useSelector((state) => state.user);

  // ✅ CORRIGÉ : isAuthenticated n'existait pas dans le slice
  const isAuthenticated = !!userInfo;
  const isAdmin = userInfo?.role === 'admin' || userInfo?.isAdmin === true;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
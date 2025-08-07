// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  if (auth.isLoading) return <p>Loading...</p>;
  if (!auth.isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const userRole = user?.role?.toLowerCase();

  const allowed = allowedRoles.map((r) => r.toLowerCase());

  console.log(
    "ProtectedRoute user:",
    user,
    "userRole:",
    userRole,
    "allowed:",
    allowed
  );

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is empty, allow all authenticated users
  if (allowedRoles.length > 0 && !allowed.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

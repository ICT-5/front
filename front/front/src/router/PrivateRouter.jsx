// src/router/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute() {
  const { isAuthed } = useAuth();
  const loc = useLocation();
  if (!isAuthed) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

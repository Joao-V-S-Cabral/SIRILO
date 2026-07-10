import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { autenticado } = useAuth();
  if (!autenticado) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { autenticado, isAdmin } = useAuth();
  if (!autenticado) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/reunioes" replace />;
  return <Outlet />;
}

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts';
import { AuthUI } from '@/components/ui/auth-fuse';

export const AdminLoginPage: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AuthUI />;
};

export default AdminLoginPage;

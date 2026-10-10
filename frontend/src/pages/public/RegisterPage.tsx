import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts';
import { AuthUI } from '@/components/ui/auth-fuse';

export const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AuthUI
      initialIsSignIn={false}
      signUpContent={{
        quote: {
          text: "Donnez vie à vos projets photographiques en toute simplicité.",
          author: "FotoDesk Pro",
        },
      }}
    />
  );
};

export default RegisterPage;

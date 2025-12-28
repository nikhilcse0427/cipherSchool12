import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { userAuthStore } from '../store/store';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkAuth, serverAvailable, hasCheckedAuth } = userAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // Only check if we haven't checked yet or server is available
      if (!hasCheckedAuth || serverAvailable) {
        try {
          await checkAuth();
        } catch (error) {
          // Silent - errors are handled in store
        }
      }
      setIsChecking(false);
    };
    verifyAuth();
  }, [checkAuth, serverAvailable, hasCheckedAuth]);

  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;


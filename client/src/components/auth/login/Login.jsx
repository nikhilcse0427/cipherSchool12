import React from 'react'
import { Navigate } from 'react-router-dom'
import AuthForm from '../../AuthForm.jsx'
import { userAuthStore } from '../../../store/store'

const Login = () => {
  const { isAuthenticated } = userAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/assignments" replace />;
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <AuthForm type="login" />
      </div>
    </div>
  )
}

export default Login

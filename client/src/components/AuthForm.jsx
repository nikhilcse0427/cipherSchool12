import React, { useState } from 'react'
import { userAuthStore } from '../store/store';
import { Link, useNavigate } from 'react-router-dom';

const AuthForm = ({ type }) => {
  const [userInput, setUserInput] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [revealPassword, setRevealPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const router = useNavigate()

  const {
    registerUser,
    loginUser,
    loading,
    error,
  } = userAuthStore();


  const submitHandler = async (event) => {
    event.preventDefault();
    if (isRegistration && !acceptedTerms) return

    try {
      if (type === 'signup') {
        const response = await registerUser({
          name: userInput.name,
          email: userInput.email,
          password: userInput.password
        });
        // If registration and auto-login successful, redirect
        if (response && response.user) {
          router('/assignments');
        }
      } else {
        const response = await loginUser({
          email: userInput.email,
          password: userInput.password
        });
        // If login successful, redirect
        if (response && response.user) {
          router('/assignments');
        }
      }
    } catch (err) {
      // Error handling is managed by the store
      console.error('Auth error:', err);
    }
  }

  const isRegistration = type === 'signup'
  const pageTitle = isRegistration ? "Create new Account" : "Welcome back"
  const buttonLabel = isRegistration ? "Signup" : "Login"
  const switchText = isRegistration ? "Already a member ?" : "Don't have an account ?"
  const switchAction = isRegistration ? "Signin" : "Signup"
  const switchPath = isRegistration ? '/login' : '/signup';

  return (
    <div className="auth-card">
      <div className="auth-content">
        <h1 className="auth-title">{pageTitle}</h1>
        {error && (
          <div className="auth-error" style={{
            color: '#f44336',
            backgroundColor: '#ffebee',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={submitHandler} className="auth-form">
          {isRegistration && (
            <div className="form-group">
              <label htmlFor='name' className="form-label">Full Name</label>
              <input
                id='name'
                type='text'
                placeholder="Enter full name"
                value={userInput.name}
                onChange={(e) => setUserInput({ ...userInput, name: e.target.value })}
                className="form-input"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor='email' className="form-label">Email</label>
            <input
              id='email'
              type='email'
              value={userInput.email}
              placeholder="Enter email"
              onChange={(e) => setUserInput({ ...userInput, email: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group form-group-password">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={revealPassword ? "text" : "password"}
                value={userInput.password}
                placeholder="Enter password"
                onChange={(e) =>
                  setUserInput({ ...userInput, password: e.target.value })
                }
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setRevealPassword(!revealPassword)}
              >
                {revealPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {isRegistration && (
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id='terms'
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor='terms' className="form-checkbox-label">Accept terms and conditions</label>
            </div>)
          }
          <div>
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || (isRegistration && !acceptedTerms)}
            >
              {loading ? (
                <div className="loading-content">
                  <span className="spinner"></span>
                  {type === "signup" ? "Creating..." : "Signing in..."}
                </div>
              ) : (
                buttonLabel
              )}
            </button>
          </div>
          <div className="auth-link">
            <p>{switchText} <Link to={switchPath} className="auth-link-text">{switchAction}</Link></p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthForm

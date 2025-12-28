import { useState, useCallback, useEffect } from 'react';

// Backend API endpoint configuration
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const userAuthStore = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [serverAvailable, setServerAvailable] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Centralized API request handler
  const makeRequest = useCallback(async (endpoint, requestConfig = {}) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...requestConfig,
        headers: {
          'Content-Type': 'application/json',
          ...requestConfig.headers,
        },
        credentials: 'include',
      });

      // Mark server as available if we got a response (even if error status)
      if (response.status !== 0) {
        setServerAvailable(true);
      }

      // Handle network errors before trying to parse JSON
      if (!response.ok && response.status === 0) {
        setServerAvailable(false);
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 3000.');
      }

      // Try to parse JSON, but handle cases where response might not be JSON
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, it might be a network error
        if (!response.ok) {
          setServerAvailable(false);
          throw new Error('Cannot connect to server. Please ensure the backend server is running on port 3000.');
        }
        throw parseError;
      }

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Request failed');
      }

      return responseData;
    } catch (err) {
      // Only set server unavailable for network errors
      if (err.message.includes('Failed to fetch') ||
        err.message.includes('ERR_CONNECTION_REFUSED') ||
        err.message.includes('Cannot connect to server') ||
        err.name === 'TypeError') {
        setServerAvailable(false);
        const errorMsg = 'Cannot connect to server. Please ensure the backend server is running on port 3000.';
        setErrorMessage(errorMsg);
        throw new Error(errorMsg);
      }
      const errorText = err.message || 'An error occurred';
      setErrorMessage(errorText);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // User login handler
  const loginUser = useCallback(async (loginCredentials) => {
    // Reset server status to allow retry
    setServerAvailable(true);
    const response = await makeRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: loginCredentials.email,
        password: loginCredentials.password,
      }),
    });
    if (response.user) {
      setUser(response.user);
      setIsAuthenticated(true);
    }
    return response;
  }, [makeRequest]);

  // User registration handler - auto-login after registration
  const registerUser = useCallback(async (userInfo) => {
    // Reset server status to allow retry
    setServerAvailable(true);
    const emailPrefix = userInfo.email.split('@')[0];
    // First register the user
    await makeRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: userInfo.name,
        userName: emailPrefix,
        email: userInfo.email,
        password: userInfo.password,
      }),
    });
    // Then auto-login the user
    const loginResponse = await makeRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userInfo.email,
        password: userInfo.password,
      }),
    });
    if (loginResponse.user) {
      setUser(loginResponse.user);
      setIsAuthenticated(true);
    }
    return loginResponse;
  }, [makeRequest]);

  // Check if user is authenticated by verifying token
  const checkAuth = useCallback(async () => {
    // Skip check if server is known to be unavailable (unless forced)
    if (!serverAvailable && hasCheckedAuth) {
      return false;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/users/current-user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Mark server as available if we got a response
      setServerAvailable(true);
      setHasCheckedAuth(true);

      // Handle network/connection errors
      if (!response.ok && response.status === 0) {
        setServerAvailable(false);
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      // Try to parse JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, treat as unauthenticated
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      if (response.ok && data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      // Network error - server not running or connection refused
      // Silent - don't spam console with errors
      setServerAvailable(false);
      setHasCheckedAuth(true);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, [serverAvailable, hasCheckedAuth]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Check authentication on mount (only once) - but skip if server is unavailable
  useEffect(() => {
    if (!hasCheckedAuth && serverAvailable) {
      checkAuth();
    } else if (!hasCheckedAuth && !serverAvailable) {
      // Mark as checked even if server is down to prevent repeated attempts
      setHasCheckedAuth(true);
    }
  }, [checkAuth, hasCheckedAuth, serverAvailable]);

  return {
    registerUser,
    loginUser,
    logout,
    checkAuth,
    loading: isLoading,
    error: errorMessage,
    isAuthenticated,
    user,
    serverAvailable,
    hasCheckedAuth,
  };
};

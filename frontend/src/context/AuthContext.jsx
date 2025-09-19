import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios base URL
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
axios.defaults.baseURL = apiUrl;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      MySwal.fire({
        title: 'Logging in...',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      const response = await axios.post('/api/auth/login', { username, password });
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Fetch user data after login
      await fetchCurrentUser();
      
      MySwal.fire({
        icon: 'success',
        title: 'Welcome!',
        text: 'Login successful',
        timer: 1500,
        showConfirmButton: false
      });
      
      return { success: true };
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.error || 'Invalid credentials'
      });
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (username, password, isAdmin = false) => {
    try {
      MySwal.fire({
        title: 'Creating account...',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      await axios.post('/api/auth/register', { username, password, isAdmin });
      
      MySwal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: 'Logging you in...',
        timer: 1500,
        showConfirmButton: false
      });
      
      return await login(username, password);
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.response?.data?.error || 'Registration failed'
      });
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    MySwal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        
        MySwal.fire({
          icon: 'success',
          title: 'Logged out',
          text: 'See you soon!',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


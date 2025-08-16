import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('Parsed user data:', parsedUser);
      
      if (!parsedUser || !parsedUser.username) {
        console.error('Invalid user data structure:', parsedUser);
        throw new Error('Invalid user data structure');
      }
      
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/');
    }

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0"><i className="fas fa-tachometer-alt me-2"></i>Dashboard</h3>
          <button 
            className="btn btn-light" 
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt me-2"></i>Logout
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card h-100 border-primary">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0"><i className="fas fa-user me-2"></i>User Profile</h5>
                </div>
                <div className="card-body">
                  {user && (
                    <div>
                      <p><strong><i className="fas fa-user-circle me-2"></i>Username:</strong> {user.username}</p>
                      <p><strong><i className="fas fa-envelope me-2"></i>Email:</strong> {user.email}</p>
                      {user.createdAt && (
                        <p><strong><i className="fas fa-clock me-2"></i>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-8 mb-4">
              <div className="card h-100 border-success">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0"><i className="fas fa-shield-alt me-2"></i>Authentication Status</h5>
                </div>
                <div className="card-body">
                  <div className="alert alert-success">
                    <i className="fas fa-check-circle me-2"></i>
                    <strong>Successfully authenticated!</strong> Your JWT token is valid and stored securely.
                  </div>
                  <p><i className="fas fa-info-circle me-2"></i>This is a protected route that requires authentication.</p>
                  <p><i className="fas fa-lock me-2"></i>Your session is secure and will expire after the token lifetime.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
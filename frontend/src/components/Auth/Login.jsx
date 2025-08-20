import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ApiService from '../../services/ApiService';

function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      console.log('Attempting login...');
      const response = await ApiService.makeRequest(
        'POST',
        ApiService.endpoints.login,
        { email, password }
      );

      console.log('Login response:', response);

      if (response.success) {
        // Store auth data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <h2 className='text-center mb-4'><i className='fas fa-lock me-2'></i>Login</h2>
        <form onSubmit={handleSubmit}>
            <div className='mb-3'>
                <label htmlFor='email' className='form-label'><i className='fas fa-envelope me-2'></i>Email</label>
                <input 
                  type='email' 
                  id='email'
                  placeholder='Enter your email'
                  className='form-control'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
            </div>
            <div className='mb-3'>
                <label htmlFor='password' className='form-label'><i className='fas fa-key me-2'></i>Password</label>
                <input 
                  type='password' 
                  id='password'
                  placeholder='Enter your password' 
                  className='form-control'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
            </div>
            {errorMessage && (
              <div className='alert alert-danger'><i className='fas fa-exclamation-circle me-2'></i>{errorMessage}</div>
            )}
            {successMessage && (
              <div className='alert alert-success'><i className='fas fa-check-circle me-2'></i>{successMessage}</div>
            )}
            <button 
              type='submit' 
              className='btn btn-primary w-100 mb-3'
              disabled={isLoading}
            >
              {isLoading ? <><i className='fas fa-spinner fa-spin me-2'></i>Signing In...</> : <><i className='fas fa-sign-in-alt me-2'></i>Login</>}
            </button>
            <div className='d-flex justify-content-between mb-3'>
              <Link to="/forget-password" className='text-decoration-none'><i className='fas fa-question-circle me-1'></i>Forgot Password?</Link>
              <Link to="/signup" className='text-decoration-none'><i className='fas fa-user-plus me-1'></i>Sign Up</Link>
            </div>
            <p className='text-muted text-center small mt-3'>By logging in, you agree to our terms and conditions.</p>
        </form>
      </div>
    </div>
  )
}

export default Login
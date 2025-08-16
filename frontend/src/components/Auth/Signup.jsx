import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../services/ApiService';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationUrl('');
    setIsLoading(true);

    try {
      const response = await ApiService.makeRequest(
        'POST',
        ApiService.endpoints.register,
        { username, email, password }
      );

      console.log('Registration response:', response);
      
      if (response.success) {
        // Check if verificationUrl is in the data property
        if (response.data && response.data.verificationUrl) {
          setVerificationUrl(response.data.verificationUrl);
        } else if (response.verificationUrl) {
          setVerificationUrl(response.verificationUrl);
        } else {
          // If no verificationUrl is found, still show a success message
          setVerificationUrl('#'); // Use a placeholder URL
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="text-center mb-4"><i className="fas fa-user-plus me-2"></i>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="fullName" className="form-label"><i className="fas fa-user me-2"></i>Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="Enter your full name"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label"><i className="fas fa-envelope me-2"></i>Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label"><i className="fas fa-key me-2"></i>Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="alert alert-danger"><i className="fas fa-exclamation-circle me-2"></i>{error}</div>
          )}
          <button 
            type="submit" 
            className="btn btn-primary w-100 mb-3" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
          {verificationUrl && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle me-2"></i>
              <strong>Registration successful!</strong> An OTP has been sent to your email.
              {verificationUrl !== '#' ? (
                <>
                  {' '}<a href={verificationUrl} className="alert-link">Click here</a> to verify your account.
                </>
              ) : (
                <>
                  {' '}Please check your email and use the verification link or OTP to complete registration.
                </>
              )}
            </div>
          )}
          <div className="text-center mt-3">
            <p className="mb-0">Already have an account?</p>
            <Link to="/" className="text-decoration-none"><i className="fas fa-sign-in-alt me-1"></i>Login</Link>
          </div>
          <p className="text-muted text-center small mt-3">By signing up, you agree to our terms and conditions.</p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
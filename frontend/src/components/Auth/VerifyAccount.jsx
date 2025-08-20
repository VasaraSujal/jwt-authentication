import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';

function VerifyAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Extract email from the tempToken in URL params
    const tempToken = searchParams.get('tempToken');
    if (tempToken) {
      try {
        // Decode the JWT token to get email (this is a simple approach)
        const payload = JSON.parse(atob(tempToken.split('.')[1]));
        setEmail(payload.email);
      } catch (error) {
        setErrorMessage('Invalid verification link');
      }
    }
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Validate OTP format
      if (!otp || !/^\d{6}$/.test(otp)) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      console.log('Verifying OTP:', { email, otp });
      const response = await ApiService.makeRequest(
        'POST',
        ApiService.endpoints.verifyAccount,
        { email, otp }
      );

      if (response.success) {
        setSuccessMessage('Account verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage(error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await ApiService.makeRequest(
        'POST',
        ApiService.endpoints.resendOtp,
        { email }
      );

      setSuccessMessage('OTP resent successfully! Please check your email.');
      // If the backend returns a new tempToken, update the URL
      if (data.data && data.data.newTempToken) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tempToken', data.data.newTempToken);
        window.history.replaceState({}, '', newUrl);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setErrorMessage(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className='auth-container'>
        <div className='auth-card'>
          <h2 className='text-center mb-4'><i className='fas fa-exclamation-triangle me-2'></i>Invalid Verification Link</h2>
          <p className='text-danger text-center'><i className='fas fa-times-circle me-2'></i>The verification link is invalid or has expired.</p>
          <button 
            onClick={() => navigate('/signup')} 
            className='btn btn-primary w-100'
          >
            <i className='fas fa-user-plus me-2'></i>Go to Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <h2 className='text-center mb-4'><i className='fas fa-user-check me-2'></i>Verify Your Account</h2>
        <p className='text-muted text-center'><i className='fas fa-envelope me-2'></i>Enter the OTP sent to {email}</p>
        
        {errorMessage && (
          <div className='alert alert-danger'><i className='fas fa-exclamation-circle me-2'></i>{errorMessage}</div>
        )}
        
        {successMessage && (
          <div className='alert alert-success'><i className='fas fa-check-circle me-2'></i>{successMessage}</div>
        )}
        
        <form onSubmit={handleVerify}>
          <div className='mb-4'>
            <label htmlFor='otp' className='form-label'><i className='fas fa-key me-2'></i>OTP Code</label>
            <input
              type='text'
              id='otp'
              placeholder='Enter 6-digit OTP'
              className='form-control otp-input'
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
            <small className='text-muted'><i className='fas fa-info-circle me-1'></i>Enter the 6-digit code sent to your email</small>
          </div>
          
          <button 
            type='submit' 
            className='btn btn-primary w-100 mb-3'
            disabled={isLoading}
          >
            {isLoading ? <><i className='fas fa-spinner fa-spin me-2'></i>Verifying...</> : <><i className='fas fa-check-circle me-2'></i>Verify Account</>}
          </button>
          
          <div className='d-flex gap-2 mb-3'>
            <button 
              type='button' 
              onClick={handleResendOTP}
              className='btn btn-outline-secondary flex-grow-1'
              disabled={isLoading}
            >
              <i className='fas fa-paper-plane me-2'></i>Resend OTP
            </button>
            
            <button 
              type='button' 
              onClick={() => navigate('/')} 
              className='btn btn-outline-secondary flex-grow-1'
            >
              <i className='fas fa-arrow-left me-2'></i>Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerifyAccount;

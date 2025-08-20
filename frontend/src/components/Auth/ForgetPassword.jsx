import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ApiService from '../../services/ApiService';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await ApiService.makeRequest(
        'POST',
        ApiService.endpoints.forgetPassword,
        { email }
      );

      setMessage('OTP sent to your email. Please check your inbox.');
      setStep(2);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await ApiService.makeRequest(
        'POST',
        ApiService.endpoints.verifyOtp,
        { email, otp }
      );

      setMessage('OTP verified successfully. Please enter your new password.');
      setStep(3);
      setErrorMessage('');
    } catch (error) {
      console.error('OTP verification error:', error);
      setErrorMessage(error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Validate OTP format
      if (!otp || !/^\d{6}$/.test(otp)) {
        throw new Error('OTP must be exactly 6 digits');
      }

      // Validate password
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await ApiService.makeRequest(
        'POST',
        ApiService.endpoints.resetPassword,
        { 
          email,
          otp,
          password: newPassword
        }
      );

      if (response.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => window.location.href = '/', 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrorMessage(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleSendOTP}>
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
      <button 
        type='submit' 
        className='btn btn-primary w-100'
        disabled={isLoading}
      >
        {isLoading ? <><i className='fas fa-spinner fa-spin me-2'></i>Sending...</> : <><i className='fas fa-paper-plane me-2'></i>Get OTP</>}
      </button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleVerifyOTP}>
      <div className='mb-3'>
        <label htmlFor='otp' className='form-label'><i className='fas fa-key me-2'></i>Enter OTP</label>
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
        <small className='text-muted'><i className='fas fa-info-circle me-1'></i>We've sent a 6-digit code to {email}</small>
      </div>
      <button 
        type='submit' 
        className='btn btn-primary w-100'
        disabled={isLoading}
      >
        {isLoading ? <><i className='fas fa-spinner fa-spin me-2'></i>Verifying...</> : <><i className='fas fa-check-circle me-2'></i>Verify OTP</>}
      </button>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleResetPassword}>
      <div className='mb-3'>
        <label htmlFor='newPassword' className='form-label'><i className='fas fa-lock me-2'></i>New Password</label>
        <div className="input-group">
          <input 
            type={showPassword ? 'text' : 'password'}
            id='newPassword'
            placeholder='Enter your new password'
            className='form-control'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button 
            className="btn btn-outline-secondary" 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <small className="text-muted mt-1"><i className="fas fa-info-circle me-1"></i>Password should be at least 8 characters</small>
      </div>
      <button 
        type='submit' 
        className='btn btn-primary w-100'
        disabled={isLoading}
      >
        {isLoading ? <><i className='fas fa-spinner fa-spin me-2'></i>Resetting...</> : <><i className='fas fa-key me-2'></i>Reset Password</>}
      </button>
    </form>
  );

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <h2 className='text-center mb-4'><i className='fas fa-unlock-alt me-2'></i>Reset Password</h2>
        <p className='text-muted text-center mb-4'>
          {step === 1 && <><i className='fas fa-envelope me-2'></i>Enter your email to receive a reset code</>}
          {step === 2 && <><i className='fas fa-key me-2'></i>Enter the OTP sent to your email</>}
          {step === 3 && <><i className='fas fa-lock me-2'></i>Create your new password</>}
        </p>
        
        {message && (
          <div className='alert alert-success'><i className='fas fa-check-circle me-2'></i>{message}</div>
        )}
        
        {errorMessage && (
          <div className='alert alert-danger'><i className='fas fa-exclamation-circle me-2'></i>{errorMessage}</div>
        )}
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        
        <div className='mt-4 text-center'>
          <Link to="/" className='btn btn-outline-secondary'><i className='fas fa-arrow-left me-2'></i>Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
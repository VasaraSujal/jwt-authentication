import './App.css';

import Login from './components/auth/Login.jsx';
import Signup from './components/auth/Signup.jsx';
import ForgetPassword from './components/auth/ForgetPassword';
import VerifyAccount from './components/auth/VerifyAccount';
import Dashboard from './components/Dashboard';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import { useEffect, useState } from 'react';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>}></Route>
        <Route path='/signup' element={<Signup/>}></Route>
        <Route path='/forget-password' element={<ForgetPassword/>}></Route>
        <Route path='/verify-account' element={<VerifyAccount/>}></Route>
        <Route 
          path='/dashboard' 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
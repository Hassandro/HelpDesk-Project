import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/dashboard" element={
          <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
        } />
        <Route path="/manager/dashboard" element={
          <PrivateRoute role="manager"><ManagerDashboard /></PrivateRoute>
        } />
        <Route path="/employee/dashboard" element={
          <PrivateRoute role="employee"><EmployeeDashboard /></PrivateRoute>
        } />
        <Route path="/customer/dashboard" element={
          <PrivateRoute role="customer"><CustomerDashboard /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

const queryClient = new QueryClient();

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin/dashboard" element={
            <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/manager/dashboard" element={
            <PrivateRoute role="manager"><ManagerDashboard /></PrivateRoute>
          } />
          <Route path="/agent/dashboard" element={
            <PrivateRoute role="it_agent"><AgentDashboard /></PrivateRoute>
          } />
          <Route path="/employee/dashboard" element={
            <PrivateRoute role="employee"><EmployeeDashboard /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
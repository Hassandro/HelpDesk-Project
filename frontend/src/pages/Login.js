import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TEST_ACCOUNTS = [
  { label: 'Admin',    email: 'admin@helpdesk.com',       password: 'admin123' },
  { label: 'Manager',  email: 'testmanager@helpdesk.com', password: 'manager123' },
  { label: 'IT Agent', email: 'testagent@helpdesk.com',    password: 'agent123' },
  { label: 'Employee', email: 'testemployee@helpdesk.com', password: 'employee123' },
];

function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate                = useNavigate();

  // Already logged in? Go straight to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user') || '{}');
    if (token && user.role) {
      if (user.role === 'admin')    navigate('/admin/dashboard');
      if (user.role === 'manager')  navigate('/manager/dashboard');
      if (user.role === 'it_agent') navigate('/agent/dashboard');
      if (user.role === 'employee') navigate('/employee/dashboard');
    }
  }, []);

  const fillTestAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost/api/login.php', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        const role = res.data.user.role;
        if (role === 'admin')    navigate('/admin/dashboard');
        if (role === 'manager')  navigate('/manager/dashboard');
        if (role === 'it_agent') navigate('/agent/dashboard');
        if (role === 'employee') navigate('/employee/dashboard');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Server error, try again');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>Help Desk Login</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            style={styles.input}
            type="text"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit">Login</button>
        </form>

        <p style={styles.quickLabel}>Quick login (testing)</p>
        <div style={styles.quickRow}>
          {TEST_ACCOUNTS.map(account => (
            <button
              key={account.label}
              type="button"
              style={styles.quickBtn}
              onClick={() => fillTestAccount(account)}
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
  box:       { backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '360px' },
  title:     { textAlign: 'center', marginBottom: '24px', color: '#333' },
  input:     { width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  button:    { width: '100%', padding: '10px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
  error:     { color: 'red', marginBottom: '12px', fontSize: '13px' },
  quickLabel:{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', margin: '20px 0 8px' },
  quickRow:  { display: 'flex', gap: '8px' },
  quickBtn:  { flex: 1, padding: '8px 4px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' },
};

export default Login;

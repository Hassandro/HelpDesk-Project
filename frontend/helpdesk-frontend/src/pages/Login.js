import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate                = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost/api/login.php', {
        email,
        password
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        const role = res.data.user.role;
        if (role === 'admin')    navigate('/admin/dashboard');
        if (role === 'manager')  navigate('/manager/dashboard');
        if (role === 'employee') navigate('/employee/dashboard');
        if (role === 'customer') navigate('/customer/dashboard');
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
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'center', height: '100vh',
    backgroundColor: '#f0f2f5'
  },
  box: {
    backgroundColor: 'white', padding: '40px',
    borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '360px'
  },
  title: { textAlign: 'center', marginBottom: '24px', color: '#333' },
  input: {
    width: '100%', padding: '10px', marginBottom: '16px',
    borderRadius: '4px', border: '1px solid #ccc',
    fontSize: '14px', boxSizing: 'border-box'
  },
  button: {
    width: '100%', padding: '10px', backgroundColor: '#4f46e5',
    color: 'white', border: 'none', borderRadius: '4px',
    fontSize: '16px', cursor: 'pointer'
  },
  error: { color: 'red', marginBottom: '12px', fontSize: '13px' }
};

export default Login;
import React from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout} style={styles.logout}>Logout</button>
    </div>
  );
}

const styles = {
  container: { padding: '40px' },
  logout: { marginTop: '20px', padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }
};

export default AdminDashboard;
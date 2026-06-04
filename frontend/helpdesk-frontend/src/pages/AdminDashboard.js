import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const [users, setUsers]       = useState([]);
  const [roles, setRoles]       = useState([]);
  const [message, setMessage]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [newUser, setNewUser]   = useState({ name: '', email: '', password: '', roleID: '' });

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost/api/users.php');
    if (res.data.success) setUsers(res.data.users);
  };

  const fetchRoles = async () => {
    const res = await axios.get('http://localhost/api/roles.php');
    if (res.data.success) setRoles(res.data.roles);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const toggleUser = async (userID, currentStatus) => {
    const res = await axios.patch('http://localhost/api/users.php', {
      userID,
      isActive: currentStatus === '1' || currentStatus === 1 ? 0 : 1
    });
    if (res.data.success) {
      setMessage(res.data.message);
      fetchUsers();
    }
  };

  const deleteUser = async (userID, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    const res = await axios.delete('http://localhost/api/users.php', { data: { userID } });
    if (res.data.success) {
      setMessage('User deleted');
      fetchUsers();
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost/api/users.php', newUser);
    if (res.data.success) {
      setMessage('User created successfully');
      setNewUser({ name: '', email: '', password: '', roleID: '' });
      setShowForm(false);
      fetchUsers();
    } else {
      setMessage(res.data.message);
    }
  };

  const roleColors = {
    admin:    '#7c3aed',
    manager:  '#0369a1',
    employee: '#0f766e',
    customer: '#b45309',
  };

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter(u => u.RoleName.toLowerCase() === filterRole);

  const activeCount   = users.filter(u => u.IsActive == 1).length;
  const inactiveCount = users.filter(u => u.IsActive == 0).length;

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <p style={styles.welcome}>Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{users.length}</span>
          <span style={styles.statLabel}>Total Users</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: '#22c55e' }}>
          <span style={{ ...styles.statNum, color: '#22c55e' }}>{activeCount}</span>
          <span style={styles.statLabel}>Active</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: '#ef4444' }}>
          <span style={{ ...styles.statNum, color: '#ef4444' }}>{inactiveCount}</span>
          <span style={styles.statLabel}>Inactive</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={styles.messageBanner}>
          {message}
          <button onClick={() => setMessage('')} style={styles.dismissBtn}>✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          {['all', 'admin', 'manager', 'employee', 'customer'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              style={{
                ...styles.filterBtn,
                backgroundColor: filterRole === r ? '#4f46e5' : '#e5e7eb',
                color: filterRole === r ? 'white' : '#374151'
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Create User Form */}
      {showForm && (
        <form onSubmit={createUser} style={styles.form}>
          <h3 style={{ marginTop: 0 }}>New User</h3>
          <div style={styles.formGrid}>
            <input
              style={styles.input}
              placeholder="Full Name"
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
            <input
              style={styles.input}
              placeholder="Email"
              type="email"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <input
              style={styles.input}
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            <select
              style={styles.input}
              value={newUser.roleID}
              onChange={e => setNewUser({ ...newUser, roleID: e.target.value })}
              required
            >
              <option value="">Select Role</option>
              {roles.map(r => (
                <option key={r.ID} value={r.ID}>{r.RoleName}</option>
              ))}
            </select>
          </div>
          <button type="submit" style={styles.submitBtn}>Create User</button>
        </form>
      )}

      {/* Users Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(u => (
            <tr key={u.ID} style={{ opacity: u.IsActive == 0 ? 0.55 : 1 }}>
              <td style={styles.td}>{u.ID}</td>
              <td style={styles.td}>{u.Name}</td>
              <td style={styles.td}>{u.Email}</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.roleBadge,
                  backgroundColor: roleColors[u.RoleName.toLowerCase()] || '#6b7280'
                }}>
                  {u.RoleName}
                </span>
              </td>
              <td style={styles.td}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: u.IsActive == 1 ? '#dcfce7' : '#fee2e2',
                  color: u.IsActive == 1 ? '#166534' : '#991b1b'
                }}>
                  {u.IsActive == 1 ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={styles.td}>
                <button
                  onClick={() => toggleUser(u.ID, u.IsActive)}
                  style={{
                    ...styles.actionBtn,
                    backgroundColor: u.IsActive == 1 ? '#f59e0b' : '#22c55e'
                  }}
                >
                  {u.IsActive == 1 ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteUser(u.ID, u.Name)}
                  style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container:    { padding: '32px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  welcome:      { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  logoutBtn:    { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  statsRow:     { display: 'flex', gap: '16px', marginBottom: '24px' },
  statCard:     { flex: 1, border: '2px solid #4f46e5', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNum:      { fontSize: '32px', fontWeight: 'bold', color: '#4f46e5' },
  statLabel:    { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
  messageBanner:{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dismissBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: '16px' },
  toolbar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' },
  filterGroup:  { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn:    { padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  addBtn:       { padding: '8px 18px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  form:         { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px' },
  formGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
  input:        { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  submitBtn:    { padding: '9px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { backgroundColor: '#4f46e5', color: 'white', padding: '11px 12px', textAlign: 'left', fontSize: '14px' },
  td:           { padding: '11px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' },
  roleBadge:    { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: '500' },
  statusBadge:  { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
  actionBtn:    { padding: '5px 12px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' },
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import AuditTrail from '../components/AuditTrail';
import NotificationCenter from '../components/NotificationCenter';
import KnowledgeBase from '../components/KnowledgeBase';
import AnalyticsPanel from '../components/AnalyticsPanel';
import DateRangeFilter, { inDateRange } from '../components/DateRangeFilter';

const PRIORITY_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Urgent: '#7c3aed' };
const STATUS_COLORS   = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' };

const ROLE_LABELS = { all: 'All', admin: 'Admin', manager: 'Manager', it_agent: 'IT Agent', employee: 'Employee' };

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  const [view, setView]           = useState('overview'); // 'overview' | 'users' | 'audit' | 'tickets'
  const [users, setUsers]         = useState([]);
  const [roles, setRoles]         = useState([]);
  const [tickets, setTickets]     = useState([]);
  const [message, setMessage]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [newUser, setNewUser]     = useState({ name: '', email: '', password: '', roleID: '' });
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost/api/users.php');
    if (res.data.success) setUsers(res.data.users);
  };

  const fetchRoles = async () => {
    const res = await axios.get('http://localhost/api/roles.php');
    if (res.data.success) setRoles(res.data.roles);
  };

  const fetchTickets = async () => {
    const res = await axios.get('http://localhost/api/tickets.php?all=1');
    if (res.data.success) setTickets(res.data.tickets);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (view === 'tickets' || view === 'overview') fetchTickets();
  }, [view]);

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
    it_agent: '#0f766e',
    employee: '#b45309',
  };

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter(u => u.RoleName.toLowerCase() === filterRole);

  const activeCount   = users.filter(u => u.IsActive == 1).length;
  const inactiveCount = users.filter(u => u.IsActive == 0).length;
  const countBy       = (status) => tickets.filter(t => t.StatusName === status).length;
  const visibleTickets = tickets.filter(t => inDateRange(t.CreatedAt, dateRange));

  const sidebarItems = [
    { key: 'overview',  label: 'Overview',         icon: '📊' },
    { key: 'users',     label: 'Users',            icon: '👥', count: users.length },
    { key: 'tickets',   label: 'All Tickets',       icon: '🎫', count: tickets.length },
    { key: 'analytics', label: 'Analytics',         icon: '📈' },
    { key: 'kb',        label: 'Knowledge Base',    icon: '📚' },
    { key: 'audit',     label: 'Audit Trail',       icon: '📜' },
  ];

  return (
    <div style={styles.page}>
      <Sidebar items={sidebarItems} activeKey={view} onSelect={setView} />

      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <p style={styles.welcome}>Welcome, {user?.name}</p>
          </div>
          <NotificationCenter userID={user.id} />
        </div>

        {/* Message */}
        {message && (
          <div style={styles.messageBanner}>
            {message}
            <button onClick={() => setMessage('')} style={styles.dismissBtn}>✕</button>
          </div>
        )}

        {view === 'overview' && (
          <>
            <h3 style={styles.sectionTitle}>Users</h3>
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

            <h3 style={styles.sectionTitle}>Tickets</h3>
            <div style={styles.statsRow}>
              {[
                { label: 'Total',       value: tickets.length,         color: '#4f46e5' },
                { label: 'Open',        value: countBy('open'),        color: '#3b82f6' },
                { label: 'In Progress', value: countBy('in_progress'), color: '#f59e0b' },
                { label: 'Resolved',    value: countBy('resolved'),    color: '#10b981' },
                { label: 'Closed',      value: countBy('closed'),      color: '#6b7280' },
              ].map(s => (
                <div key={s.label} style={{ ...styles.statCard, borderColor: s.color }}>
                  <span style={{ ...styles.statNum, color: s.color }}>{s.value}</span>
                  <span style={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'users' && (
          <>
            {/* Toolbar */}
            <div style={styles.toolbar}>
              <div style={styles.filterGroup}>
                {['all', 'admin', 'manager', 'it_agent', 'employee'].map(r => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r)}
                    style={{
                      ...styles.filterBtn,
                      backgroundColor: filterRole === r ? '#4f46e5' : '#e5e7eb',
                      color: filterRole === r ? 'white' : '#374151'
                    }}
                  >
                    {ROLE_LABELS[r]}
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
                      <option key={r.ID} value={r.ID}>{ROLE_LABELS[r.RoleName] || r.RoleName}</option>
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
                        {ROLE_LABELS[u.RoleName.toLowerCase()] || u.RoleName}
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
          </>
        )}

        {view === 'tickets' && (
          <>
            <div style={styles.toolbar}>
              <p style={styles.auditHint}>All tickets in the system (read-only).</p>
              <div style={styles.filterGroup}>
                <DateRangeFilter value={dateRange} onChange={setDateRange} />
                <button onClick={fetchTickets} style={styles.addBtn}>Refresh</button>
              </div>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Priority</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Assigned To</th>
                  <th style={styles.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map(t => (
                  <tr key={t.ID}>
                    <td style={styles.td}>{t.ID}</td>
                    <td style={styles.td}><strong>{t.Title}</strong></td>
                    <td style={styles.td}>{t.EmployeeName}</td>
                    <td style={styles.td}>{t.CategoryName}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.roleBadge, backgroundColor: PRIORITY_COLORS[t.PriorityName] || '#6b7280' }}>
                        {t.PriorityName}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.roleBadge, backgroundColor: STATUS_COLORS[t.StatusName] || '#6b7280' }}>
                        {t.StatusName?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={styles.td}>{t.AgentName || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>}</td>
                    <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{new Date(t.CreatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {visibleTickets.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {view === 'analytics' && <AnalyticsPanel userID={user.id} role={user.role} />}

        {view === 'kb' && <KnowledgeBase role={user.role} />}

        {view === 'audit' && <AuditTrail />}
      </div>
    </div>
  );
}

const styles = {
  page:         { display: 'flex', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#fff' },
  container:    { flex: 1, padding: '32px', maxWidth: '1100px', margin: '0 auto', boxSizing: 'border-box' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  welcome:      { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  sectionTitle: { margin: '8px 0 12px', color: '#374151' },
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
  auditHint:    { margin: 0, color: '#6b7280', fontSize: '13px' },
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

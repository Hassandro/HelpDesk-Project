import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PRIORITY_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Urgent: '#7c3aed' };
const STATUS_COLORS   = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280', failed: '#ef4444' };

function ManagerDashboard() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const [tickets, setTickets]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage]     = useState('');
  const [assignMap, setAssignMap] = useState({});
  const intervalRef               = useRef(null);

  const logout = () => { localStorage.clear(); navigate('/'); };

  const fetchTickets = async () => {
    const res = await axios.get('http://localhost/api/tickets.php?all=1');
    if (res.data.success) setTickets(res.data.tickets);
  };

  const fetchEmployees = async () => {
    const res = await axios.get('http://localhost/api/users.php?role=employee');
    if (res.data.success) setEmployees(res.data.users);
  };

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
    intervalRef.current = setInterval(fetchTickets, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const assignTicket = async (ticketID) => {
    const employeeID = assignMap[ticketID];
    if (!employeeID) return alert('Please select an employee first');
    const res = await axios.patch('http://localhost/api/tickets.php', {
      action: 'assign', ticketID, employeeID
    });
    if (res.data.success) { setMessage('Ticket assigned successfully'); fetchTickets(); }
  };

  const closeTicket = async (ticketID) => {
    if (!window.confirm('Close this ticket?')) return;
    const res = await axios.patch('http://localhost/api/tickets.php', { action: 'close', ticketID });
    if (res.data.success) { setMessage('Ticket closed'); fetchTickets(); }
  };

  const total      = tickets.length;
  const openCount  = tickets.filter(t => t.StatusName === 'open').length;
  const inProgress = tickets.filter(t => t.StatusName === 'in_progress').length;
  const resolved   = tickets.filter(t => t.StatusName === 'resolved').length;

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Manager Dashboard</h2>
          <p style={styles.welcome}>Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.statsRow}>
        {[
          { label: 'Total',       value: total,      color: '#4f46e5' },
          { label: 'Open',        value: openCount,  color: '#3b82f6' },
          { label: 'In Progress', value: inProgress, color: '#f59e0b' },
          { label: 'Resolved',    value: resolved,   color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, borderColor: s.color }}>
            <span style={{ ...styles.statNum, color: s.color }}>{s.value}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {message && (
        <div style={styles.messageBanner}>
          {message}
          <button onClick={() => setMessage('')} style={styles.dismissBtn}>✕</button>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Assigned To</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t.ID}>
              <td style={styles.td}>{t.ID}</td>
              <td style={styles.td}><strong>{t.Title}</strong></td>
              <td style={styles.td}>{t.CustomerName}</td>
              <td style={styles.td}>
                <span style={styles.categoryBadge}>{t.CategoryName}</span>
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, backgroundColor: PRIORITY_COLORS[t.PriorityName] || '#6b7280' }}>
                  {t.PriorityName}
                </span>
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, backgroundColor: STATUS_COLORS[t.StatusName] || '#6b7280' }}>
                  {t.StatusName?.replace('_', ' ')}
                </span>
              </td>
              <td style={styles.td}>
                {t.EmployeeName
                  ? <span style={styles.assignedName}>👤 {t.EmployeeName}</span>
                  : <span style={styles.unassigned}>Unassigned</span>}
              </td>
              <td style={styles.td}>
                {t.StatusName !== 'closed' && t.StatusName !== 'resolved' ? (
                  <div style={styles.actionGroup}>
                    <select
                      style={styles.select}
                      value={assignMap[t.ID] || ''}
                      onChange={e => setAssignMap({ ...assignMap, [t.ID]: e.target.value })}
                    >
                      <option value="">Assign to...</option>
                      {employees.map(emp => (
                        <option key={emp.ID} value={emp.ID}>{emp.Name}</option>
                      ))}
                    </select>
                    <button onClick={() => assignTicket(t.ID)} style={styles.assignBtn}>Assign</button>
                    <button onClick={() => closeTicket(t.ID)} style={styles.closeBtn}>Close</button>
                  </div>
                ) : (
                  <span style={styles.doneLabel}>✓ Done</span>
                )}
              </td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr>
              <td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>No tickets found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container:    { padding: '32px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  welcome:      { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  logoutBtn:    { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  statsRow:     { display: 'flex', gap: '16px', marginBottom: '24px' },
  statCard:     { flex: 1, border: '2px solid', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNum:      { fontSize: '30px', fontWeight: 'bold' },
  statLabel:    { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
  messageBanner:{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dismissBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: '16px' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { backgroundColor: '#4f46e5', color: 'white', padding: '11px 12px', textAlign: 'left', fontSize: '14px' },
  td:           { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', verticalAlign: 'middle' },
  badge:        { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: '500' },
  categoryBadge:{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', backgroundColor: '#e0e7ff', color: '#3730a3' },
  assignedName: { color: '#374151', fontSize: '13px' },
  unassigned:   { color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' },
  actionGroup:  { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  select:       { padding: '5px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' },
  assignBtn:    { padding: '5px 12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  closeBtn:     { padding: '5px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  doneLabel:    { color: '#10b981', fontSize: '13px', fontWeight: '500' },
};

export default ManagerDashboard;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ManagerDashboard() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const [tickets, setTickets]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage]     = useState('');

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchTickets = async () => {
    const res = await axios.get('http://localhost/helpdesk/api/tickets.php?all=1');
    if (res.data.success) setTickets(res.data.tickets);
  };

  const fetchEmployees = async () => {
    const res = await axios.get('http://localhost/helpdesk/api/users.php?role=employee');
    if (res.data.success) setEmployees(res.data.users);
  };

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
  }, []);

  const assignTicket = async (ticketID, employeeID) => {
    if (!employeeID) return alert('Please select an employee');
    const res = await axios.patch('http://localhost/helpdesk/api/tickets.php', {
      action: 'assign', ticketID, employeeID
    });
    if (res.data.success) {
      setMessage('Ticket assigned successfully');
      fetchTickets();
    }
  };

  const closeTicket = async (ticketID) => {
    const res = await axios.patch('http://localhost/helpdesk/api/tickets.php', {
      action: 'close', ticketID
    });
    if (res.data.success) {
      setMessage('Ticket closed');
      fetchTickets();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Manager Dashboard</h2>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {message && <p style={styles.success}>{message}</p>}

      <h3>All Tickets</h3>
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
          {tickets.map((t) => (
            <tr key={t.ID}>
              <td style={styles.td}>{t.ID}</td>
              <td style={styles.td}>{t.Title}</td>
              <td style={styles.td}>{t.CustomerName}</td>
              <td style={styles.td}>{t.CategoryName}</td>
              <td style={styles.td}>{t.PriorityName}</td>
              <td style={styles.td}>{t.StatusName}</td>
              <td style={styles.td}>{t.EmployeeName || 'Unassigned'}</td>
              <td style={styles.td}>
                <select
                  style={styles.select}
                  defaultValue=""
                  onChange={(e) => assignTicket(t.ID, e.target.value)}
                >
                  <option value="" disabled>Assign to...</option>
                  {employees.map((emp) => (
                    <option key={emp.ID} value={emp.ID}>{emp.Name}</option>
                  ))}
                </select>
                <button
                  onClick={() => closeTicket(t.ID)}
                  style={styles.closeBtn}
                >Close</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  success: { color: 'green', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#4f46e5', color: 'white', padding: '10px', textAlign: 'left' },
  td: { padding: '10px', borderBottom: '1px solid #e5e7eb' },
  select: { padding: '6px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '8px' },
  closeBtn: { padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default ManagerDashboard;
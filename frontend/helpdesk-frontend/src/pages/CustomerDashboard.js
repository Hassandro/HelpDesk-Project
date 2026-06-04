import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CustomerDashboard() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const [tickets, setTickets]         = useState([]);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [categoryID, setCategoryID]   = useState('1');
  const [priorityID, setPriorityID]   = useState('1');
  const [message, setMessage]         = useState('');
  const [showForm, setShowForm]       = useState(false);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchTickets = async () => {
    const res = await axios.get(`http://localhost/api/tickets.php?userID=${user.id}`);
    if (res.data.success) setTickets(res.data.tickets);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost/api/tickets.php', {
      title, description, categoryID, priorityID, createdBy: user.id
    });
    if (res.data.success) {
      setMessage('Ticket submitted successfully!');
      setTitle(''); setDescription('');
      setCategoryID('1'); setPriorityID('1');
      setShowForm(false);
      fetchTickets();
    } else {
      setMessage('Failed to submit ticket.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Welcome, {user?.name}</h2>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      <button onClick={() => setShowForm(!showForm)} style={styles.newBtn}>
        {showForm ? 'Cancel' : '+ New Ticket'}
      </button>

      {message && <p style={styles.success}>{message}</p>}

      {showForm && (
        <div style={styles.form}>
          <h3>Submit a Ticket</h3>
          <form onSubmit={handleSubmit}>
            <input
              style={styles.input}
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              style={styles.textarea}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <select style={styles.input} value={categoryID} onChange={(e) => setCategoryID(e.target.value)}>
              <option value="1">Technical</option>
              <option value="2">Billing</option>
              <option value="3">General</option>
              <option value="4">Network</option>
            </select>
            <select style={styles.input} value={priorityID} onChange={(e) => setPriorityID(e.target.value)}>
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">High</option>
              <option value="4">Urgent</option>
            </select>
            <button type="submit" style={styles.submitBtn}>Submit Ticket</button>
          </form>
        </div>
      )}

      <h3 style={{ marginTop: '32px' }}>My Tickets</h3>
      {tickets.length === 0 ? (
        <p style={styles.noTickets}>No tickets submitted yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.ID}>
                <td style={styles.td}>{t.ID}</td>
                <td style={styles.td}>{t.Title}</td>
                <td style={styles.td}>{t.CategoryName}</td>
                <td style={styles.td}>{t.PriorityName}</td>
                <td style={styles.td}>{t.StatusName}</td>
                <td style={styles.td}>{new Date(t.CreatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '32px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  newBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '16px' },
  form: { backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', marginBottom: '24px' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', height: '100px', boxSizing: 'border-box' },
  submitBtn: { padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  success: { color: 'green', marginBottom: '12px' },
  noTickets: { color: '#888' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#4f46e5', color: 'white', padding: '10px', textAlign: 'left' },
  td: { padding: '10px', borderBottom: '1px solid #e5e7eb' },
};

export default CustomerDashboard;
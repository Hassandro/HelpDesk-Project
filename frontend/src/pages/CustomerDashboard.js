import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EMPTY_FORM = { title: '', description: '', categoryID: '', priorityID: '' };

function CustomerDashboard() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const [tickets, setTickets]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [message, setMessage]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editingID, setEditingID]   = useState(null); // null = create, number = edit
  const intervalRef                 = useRef(null);

  const logout = () => { localStorage.clear(); navigate('/'); };

  const fetchTickets    = async () => {
    const res = await axios.get(`http://localhost/api/tickets.php?userID=${user.id}`);
    if (res.data.success) setTickets(res.data.tickets);
  };
  const fetchCategories = async () => {
    const res = await axios.get('http://localhost/api/categories.php');
    if (res.data.success) setCategories(res.data.categories);
  };
  const fetchPriorities = async () => {
    const res = await axios.get('http://localhost/api/priorities.php');
    if (res.data.success) setPriorities(res.data.priorities);
  };

  useEffect(() => {
    fetchTickets();
    fetchCategories();
    fetchPriorities();
    intervalRef.current = setInterval(fetchTickets, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const openCreate = () => {
    setEditingID(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditingID(t.ID);
    setForm({
      title:       t.Title,
      description: t.Description,
      categoryID:  t.CategoryID,
      priorityID:  t.PriorityID,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let res;
    if (editingID) {
      res = await axios.put('http://localhost/api/tickets.php', { ticketID: editingID, ...form });
    } else {
      res = await axios.post('http://localhost/api/tickets.php', { ...form, createdBy: user.id });
    }
    if (res.data.success) {
      setMessage(editingID ? 'Ticket updated successfully!' : 'Ticket submitted successfully!');
      setForm(EMPTY_FORM);
      setEditingID(null);
      setShowForm(false);
      fetchTickets();
    } else {
      setMessage(res.data.message || 'Operation failed.');
    }
  };

  const handleDelete = async (ticketID) => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    const res = await axios.delete('http://localhost/api/tickets.php', { data: { ticketID } });
    if (res.data.success) {
      setMessage('Ticket deleted.');
      fetchTickets();
    }
  };

  const priorityColors = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Urgent: '#7c3aed' };
  const statusColors   = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#6b7280' };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>My Tickets</h2>
          <p style={styles.welcome}>Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Message */}
      {message && (
        <div style={styles.messageBanner}>
          {message}
          <button onClick={() => setMessage('')} style={styles.dismissBtn}>✕</button>
        </div>
      )}

      {/* New Ticket Button */}
      <button onClick={openCreate} style={styles.newBtn}>+ New Ticket</button>

      {/* Create / Edit Form */}
      {showForm && (
        <div style={styles.form}>
          <h3 style={{ marginTop: 0 }}>{editingID ? 'Edit Ticket' : 'Submit a New Ticket'}</h3>
          <form onSubmit={handleSubmit}>
            <input
              style={styles.input}
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              style={styles.textarea}
              placeholder="Describe your issue..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
            />
            <div style={styles.row}>
              <select
                style={styles.select}
                value={form.categoryID}
                onChange={e => setForm({ ...form, categoryID: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.ID} value={c.ID}>{c.CategoryName}</option>
                ))}
              </select>
              <select
                style={styles.select}
                value={form.priorityID}
                onChange={e => setForm({ ...form, priorityID: e.target.value })}
                required
              >
                <option value="">Select Priority</option>
                {priorities.map(p => (
                  <option key={p.ID} value={p.ID}>{p.PriorityName}</option>
                ))}
              </select>
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.submitBtn}>
                {editingID ? 'Save Changes' : 'Submit Ticket'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingID(null); setForm(EMPTY_FORM); }}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <p style={styles.empty}>No tickets submitted yet.</p>
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
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.ID}>
                <td style={styles.td}>{t.ID}</td>
                <td style={styles.td}>{t.Title}</td>
                <td style={styles.td}>{t.CategoryName}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: priorityColors[t.PriorityName] || '#6b7280' }}>
                    {t.PriorityName}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: statusColors[t.StatusName] || '#6b7280' }}>
                    {t.StatusName}
                  </span>
                </td>
                <td style={styles.td}>{new Date(t.CreatedAt).toLocaleDateString()}</td>
                <td style={styles.td}>
                  {/* Only allow edit/delete on open tickets */}
                  {t.StatusName === 'open' && (
                    <>
                      <button onClick={() => openEdit(t)} style={styles.editBtn}>Edit</button>
                      <button onClick={() => handleDelete(t.ID)} style={styles.deleteBtn}>Delete</button>
                    </>
                  )}
                  {t.StatusName !== 'open' && (
                    <span style={styles.locked}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container:     { padding: '32px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  welcome:       { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  logoutBtn:     { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  messageBanner: { backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dismissBtn:    { background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: '16px' },
  newBtn:        { padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px', fontWeight: '500' },
  form:          { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '24px', borderRadius: '8px', marginBottom: '28px' },
  input:         { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' },
  textarea:      { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', height: '100px', boxSizing: 'border-box', resize: 'vertical' },
  row:           { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
  select:        { padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%' },
  formActions:   { display: 'flex', gap: '10px' },
  submitBtn:     { padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  cancelBtn:     { padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  empty:         { color: '#9ca3af', marginTop: '32px' },
  table:         { width: '100%', borderCollapse: 'collapse' },
  th:            { backgroundColor: '#4f46e5', color: 'white', padding: '11px 12px', textAlign: 'left', fontSize: '14px' },
  td:            { padding: '11px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' },
  badge:         { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: '500' },
  editBtn:       { padding: '5px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' },
  deleteBtn:     { padding: '5px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  locked:        { color: '#d1d5db', fontSize: '13px' },
};

export default CustomerDashboard;

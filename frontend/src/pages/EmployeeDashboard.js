import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ActivityTimeline from '../components/ActivityTimeline';
import { TagIcon, CircleIcon, ClockIcon, CheckCircleIcon, ArchiveIcon, TrendingUpIcon, BookOpenIcon, PlusCircleIcon } from '../components/Icons';
import Sidebar from '../components/Sidebar';
import Attachments from '../components/Attachments';
import NotificationCenter from '../components/NotificationCenter';
import KnowledgeBase from '../components/KnowledgeBase';
import AnalyticsPanel from '../components/AnalyticsPanel';
import DateRangeFilter, { inDateRange } from '../components/DateRangeFilter';

const EMPTY_FORM = { title: '', description: '', categoryID: '', priorityID: '' };

const roleLabel = (r) => (r === 'it_agent' ? 'IT Agent' : r);

function EmployeeDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  const [tickets, setTickets]         = useState([]);
  const [categories, setCategories]   = useState([]);
  const [priorities, setPriorities]   = useState([]);
  const [message, setMessage]         = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editingID, setEditingID]     = useState(null); // null = create, number = edit
  const [filter, setFilter]           = useState('all');
  const [darkMode, setDarkMode]       = useState(false);
  const [detailTicket, setDetail]     = useState(null);
  const [activity, setActivity]       = useState([]);
  const [comments, setComments]       = useState([]);
  const [replyText, setReplyText]     = useState('');
  const [dateRange, setDateRange]     = useState({ from: '', to: '' });
  const intervalRef                   = useRef(null);

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
  const fetchActivity = async (ticketID) => {
    const res = await axios.get(`http://localhost/api/activity.php?ticketID=${ticketID}`);
    if (res.data.success) setActivity(res.data.logs);
  };
  const fetchComments = async (ticketID) => {
    const res = await axios.get(`http://localhost/api/comments.php?ticketID=${ticketID}&role=employee`);
    if (res.data.success) setComments(res.data.comments);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const openDetail = (t) => {
    setDetail(t);
    setActivity([]);
    setComments([]);
    fetchActivity(t.ID);
    fetchComments(t.ID);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let res;
    if (editingID) {
      res = await axios.put('http://localhost/api/tickets.php', { ticketID: editingID, userID: user.id, ...form });
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
    const res = await axios.delete('http://localhost/api/tickets.php', { data: { ticketID, userID: user.id } });
    if (res.data.success) {
      setMessage('Ticket deleted.');
      fetchTickets();
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost/api/comments.php', {
      ticketID: detailTicket.ID,
      userID: user.id,
      commentText: replyText
    });
    if (res.data.success) {
      setReplyText('');
      fetchComments(detailTicket.ID);
      fetchActivity(detailTicket.ID);
    }
  };

  const priorityColors = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Urgent: '#7c3aed' };
  const statusColors   = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#6b7280' };

  const countBy = (status) => tickets.filter(t => t.StatusName === status).length;
  const visibleTickets = (filter === 'all' ? tickets : tickets.filter(t => t.StatusName === filter))
    .filter(t => inDateRange(t.CreatedAt, dateRange));

  const sidebarItems = [
    { key: 'all',         label: 'My Tickets',  icon: <TagIcon />, count: tickets.length },
    { key: 'open',        label: 'Open',        icon: <CircleIcon />, count: countBy('open') },
    { key: 'in_progress', label: 'In Progress', icon: <ClockIcon />, count: countBy('in_progress') },
    { key: 'resolved',    label: 'Resolved',    icon: <CheckCircleIcon />, count: countBy('resolved') },
    { key: 'closed',      label: 'Closed',      icon: <ArchiveIcon />, count: countBy('closed') },
    { key: 'analytics',   label: 'Analytics',   icon: <TrendingUpIcon /> },
    { key: 'kb',          label: 'Knowledge Base', icon: <BookOpenIcon /> },
    { key: 'new',         label: 'New Ticket',  icon: <PlusCircleIcon /> },
  ];

  const isTicketView = !['kb', 'analytics'].includes(filter);

  const handleSidebar = (key) => {
    if (key === 'new') return openCreate();
    setFilter(key);
  };

  return (
    <div style={{ ...styles.page, backgroundColor: darkMode ? '#0f172a' : '#f0f2f5' }}>
      <Sidebar
        items={sidebarItems}
        activeKey={filter}
        onSelect={handleSidebar}
        contact={{ label: 'Contact Manager', email: 'testmanager@helpdesk.com' }}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />

      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0 }}>My Tickets</h2>
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

        {filter === 'analytics' && <AnalyticsPanel userID={user.id} role={user.role} />}

        {filter === 'kb' && <KnowledgeBase role={user.role} />}

        {isTicketView && (
        <>
        {/* Tickets Table */}
        <div style={styles.toolbar}>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        {visibleTickets.length === 0 ? (
          <p style={styles.empty}>
            {filter === 'all' ? 'No tickets submitted yet.' : `No ${filter.replace('_', ' ')} tickets.`}
          </p>
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
              {visibleTickets.map(t => (
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
                    <button onClick={() => openDetail(t)} style={styles.viewBtn}>View</button>
                    {/* Only allow edit/delete on open tickets */}
                    {t.StatusName === 'open' && (
                      <>
                        <button onClick={() => openEdit(t)} style={styles.editBtn}>Edit</button>
                        <button onClick={() => handleDelete(t.ID)} style={styles.deleteBtn}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </>
        )}

        {/* Create / Edit Ticket modal */}
        {showForm && (
          <div style={styles.overlay} onClick={() => { setShowForm(false); setEditingID(null); setForm(EMPTY_FORM); }}>
            <div style={styles.formModal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0 }}>{editingID ? 'Edit Ticket' : 'Submit a New Ticket'}</h3>
                <button
                  onClick={() => { setShowForm(false); setEditingID(null); setForm(EMPTY_FORM); }}
                  style={styles.modalClose}
                >
                  ✕
                </button>
              </div>
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
          </div>
        )}

        {/* Ticket detail modal: status timeline + conversation */}
        {detailTicket && (
          <div style={styles.overlay} onClick={() => setDetail(null)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0 }}>#{detailTicket.ID} — {detailTicket.Title}</h3>
                <button onClick={() => setDetail(null)} style={styles.modalClose}>✕</button>
              </div>
              <p style={styles.modalDesc}>{detailTicket.Description}</p>

              <h4 style={styles.sectionTitle}>Status Timeline</h4>
              <div style={styles.timelineBox}>
                <ActivityTimeline logs={activity} hideInternal />
              </div>

              <h4 style={styles.sectionTitle}>Conversation</h4>
              <div style={styles.commentList}>
                {comments.length === 0 ? (
                  <p style={styles.emptyText}>No replies yet.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.ID} style={styles.comment}>
                      <strong>{c.AuthorName}</strong>
                      <span style={styles.roleTag}> ({roleLabel(c.AuthorRole)})</span>
                      <span style={styles.commentDate}> · {new Date(c.CreatedAt).toLocaleString()}</span>
                      <p style={{ margin: '6px 0 0' }}>{c.CommentText}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendReply} style={styles.commentForm}>
                <textarea
                  style={styles.textarea}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  required
                />
                <button type="submit" style={styles.submitBtn}>Send Reply</button>
              </form>

              <Attachments
                ticketID={detailTicket.ID}
                userID={user.id}
                onChange={() => fetchActivity(detailTicket.ID)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:          { display: 'flex', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#fff' },
  container:     { flex: 1, padding: '32px', maxWidth: '1000px', margin: '0 auto', boxSizing: 'border-box' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  welcome:       { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  messageBanner: { backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toolbar:       { display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' },
  dismissBtn:    { background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: '16px' },
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
  viewBtn:       { padding: '5px 12px', backgroundColor: '#0369a1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' },
  editBtn:       { padding: '5px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' },
  deleteBtn:     { padding: '5px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  overlay:       { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal:         { backgroundColor: 'white', borderRadius: '10px', padding: '24px', width: '620px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto' },
  formModal:     { backgroundColor: 'white', borderRadius: '10px', padding: '24px', width: '440px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  modalClose:    { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6b7280' },
  modalDesc:     { color: '#6b7280', fontSize: '14px', marginTop: 0 },
  sectionTitle:  { margin: '18px 0 8px' },
  timelineBox:   { padding: '14px', backgroundColor: '#f9fafb', borderRadius: '6px', maxHeight: '220px', overflowY: 'auto' },
  commentList:   { maxHeight: '220px', overflowY: 'auto', marginBottom: '12px' },
  comment:       { padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '8px' },
  roleTag:       { color: '#9ca3af', fontSize: '12px' },
  commentDate:   { color: '#aaa', fontSize: '12px' },
  commentForm:   { display: 'flex', flexDirection: 'column', gap: '8px' },
};

export default EmployeeDashboard;

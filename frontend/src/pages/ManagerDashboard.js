import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import ActivityTimeline from '../components/ActivityTimeline';
import Sidebar from '../components/Sidebar';
import Attachments from '../components/Attachments';
import AuditTrail from '../components/AuditTrail';
import NotificationCenter from '../components/NotificationCenter';
import KnowledgeBase from '../components/KnowledgeBase';
import AnalyticsPanel from '../components/AnalyticsPanel';
import DateRangeFilter, { inDateRange } from '../components/DateRangeFilter';

const PRIORITY_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Urgent: '#7c3aed' };
const STATUS_COLORS   = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280', failed: '#ef4444' };

const roleLabel = (r) => (r === 'it_agent' ? 'IT Agent' : r);

const formatMinutes = (m) => {
  m = parseInt(m, 10) || 0;
  const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`;
};

function ManagerDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  const [filter, setFilter]           = useState('all');
  const [tickets, setTickets]         = useState([]);
  const [agents, setAgents]           = useState([]);
  const [message, setMessage]         = useState('');
  const [assignMap, setAssignMap]     = useState({});
  const [detailTicket, setDetail]     = useState(null);
  const [activity, setActivity]       = useState([]);
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal]   = useState(false);
  const [dateRange, setDateRange]     = useState({ from: '', to: '' });
  const intervalRef                   = useRef(null);

  const fetchTickets = async () => {
    const res = await axios.get('http://localhost/api/tickets.php?all=1');
    if (res.data.success) setTickets(res.data.tickets);
  };

  const fetchAgents = async () => {
    const res = await axios.get('http://localhost/api/users.php?role=it_agent');
    if (res.data.success) setAgents(res.data.users);
  };

  const fetchActivity = async (ticketID) => {
    const res = await axios.get(`http://localhost/api/activity.php?ticketID=${ticketID}`);
    if (res.data.success) setActivity(res.data.logs);
  };

  const fetchComments = async (ticketID) => {
    const res = await axios.get(`http://localhost/api/comments.php?ticketID=${ticketID}&role=manager`);
    if (res.data.success) setComments(res.data.comments);
  };

  useEffect(() => {
    fetchTickets();
    fetchAgents();
    intervalRef.current = setInterval(fetchTickets, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const openDetail = (ticket) => {
    setDetail(ticket);
    setActivity([]);
    setComments([]);
    fetchActivity(ticket.ID);
    fetchComments(ticket.ID);
  };

  const assignTicket = async (ticketID) => {
    const agentID = assignMap[ticketID];
    if (!agentID) return alert('Please select an IT agent first');
    const res = await axios.patch('http://localhost/api/tickets.php', {
      action: 'assign', ticketID, agentID, userID: user.id
    });
    if (res.data.success) { setMessage('Ticket assigned successfully'); fetchTickets(); }
    else setMessage(res.data.message);
  };

  const closeTicket = async (ticketID) => {
    if (!window.confirm('Close this ticket?')) return;
    const res = await axios.patch('http://localhost/api/tickets.php', {
      action: 'close', ticketID, userID: user.id
    });
    if (res.data.success) { setMessage('Ticket closed'); fetchTickets(); }
    else setMessage(res.data.message);
  };

  const addComment = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost/api/comments.php', {
      ticketID: detailTicket.ID,
      userID: user.id,
      commentText,
      isInternal: isInternal ? 1 : 0
    });
    if (res.data.success) {
      setCommentText('');
      setIsInternal(false);
      fetchComments(detailTicket.ID);
      fetchActivity(detailTicket.ID);
    }
  };

  const total      = tickets.length;
  const openCount  = tickets.filter(t => t.StatusName === 'open').length;
  const inProgress = tickets.filter(t => t.StatusName === 'in_progress').length;
  const resolved   = tickets.filter(t => t.StatusName === 'resolved').length;
  const closed     = tickets.filter(t => t.StatusName === 'closed').length;
  const unassigned = tickets.filter(t => !t.AgentName && t.StatusName !== 'closed' && t.StatusName !== 'resolved').length;

  const visibleTickets = (
    filter === 'all'        ? tickets :
    filter === 'unassigned' ? tickets.filter(t => !t.AgentName && t.StatusName !== 'closed' && t.StatusName !== 'resolved') :
    tickets.filter(t => t.StatusName === filter)
  ).filter(t => inDateRange(t.CreatedAt, dateRange));

  const sidebarItems = [
    { key: 'all',         label: 'All Tickets',  icon: '🎫', count: total },
    { key: 'unassigned',  label: 'Unassigned',   icon: '📌', count: unassigned },
    { key: 'open',        label: 'Open',         icon: '📭', count: openCount },
    { key: 'in_progress', label: 'In Progress',  icon: '⏳', count: inProgress },
    { key: 'resolved',    label: 'Resolved',     icon: '✅', count: resolved },
    { key: 'closed',      label: 'Closed',       icon: '📦', count: closed },
    { key: 'analytics',   label: 'Analytics',    icon: '📈' },
    { key: 'kb',          label: 'Knowledge Base', icon: '📚' },
    { key: 'audit',       label: 'Activity Log', icon: '📜' },
  ];

  const isTicketView = !['audit', 'kb', 'analytics'].includes(filter);

  return (
    <div style={styles.page}>
      <Sidebar
        items={sidebarItems}
        activeKey={filter}
        onSelect={setFilter}
        contact={{ label: 'Contact Admin', email: 'admin@helpdesk.com' }}
      />

      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0 }}>Manager Dashboard</h2>
            <p style={styles.welcome}>Welcome, {user?.name}</p>
          </div>
          <NotificationCenter userID={user.id} />
        </div>

        {message && (
          <div style={styles.messageBanner}>
            {message}
            <button onClick={() => setMessage('')} style={styles.dismissBtn}>✕</button>
          </div>
        )}

        {filter === 'audit' && <AuditTrail />}

        {filter === 'analytics' && <AnalyticsPanel userID={user.id} role={user.role} />}

        {filter === 'kb' && <KnowledgeBase role={user.role} />}

        {isTicketView && (
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
        )}

        {isTicketView && (
        <div style={styles.toolbar}>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        )}

        {isTicketView && (
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
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleTickets.map(t => (
              <tr key={t.ID}>
                <td style={styles.td}>{t.ID}</td>
                <td style={styles.td}><strong>{t.Title}</strong></td>
                <td style={styles.td}>{t.EmployeeName}</td>
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
                  {t.AgentName
                    ? <span style={styles.assignedName}>👤 {t.AgentName}</span>
                    : <span style={styles.unassigned}>Unassigned</span>}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionGroup}>
                    {t.StatusName !== 'closed' && t.StatusName !== 'resolved' && (
                      <>
                        <select
                          style={styles.select}
                          value={assignMap[t.ID] || ''}
                          onChange={e => setAssignMap({ ...assignMap, [t.ID]: e.target.value })}
                        >
                          <option value="">Assign to...</option>
                          {agents.map(a => (
                            <option key={a.ID} value={a.ID}>{a.Name}</option>
                          ))}
                        </select>
                        <button onClick={() => assignTicket(t.ID)} style={styles.assignBtn}>Assign</button>
                      </>
                    )}
                    {t.StatusName !== 'closed' && (
                      <button onClick={() => closeTicket(t.ID)} style={styles.closeBtn}>Close</button>
                    )}
                    {t.StatusName === 'closed' && <span style={styles.doneLabel}>✓ Closed</span>}
                    <button onClick={() => openDetail(t)} style={styles.historyBtn}>Details</button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleTickets.length === 0 && (
              <tr>
                <td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>No tickets found</td>
              </tr>
            )}
          </tbody>
        </table>
        )}

        {/* Ticket detail modal: status timeline + comments + internal notes */}
        {detailTicket && (
          <div style={styles.overlay} onClick={() => setDetail(null)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0 }}>#{detailTicket.ID} — {detailTicket.Title}</h3>
                <button onClick={() => setDetail(null)} style={styles.modalClose}>✕</button>
              </div>
              <p style={styles.modalDesc}>{detailTicket.Description}</p>
              <p style={styles.workMeta}>
                Assigned to: <strong>{detailTicket.AgentName || 'Unassigned'}</strong>
                {' · '}Work logged: <strong>{formatMinutes(detailTicket.WorkMinutes)}</strong>
              </p>

              <h4 style={styles.sectionTitle}>Status Timeline</h4>
              <div style={styles.timelineBox}>
                <ActivityTimeline logs={activity} />
              </div>

              <h4 style={styles.sectionTitle}>Comments</h4>
              <div style={styles.commentList}>
                {comments.length === 0 ? (
                  <p style={styles.emptyText}>No comments yet.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.ID} style={c.IsInternal === '1' || c.IsInternal === 1 ? styles.internalComment : styles.comment}>
                      <strong>{c.AuthorName}</strong>
                      <span style={styles.roleTag}> ({roleLabel(c.AuthorRole)})</span>
                      {(c.IsInternal === '1' || c.IsInternal === 1) && <span style={styles.internalBadge}>🔒 Internal</span>}
                      <span style={styles.commentDate}> · {new Date(c.CreatedAt).toLocaleString()}</span>
                      <p style={{ margin: '6px 0 0' }}>{c.CommentText}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={addComment} style={styles.commentForm}>
                <textarea
                  style={styles.textarea}
                  placeholder={isInternal ? 'Add an internal note (hidden from the employee)...' : 'Add a comment...'}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  required
                />
                <label style={styles.internalLabel}>
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={e => setIsInternal(e.target.checked)}
                  />
                  {' '}Internal note (staff only)
                </label>
                <button type="submit" style={styles.submitBtn}>
                  {isInternal ? 'Add Internal Note' : 'Add Comment'}
                </button>
              </form>

              {detailTicket.StatusName === 'closed' && (
                <>
                  <h4 style={styles.sectionTitle}>Publish to Knowledge Base</h4>
                  <PublishToKBForm
                    key={detailTicket.ID}
                    ticket={detailTicket}
                    userID={user.id}
                    onDone={(msg) => setMessage(msg)}
                  />
                </>
              )}

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

// Lets the manager publish a closed ticket's resolution as a searchable KB
// article. Keyed by ticket ID from the parent so defaultValues reset per ticket.
function PublishToKBForm({ ticket, userID, onDone }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { title: ticket.Title, solution: '' },
  });

  const onSubmit = async (data) => {
    const res = await axios.post('http://localhost/api/knowledgebase.php', {
      ticketID: ticket.ID,
      title: data.title,
      solution: data.solution,
      userID,
    });
    onDone(res.data.message);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={styles.commentForm}>
      <input style={styles.input} {...register('title', { required: true })} />
      <textarea
        style={styles.textarea}
        placeholder="Describe the solution that resolved this ticket..."
        {...register('solution', { required: true })}
      />
      <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
        {isSubmitting ? 'Publishing...' : 'Publish to Knowledge Base'}
      </button>
    </form>
  );
}

const styles = {
  page:         { display: 'flex', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#fff' },
  container:    { flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  welcome:      { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  statsRow:     { display: 'flex', gap: '16px', marginBottom: '24px' },
  toolbar:      { display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' },
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
  historyBtn:   { padding: '5px 12px', backgroundColor: '#0369a1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  doneLabel:    { color: '#10b981', fontSize: '13px', fontWeight: '500' },
  overlay:      { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal:        { backgroundColor: 'white', borderRadius: '10px', padding: '24px', width: '640px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  modalClose:   { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6b7280' },
  modalDesc:    { color: '#6b7280', fontSize: '14px', marginTop: 0 },
  workMeta:     { color: '#374151', fontSize: '13px', margin: '0 0 4px' },
  sectionTitle: { margin: '18px 0 8px' },
  timelineBox:  { padding: '14px', backgroundColor: '#f9fafb', borderRadius: '6px', maxHeight: '240px', overflowY: 'auto' },
  commentList:  { maxHeight: '220px', overflowY: 'auto', marginBottom: '12px' },
  comment:      { padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '8px' },
  internalComment:{ padding: '10px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', marginBottom: '8px' },
  internalBadge:{ marginLeft: '8px', fontSize: '11px', backgroundColor: '#b45309', color: 'white', padding: '2px 8px', borderRadius: '10px' },
  roleTag:      { color: '#9ca3af', fontSize: '12px' },
  commentDate:  { color: '#aaa', fontSize: '12px' },
  commentForm:  { display: 'flex', flexDirection: 'column', gap: '8px' },
  input:        { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  textarea:     { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', height: '70px' },
  internalLabel:{ fontSize: '13px', color: '#374151', cursor: 'pointer' },
  submitBtn:    { padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start' },
  emptyText:    { color: '#9ca3af', fontSize: '13px' },
};

export default ManagerDashboard;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ActivityTimeline from '../components/ActivityTimeline';
import Sidebar from '../components/Sidebar';
import Attachments from '../components/Attachments';
import NotificationCenter from '../components/NotificationCenter';
import KnowledgeBase from '../components/KnowledgeBase';
import AnalyticsPanel from '../components/AnalyticsPanel';
import DateRangeFilter, { inDateRange } from '../components/DateRangeFilter';

const roleLabel = (r) => (r === 'it_agent' ? 'IT Agent' : r);

const formatMinutes = (m) => {
  m = parseInt(m, 10) || 0;
  const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`;
};

function AgentDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  const [view, setView]               = useState('queue'); // 'queue' | 'resolved'
  const [tickets, setTickets]         = useState([]);      // active queue (in_progress)
  const [doneTickets, setDone]        = useState([]);      // resolved / closed history
  const [selectedTicket, setSelected] = useState(null);
  const [comments, setComments]       = useState([]);
  const [activity, setActivity]       = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal]   = useState(false);
  const [workH, setWorkH]             = useState('');
  const [workM, setWorkM]             = useState('');
  const [message, setMessage]         = useState('');
  const [dateRange, setDateRange]     = useState({ from: '', to: '' });
  const intervalRef                   = useRef(null);

  const fetchTickets = async () => {
    const res = await axios.get(`http://localhost/api/tickets.php?assignedTo=${user.id}&status=2`);
    if (res.data.success) setTickets(res.data.tickets);
  };

  const fetchDone = async () => {
    const res = await axios.get(`http://localhost/api/tickets.php?assignedTo=${user.id}&status=3,4`);
    if (res.data.success) setDone(res.data.tickets);
  };

  const fetchComments = async (ticketID) => {
    const res = await axios.get(`http://localhost/api/comments.php?ticketID=${ticketID}&role=it_agent`);
    if (res.data.success) setComments(res.data.comments);
  };

  const fetchActivity = async (ticketID) => {
    const res = await axios.get(`http://localhost/api/activity.php?ticketID=${ticketID}`);
    if (res.data.success) setActivity(res.data.logs);
  };

  useEffect(() => {
    fetchTickets();
    fetchDone();
    intervalRef.current = setInterval(() => { fetchTickets(); fetchDone(); }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const openTicket = (ticket) => {
    setSelected(ticket);
    fetchComments(ticket.ID);
    fetchActivity(ticket.ID);
  };

  const switchView = (key) => {
    setView(key);
    setSelected(null);
    setMessage('');
  };

  const updateStatus = async (ticketID, statusID) => {
    const added = (parseInt(workH, 10) || 0) * 60 + (parseInt(workM, 10) || 0);
    const res = await axios.patch('http://localhost/api/tickets.php', {
      action: 'status', ticketID, statusID, userID: user.id,
      workHours: parseInt(workH, 10) || 0, workMinutes: parseInt(workM, 10) || 0
    });
    if (res.data.success) {
      setMessage(added > 0 ? `Status updated · logged ${formatMinutes(added)}` : 'Status updated');
      setWorkH(''); setWorkM('');
      fetchTickets();
      fetchDone();
      fetchActivity(ticketID);
      if (selectedTicket) setSelected({
        ...selectedTicket,
        StatusName: statusID === '3' ? 'resolved' : 'in_progress',
        WorkMinutes: (parseInt(selectedTicket.WorkMinutes, 10) || 0) + added
      });
    } else {
      setMessage(res.data.message);
    }
  };

  const failTicket = async (ticketID) => {
    const res = await axios.patch('http://localhost/api/tickets.php', {
      action: 'failed', ticketID, userID: user.id
    });
    if (res.data.success) {
      setMessage('Ticket sent back to manager');
      setSelected(null);
      fetchTickets();
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost/api/comments.php', {
      ticketID: selectedTicket.ID,
      userID: user.id,
      commentText,
      isInternal: isInternal ? 1 : 0
    });
    if (res.data.success) {
      setCommentText('');
      setIsInternal(false);
      fetchComments(selectedTicket.ID);
      fetchActivity(selectedTicket.ID);
    }
  };

  const sidebarItems = [
    { key: 'queue',     label: 'My Queue',       icon: '📥', count: tickets.length },
    { key: 'resolved',  label: 'Resolved by Me', icon: '✅', count: doneTickets.length },
    { key: 'analytics', label: 'Analytics',      icon: '📈' },
    { key: 'kb',        label: 'Knowledge Base', icon: '📚' },
  ];

  const list = (view === 'queue' ? tickets : doneTickets)
    .filter(t => inDateRange(t.CreatedAt, dateRange));
  const isTicketView = view === 'queue' || view === 'resolved';

  return (
    <div style={styles.page}>
      <Sidebar
        items={sidebarItems}
        activeKey={view}
        onSelect={switchView}
        contact={{ label: 'Contact Manager', email: 'testmanager@helpdesk.com' }}
      />

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0 }}>IT-Agent Dashboard</h2>
            <p style={styles.welcome}>Welcome, {user?.name}</p>
          </div>
          <NotificationCenter userID={user.id} />
        </div>

        {message && <p style={styles.success}>{message}</p>}

        {view === 'analytics' && <AnalyticsPanel userID={user.id} role={user.role} />}

        {view === 'kb' && <KnowledgeBase role={user.role} />}

        {isTicketView && (
        <div style={styles.layout}>
          {/* Ticket List */}
          <div style={styles.ticketList}>
            <h3>{view === 'queue' ? 'My Assigned Tickets' : 'Resolved by Me'}</h3>
            <div style={styles.toolbar}>
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
            </div>
            {list.length === 0 ? (
              <p style={styles.empty}>
                {view === 'queue' ? 'No tickets assigned yet.' : 'No resolved tickets yet.'}
              </p>
            ) : (
              list.map((t) => (
                <div
                  key={t.ID}
                  style={{ ...styles.ticketCard, backgroundColor: selectedTicket?.ID === t.ID ? '#eef2ff' : 'white' }}
                  onClick={() => openTicket(t)}
                >
                  <strong>{t.Title}</strong>
                  <p style={styles.meta}>{t.CategoryName} · {t.PriorityName} · <span style={styles.status}>{t.StatusName}</span></p>
                  <p style={styles.meta}>From: {t.EmployeeName}</p>
                </div>
              ))
            )}
          </div>

          {/* Ticket Detail */}
          {selectedTicket && (
            <div style={styles.ticketDetail}>
              <h3>{selectedTicket.Title}</h3>
              <p>{selectedTicket.Description}</p>
              <p style={styles.meta}>
                Status: <strong>{selectedTicket.StatusName}</strong>
                {' · '}Work logged: <strong>{formatMinutes(selectedTicket.WorkMinutes)}</strong>
              </p>

              {view === 'queue' && (
                <>
                  <div style={styles.workTimeRow}>
                    <span style={styles.workTimeLabel}>Work time for this update:</span>
                    <input
                      type="number" min="0" placeholder="0" style={styles.timeInput}
                      value={workH} onChange={(e) => setWorkH(e.target.value)}
                    />
                    <span style={styles.timeUnit}>h</span>
                    <input
                      type="number" min="0" max="59" placeholder="0" style={styles.timeInput}
                      value={workM} onChange={(e) => setWorkM(e.target.value)}
                    />
                    <span style={styles.timeUnit}>m</span>
                  </div>
                  <div style={styles.statusBtns}>
                    <button onClick={() => updateStatus(selectedTicket.ID, '2')} style={styles.inProgressBtn}>Mark In Progress</button>
                    <button onClick={() => updateStatus(selectedTicket.ID, '3')} style={styles.resolvedBtn}>Mark Resolved</button>
                    <button onClick={() => failTicket(selectedTicket.ID)} style={styles.failedBtn}>Failed to Resolve</button>
                  </div>
                </>
              )}

              {/* Status timeline / ticket history */}
              <div style={styles.historyHeader}>
                <h4 style={{ margin: 0 }}>History</h4>
                <button onClick={() => setShowHistory(!showHistory)} style={styles.toggleBtn}>
                  {showHistory ? 'Hide' : 'Show'}
                </button>
              </div>
              {showHistory && (
                <div style={styles.historyBox}>
                  <ActivityTimeline logs={activity} />
                </div>
              )}

              <h4 style={{ marginTop: '24px' }}>Comments</h4>
              <div style={styles.commentList}>
                {comments.length === 0 ? (
                  <p style={styles.empty}>No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.ID} style={c.IsInternal === '1' || c.IsInternal === 1 ? styles.internalComment : styles.comment}>
                      <strong>{c.AuthorName}</strong>
                      <span style={styles.roleTag}> ({roleLabel(c.AuthorRole)})</span>
                      {(c.IsInternal === '1' || c.IsInternal === 1) && <span style={styles.internalBadge}>🔒 Internal</span>}
                      <span style={styles.commentDate}> · {new Date(c.CreatedAt).toLocaleString()}</span>
                      <p>{c.CommentText}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={addComment} style={styles.commentForm}>
                <textarea
                  style={styles.textarea}
                  placeholder={isInternal ? 'Add an internal note (hidden from the employee)...' : 'Add a comment...'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
                <label style={styles.internalLabel}>
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                  />
                  {' '}Internal note (staff only)
                </label>
                <button type="submit" style={styles.submitBtn}>
                  {isInternal ? 'Add Internal Note' : 'Add Comment'}
                </button>
              </form>

              <Attachments
                ticketID={selectedTicket.ID}
                userID={user.id}
                onChange={() => fetchActivity(selectedTicket.ID)}
              />
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:          { display: 'flex', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#fff' },
  container:     { flex: 1, padding: '32px', maxWidth: '1100px', margin: '0 auto', boxSizing: 'border-box' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  welcome:       { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  success:       { color: 'green' },
  toolbar:       { marginBottom: '12px' },
  layout:        { display: 'flex', gap: '24px' },
  ticketList:    { width: '35%' },
  ticketCard:    { padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', cursor: 'pointer' },
  ticketDetail:  { flex: 1, padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px' },
  meta:          { color: '#888', fontSize: '13px', margin: '4px 0' },
  status:        { color: '#4f46e5', fontWeight: 'bold' },
  workTimeRow:   { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', flexWrap: 'wrap' },
  workTimeLabel: { fontSize: '13px', color: '#374151', marginRight: '4px' },
  timeInput:     { width: '56px', padding: '5px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' },
  timeUnit:      { fontSize: '13px', color: '#6b7280', marginRight: '6px' },
  statusBtns:    { display: 'flex', gap: '12px', marginTop: '12px' },
  inProgressBtn: { padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  resolvedBtn:   { padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  failedBtn:     { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  historyHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px' },
  toggleBtn:     { padding: '3px 10px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  historyBox:    { marginTop: '12px', padding: '14px', backgroundColor: '#f9fafb', borderRadius: '6px', maxHeight: '260px', overflowY: 'auto' },
  commentList:   { maxHeight: '220px', overflowY: 'auto', marginBottom: '16px' },
  comment:       { padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '8px' },
  internalComment:{ padding: '10px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', marginBottom: '8px' },
  internalBadge: { marginLeft: '8px', fontSize: '11px', backgroundColor: '#b45309', color: 'white', padding: '2px 8px', borderRadius: '10px' },
  roleTag:       { color: '#9ca3af', fontSize: '12px' },
  commentDate:   { color: '#aaa', fontSize: '12px' },
  commentForm:   { display: 'flex', flexDirection: 'column', gap: '8px' },
  textarea:      { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', height: '80px' },
  internalLabel: { fontSize: '13px', color: '#374151', cursor: 'pointer' },
  submitBtn:     { padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start' },
  empty:         { color: '#888', fontSize: '13px' },
};

export default AgentDashboard;

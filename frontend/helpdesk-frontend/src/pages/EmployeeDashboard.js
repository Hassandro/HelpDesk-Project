import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function EmployeeDashboard() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const [tickets, setTickets]         = useState([]);
  const [selectedTicket, setSelected] = useState(null);
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState('');
  const [message, setMessage]         = useState('');

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchTickets = async () => {
    const res = await axios.get(`http://localhost/helpdesk/api/tickets.php?assignedTo=${user.id}`);
    if (res.data.success) setTickets(res.data.tickets);
  };

  const fetchComments = async (ticketID) => {
    const res = await axios.get(`http://localhost/helpdesk/api/comments.php?ticketID=${ticketID}`);
    if (res.data.success) setComments(res.data.comments);
  };

  useEffect(() => { fetchTickets(); }, []);

  const openTicket = (ticket) => {
    setSelected(ticket);
    fetchComments(ticket.ID);
  };

  const updateStatus = async (ticketID, statusID) => {
    const res = await axios.patch('http://localhost/helpdesk/api/tickets.php', {
      action: 'status', ticketID, statusID
    });
    if (res.data.success) {
      setMessage('Status updated');
      fetchTickets();
      if (selectedTicket) setSelected({ ...selectedTicket, StatusName: statusID === '3' ? 'resolved' : 'in_progress' });
    }
  };

    const failTicket = async (ticketID) => {
        const res = await axios.patch('http://localhost/helpdesk/api/tickets.php', {
            action: 'failed', ticketID
        });
        if (res.data.success) {
            setMessage('Ticket sent back to manager');
            setSelected(null);
            fetchTickets();
        }
    };
  const addComment = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost/helpdesk/api/comments.php', {
      ticketID: selectedTicket.ID,
      userID: user.id,
      commentText
    });
    if (res.data.success) {
      setCommentText('');
      fetchComments(selectedTicket.ID);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Employee Dashboard</h2>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {message && <p style={styles.success}>{message}</p>}

      <div style={styles.layout}>
        {/* Ticket List */}
        <div style={styles.ticketList}>
          <h3>My Assigned Tickets</h3>
          {tickets.length === 0 ? (
            <p style={styles.empty}>No tickets assigned yet.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.ID}
                style={{ ...styles.ticketCard, backgroundColor: selectedTicket?.ID === t.ID ? '#eef2ff' : 'white' }}
                onClick={() => openTicket(t)}
              >
                <strong>{t.Title}</strong>
                <p style={styles.meta}>{t.CategoryName} · {t.PriorityName} · <span style={styles.status}>{t.StatusName}</span></p>
                <p style={styles.meta}>From: {t.CustomerName}</p>
              </div>
            ))
          )}
        </div>

        {/* Ticket Detail */}
        {selectedTicket && (
          <div style={styles.ticketDetail}>
            <h3>{selectedTicket.Title}</h3>
            <p>{selectedTicket.Description}</p>
            <p style={styles.meta}>Status: <strong>{selectedTicket.StatusName}</strong></p>

                      <div style={styles.statusBtns}>
                          <button onClick={() => updateStatus(selectedTicket.ID, '2')} style={styles.inProgressBtn}>Mark In Progress</button>
                          <button onClick={() => updateStatus(selectedTicket.ID, '3')} style={styles.resolvedBtn}>Mark Resolved</button>
                          <button onClick={() => failTicket(selectedTicket.ID)} style={styles.failedBtn}>Failed to Resolve</button>
                      </div>

            <h4 style={{ marginTop: '24px' }}>Comments</h4>
            <div style={styles.commentList}>
              {comments.length === 0 ? (
                <p style={styles.empty}>No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.ID} style={styles.comment}>
                    <strong>{c.AuthorName}</strong>
                    <span style={styles.commentDate}> · {new Date(c.CreatedAt).toLocaleString()}</span>
                    <p>{c.CommentText}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addComment} style={styles.commentForm}>
              <textarea
                style={styles.textarea}
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <button type="submit" style={styles.submitBtn}>Add Comment</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:     { padding: '32px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  logoutBtn:     { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  success:       { color: 'green' },
  layout:        { display: 'flex', gap: '24px' },
  ticketList:    { width: '35%' },
  ticketCard:    { padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', cursor: 'pointer' },
  ticketDetail:  { flex: 1, padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px' },
  meta:          { color: '#888', fontSize: '13px', margin: '4px 0' },
  status:        { color: '#4f46e5', fontWeight: 'bold' },
  statusBtns:    { display: 'flex', gap: '12px', marginTop: '16px' },
  inProgressBtn: { padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  resolvedBtn:   { padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  commentList:   { maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' },
  comment:       { padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '8px' },
  commentDate:   { color: '#aaa', fontSize: '12px' },
  commentForm:   { display: 'flex', flexDirection: 'column', gap: '8px' },
  textarea:      { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', height: '80px' },
  submitBtn:     { padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start' },
  empty:         { color: '#888', fontSize: '13px' },
  failedBtn: { padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default EmployeeDashboard;
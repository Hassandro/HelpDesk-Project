import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ACTION_META } from './ActivityTimeline';

// Global activity log / audit trail. Restricted to admin + manager dashboards.
function AuditTrail() {
  const [logs, setLogs] = useState([]);

  const fetchAudit = async () => {
    const res = await axios.get('http://localhost/api/activity.php?all=1');
    if (res.data.success) setLogs(res.data.logs);
  };

  useEffect(() => { fetchAudit(); }, []);

  return (
    <>
      <div style={styles.toolbar}>
        <p style={styles.hint}>Latest 200 actions across all tickets.</p>
        <button onClick={fetchAudit} style={styles.refresh}>Refresh</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>User</th>
            <th style={styles.th}>Action</th>
            <th style={styles.th}>Ticket</th>
            <th style={styles.th}>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => {
            const meta = ACTION_META[log.Action] || { label: log.Action, color: '#6b7280' };
            return (
              <tr key={log.ID}>
                <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{new Date(log.Timestamp).toLocaleString()}</td>
                <td style={styles.td}>{log.UserName}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: meta.color }}>{meta.label}</span>
                </td>
                <td style={styles.td}>
                  {log.TicketID
                    ? <>#{log.TicketID}{log.TicketTitle ? ` — ${log.TicketTitle}` : ''}</>
                    : <span style={{ color: '#9ca3af' }}>—</span>}
                </td>
                <td style={styles.td}>{log.Details || <span style={{ color: '#9ca3af' }}>—</span>}</td>
              </tr>
            );
          })}
          {logs.length === 0 && (
            <tr>
              <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                No activity recorded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

const styles = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' },
  hint:    { margin: 0, color: '#6b7280', fontSize: '13px' },
  refresh: { padding: '8px 18px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  th:      { backgroundColor: '#4f46e5', color: 'white', padding: '11px 12px', textAlign: 'left', fontSize: '14px' },
  td:      { padding: '11px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' },
  badge:   { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: '500' },
};

export default AuditTrail;

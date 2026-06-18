import React from 'react';
import { PlusIcon, PencilIcon, UserIcon, RefreshIcon, MessageSquareIcon, LockIcon, PaperclipIcon, CheckIcon, RotateCcwIcon, Trash2Icon } from './Icons';

export const ACTION_META = {
  created:        { label: 'Created',        color: '#3b82f6', icon: <PlusIcon size={13} /> },
  updated:        { label: 'Updated',        color: '#8b5cf6', icon: <PencilIcon size={13} /> },
  assigned:       { label: 'Assigned',       color: '#4f46e5', icon: <UserIcon size={13} /> },
  status_changed: { label: 'Status changed', color: '#f59e0b', icon: <RefreshIcon size={13} /> },
  commented:      { label: 'Comment',        color: '#10b981', icon: <MessageSquareIcon size={13} /> },
  internal_note:  { label: 'Internal note',  color: '#b45309', icon: <LockIcon size={13} /> },
  attachment:     { label: 'Attachment',     color: '#0891b2', icon: <PaperclipIcon size={13} /> },
  closed:         { label: 'Closed',         color: '#6b7280', icon: <CheckIcon size={13} /> },
  reopened:       { label: 'Reopened',       color: '#ef4444', icon: <RotateCcwIcon size={13} /> },
  deleted:        { label: 'Deleted',        color: '#ef4444', icon: <Trash2Icon size={13} /> },
};

// Vertical status timeline for one ticket's activity logs.
// hideInternal: drop internal-note entries (employee/submitter view).
function ActivityTimeline({ logs, hideInternal }) {
  const visible = hideInternal ? logs.filter(l => l.Action !== 'internal_note') : logs;

  if (visible.length === 0) {
    return <p style={styles.empty}>No activity yet.</p>;
  }

  return (
    <div>
      {visible.map((log, i) => {
        const meta = ACTION_META[log.Action] || { label: log.Action, color: '#6b7280', icon: '•' };
        return (
          <div key={log.ID} style={styles.item}>
            <div style={styles.rail}>
              <span style={{ ...styles.dot, backgroundColor: meta.color }} />
              {i < visible.length - 1 && <span style={styles.line} />}
            </div>
            <div style={styles.body}>
              <div>
                <span style={{ ...styles.action, color: meta.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{meta.icon} {meta.label}</span>
                <span style={styles.who}> by {log.UserName}</span>
                <span style={styles.when}> · {new Date(log.Timestamp).toLocaleString()}</span>
              </div>
              {log.Details && <p style={styles.details}>{log.Details}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  empty:   { color: '#9ca3af', fontSize: '13px' },
  item:    { display: 'flex', gap: '10px' },
  rail:    { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '14px' },
  dot:     { width: '10px', height: '10px', borderRadius: '50%', marginTop: '5px', flexShrink: 0 },
  line:    { width: '2px', flex: 1, backgroundColor: '#e5e7eb', minHeight: '14px' },
  body:    { paddingBottom: '14px', flex: 1 },
  action:  { fontSize: '13px', fontWeight: '600' },
  who:     { fontSize: '13px', color: '#374151' },
  when:    { fontSize: '12px', color: '#9ca3af' },
  details: { margin: '3px 0 0', fontSize: '13px', color: '#6b7280' },
};

export default ActivityTimeline;

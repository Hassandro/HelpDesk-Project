import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserIcon, RefreshIcon, PaperclipIcon, BellIcon } from './Icons';

const API = 'http://localhost/api/notifications.php';

const TYPE_META = {
  assigned:       { icon: <UserIcon size={15} />,       color: '#4f46e5' },
  status_changed: { icon: <RefreshIcon size={15} />,    color: '#f59e0b' },
  attachment:     { icon: <PaperclipIcon size={15} />,  color: '#0891b2' },
  general:        { icon: <BellIcon size={15} />,       color: '#6b7280' },
};

const timeAgo = (dateStr) => {
  const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const isUnread = (n) => !(n.IsRead === '1' || n.IsRead === 1);

// Bell + dropdown shown in every dashboard header. Polls notifications.php
// every 15s — this stack's substitute for SignalR push notifications.
function NotificationCenter({ userID }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', userID],
    queryFn: async () => {
      const res = await axios.get(`${API}?userID=${userID}`);
      return res.data.success ? res.data : { notifications: [], unreadCount: 0 };
    },
    refetchInterval: 15000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications', userID] });

  const markRead = useMutation({
    mutationFn: (notificationID) => axios.patch(API, { userID, notificationID }),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => axios.patch(API, { userID, all: true }),
    onSuccess: invalidate,
  });

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div style={styles.wrap} ref={wrapRef}>
      <button onClick={() => setOpen(!open)} style={styles.bell} title="Notifications">
        <BellIcon size={20} />
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead.mutate()} style={styles.markAllBtn}>Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p style={styles.empty}>No notifications yet.</p>
          ) : (
            <div style={styles.list}>
              {notifications.map(n => {
                const meta = TYPE_META[n.Type] || TYPE_META.general;
                const unread = isUnread(n);
                return (
                  <div
                    key={n.ID}
                    onClick={() => unread && markRead.mutate(n.ID)}
                    style={{ ...styles.item, backgroundColor: unread ? '#eef2ff' : 'transparent' }}
                  >
                    <span style={{ ...styles.itemIcon, color: meta.color }}>{meta.icon}</span>
                    <div style={styles.itemBody}>
                      <p style={styles.itemMessage}>{n.Message}</p>
                      <span style={styles.itemTime}>{timeAgo(n.CreatedAt)}</span>
                    </div>
                    {unread && <span style={styles.dot} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap:          { position: 'relative', display: 'inline-block' },
  bell:          { position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', color: '#374151' },
  badge:         { position: 'absolute', top: '0', right: '0', backgroundColor: '#ef4444', color: 'white', borderRadius: '10px', fontSize: '10px', fontWeight: '700', padding: '1px 5px', minWidth: '16px', lineHeight: '14px' },
  dropdown:      { position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  dropdownHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #e5e7eb' },
  markAllBtn:    { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  empty:         { color: '#9ca3af', fontSize: '13px', padding: '20px', margin: 0, textAlign: 'center' },
  list:          { overflowY: 'auto', maxHeight: '360px' },
  item:          { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' },
  itemIcon:      { fontSize: '16px', flexShrink: 0, marginTop: '2px' },
  itemBody:      { flex: 1, minWidth: 0 },
  itemMessage:   { margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.4' },
  itemTime:      { fontSize: '11px', color: '#9ca3af' },
  dot:           { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5', flexShrink: 0, marginTop: '6px' },
};

export default NotificationCenter;

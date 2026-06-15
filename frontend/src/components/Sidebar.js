import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Collapsible control panel shared by all dashboards.
// items:   [{ key, label, icon, count? }] — count shows as a badge when provided
// contact: { label, email } — mailto link shown above Logout
function Sidebar({ items, activeKey, onSelect, contact }) {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [open, setOpen] = useState(localStorage.getItem('sidebarOpen') !== '0');

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem('sidebarOpen', next ? '1' : '0');
  };

  const logout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div style={{ ...styles.sidebar, width: open ? '240px' : '62px' }}>
      <button onClick={toggle} style={styles.burger} title={open ? 'Hide panel' : 'Show panel'}>☰</button>

      <div style={{ ...styles.userCard, justifyContent: open ? 'flex-start' : 'center' }}>
        <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || '?'}</div>
        {open && (
          <div style={{ overflow: 'hidden' }}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>{user?.role === 'it_agent' ? 'IT Agent' : user?.role}</div>
          </div>
        )}
      </div>

      <nav style={styles.nav}>
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            title={item.label}
            style={{
              ...styles.item,
              ...(activeKey === item.key ? styles.itemActive : {}),
              justifyContent: open ? 'space-between' : 'center',
            }}
          >
            <span style={styles.itemMain}>
              <span style={styles.itemIcon}>{item.icon}</span>
              {open && <span>{item.label}</span>}
            </span>
            {open && item.count !== undefined && <span style={styles.count}>{item.count}</span>}
          </button>
        ))}
      </nav>

      <div style={styles.bottom}>
        {contact && (
          <a
            href={`mailto:${contact.email}`}
            style={{ ...styles.contact, justifyContent: open ? 'flex-start' : 'center' }}
            title={`${contact.label}: ${contact.email}`}
          >
            <span style={styles.itemIcon}>✉️</span>
            {open && (
              <span style={styles.contactText}>
                <span style={styles.contactLabel}>{contact.label}</span>
                <span style={styles.contactEmail}>{contact.email}</span>
              </span>
            )}
          </a>
        )}
        <button
          onClick={logout}
          style={{ ...styles.logout, justifyContent: open ? 'flex-start' : 'center' }}
          title="Logout"
        >
          <span style={styles.itemIcon}>⏻</span>
          {open && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar:      { backgroundColor: '#1e1b4b', color: 'white', minHeight: '100vh', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', flexShrink: 0, boxSizing: 'border-box', padding: '14px 10px', transition: 'width 0.2s ease', overflow: 'hidden' },
  burger:       { background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', alignSelf: 'flex-start', padding: '6px 10px', borderRadius: '6px' },
  userCard:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 6px', borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: '12px' },
  avatar:       { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0 },
  userName:     { fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole:     { fontSize: '12px', color: '#a5b4fc', textTransform: 'capitalize' },
  nav:          { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  // item/itemActive must set the SAME properties (longhand only) — mixing the
  // 'background' shorthand with 'backgroundColor' breaks React's style diffing
  // when the highlight moves to another item (old item falls back to the
  // browser's default white button background).
  item:         { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 10px', backgroundColor: 'transparent', border: 'none', color: '#c7d2fe', fontWeight: '400', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', textAlign: 'left', whiteSpace: 'nowrap' },
  itemActive:   { backgroundColor: '#4f46e5', color: 'white', fontWeight: '600' },
  itemMain:     { display: 'flex', alignItems: 'center', gap: '10px' },
  itemIcon:     { fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 },
  count:        { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '1px 8px', fontSize: '12px', fontWeight: '600' },
  bottom:       { borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' },
  contact:      { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', color: '#c7d2fe', borderRadius: '6px', textDecoration: 'none' },
  contactText:  { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  contactLabel: { fontSize: '13px', fontWeight: '600' },
  contactEmail: { fontSize: '11px', color: '#a5b4fc', wordBreak: 'break-all' },
  logout:       { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 10px', background: 'none', border: 'none', color: '#fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' },
};

export default Sidebar;

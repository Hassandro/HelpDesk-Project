import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Collapsible control panel shared by all dashboards.
// items:   [{ key, label, icon, count? }] — count shows as a badge when provided
// contact: { label, email } — mailto link shown above Logout
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

function Sidebar({ items, activeKey, onSelect, contact, darkMode, onToggleDark }) {
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
      <div style={styles.topRow}>
        <button onClick={toggle} style={styles.burger} title={open ? 'Hide panel' : 'Show panel'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        {onToggleDark && (
          <button onClick={onToggleDark} style={styles.darkBtn} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        )}
      </div>

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
  topRow:       { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' },
  burger:       { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
  darkBtn:      { background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
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

import React from 'react';

// Filters a ticket list by CreatedAt date. `value` is {from, to} (ISO date
// strings, '' when unset); `onChange` receives the updated {from, to}.
function DateRangeFilter({ value, onChange }) {
  const { from = '', to = '' } = value || {};

  return (
    <div style={styles.wrapper}>
      <label style={styles.label}>From</label>
      <input
        type="date"
        value={from}
        max={to || undefined}
        onChange={e => onChange({ from: e.target.value, to })}
        style={styles.input}
      />
      <label style={styles.label}>To</label>
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={e => onChange({ from, to: e.target.value })}
        style={styles.input}
      />
      {(from || to) && (
        <button onClick={() => onChange({ from: '', to: '' })} style={styles.clearBtn}>Clear</button>
      )}
    </div>
  );
}

export const inDateRange = (createdAt, { from, to } = {}) => {
  const day = String(createdAt).slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
};

const styles = {
  wrapper:  { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  label:    { fontSize: '13px', color: '#6b7280' },
  input:    { padding: '5px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' },
  clearBtn: { padding: '5px 12px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
};

export default DateRangeFilter;

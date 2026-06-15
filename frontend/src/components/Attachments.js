import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost/api/attachments.php';

const prettySize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Attachment list + upload control for one ticket. Self-contained: fetches its
// own list and refreshes after an upload. onChange fires so parents can refresh
// the activity timeline (uploads are logged).
function Attachments({ ticketID, userID, onChange }) {
  const [files, setFiles]     = useState([]);
  const [picked, setPicked]   = useState(null);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const inputRef              = useRef(null);

  const fetchFiles = async () => {
    const res = await axios.get(`${API}?ticketID=${ticketID}`);
    if (res.data.success) setFiles(res.data.attachments);
  };

  useEffect(() => { fetchFiles(); /* eslint-disable-next-line */ }, [ticketID]);

  const upload = async (e) => {
    e.preventDefault();
    if (!picked) return;
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('file', picked);
    fd.append('ticketID', ticketID);
    fd.append('userID', userID);
    try {
      const res = await axios.post(API, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setPicked(null);
        if (inputRef.current) inputRef.current.value = '';
        fetchFiles();
        if (onChange) onChange();
      } else {
        setError(res.data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
    }
    setBusy(false);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.label}>📎 Attachments</div>

      {files.length === 0 ? (
        <p style={styles.empty}>No files attached.</p>
      ) : (
        <ul style={styles.list}>
          {files.map(f => (
            <li key={f.ID} style={styles.item}>
              <a href={`${API}?download=${f.ID}`} target="_blank" rel="noreferrer" style={styles.fileLink}>
                {f.FileName}
              </a>
              <span style={styles.fileMeta}>
                {prettySize(f.FileSize)}{f.UploaderName ? ` · ${f.UploaderName}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={upload} style={styles.form}>
        <input
          ref={inputRef}
          type="file"
          onChange={e => setPicked(e.target.files[0] || null)}
          style={styles.fileInput}
        />
        <button type="submit" disabled={!picked || busy} style={{ ...styles.btn, opacity: (!picked || busy) ? 0.5 : 1 }}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  wrap:      { marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px' },
  label:     { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
  empty:     { color: '#9ca3af', fontSize: '12px', margin: '0 0 8px' },
  list:      { listStyle: 'none', padding: 0, margin: '0 0 10px' },
  item:      { display: 'flex', alignItems: 'baseline', gap: '8px', padding: '4px 0', flexWrap: 'wrap' },
  fileLink:  { color: '#0369a1', fontSize: '13px', textDecoration: 'none', fontWeight: '500', wordBreak: 'break-all' },
  fileMeta:  { color: '#9ca3af', fontSize: '11px' },
  form:      { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  fileInput: { fontSize: '12px', flex: 1, minWidth: '160px' },
  btn:       { padding: '5px 14px', backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  error:     { color: '#ef4444', fontSize: '12px', margin: '6px 0 0' },
};

export default Attachments;

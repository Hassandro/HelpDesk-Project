import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API = 'http://localhost/api/knowledgebase.php';

// Searchable list of published knowledge base articles (closed tickets shared
// as solutions). Manager/Admin can remove an article from the list.
function KnowledgeBase({ role }) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const canManage = role === 'manager' || role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['kb', search],
    queryFn: async () => {
      const res = await axios.get(`${API}?search=${encodeURIComponent(search)}`);
      return res.data.success ? res.data.articles : [];
    },
  });

  const articles = data || [];

  const remove = useMutation({
    mutationFn: (ticketID) => axios.delete(API, { data: { ticketID } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kb'] }),
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search the knowledge base..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={styles.search}
      />

      {isLoading ? (
        <p style={styles.empty}>Loading...</p>
      ) : articles.length === 0 ? (
        <p style={styles.empty}>{search ? 'No articles match your search.' : 'No articles published yet.'}</p>
      ) : (
        articles.map(a => (
          <div key={a.ID} style={styles.card}>
            <div style={styles.cardHeader}>
              <h4 style={styles.title}>{a.Title}</h4>
              {a.CategoryName && <span style={styles.categoryBadge}>{a.CategoryName}</span>}
            </div>

            {a.Problem && (
              <>
                <p style={styles.label}>Problem</p>
                <p style={styles.text}>{a.Problem}</p>
              </>
            )}

            <p style={styles.label}>Solution</p>
            <p style={styles.text}>{a.Solution}</p>

            <div style={styles.footer}>
              <span style={styles.meta}>
                {a.PublishedByName ? `Published by ${a.PublishedByName} · ` : ''}
                {new Date(a.PublishedAt).toLocaleDateString()}
              </span>
              {canManage && (
                <button onClick={() => remove.mutate(a.TicketID)} style={styles.removeBtn}>Remove</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  search:        { width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', marginBottom: '20px' },
  empty:         { color: '#9ca3af', fontSize: '14px', marginTop: '24px' },
  card:          { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '14px' },
  cardHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' },
  title:         { margin: 0, fontSize: '16px' },
  categoryBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', backgroundColor: '#e0e7ff', color: '#3730a3', whiteSpace: 'nowrap' },
  label:         { margin: '10px 0 2px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em' },
  text:          { margin: 0, fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap' },
  footer:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' },
  meta:          { fontSize: '12px', color: '#9ca3af' },
  removeBtn:     { padding: '5px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
};

export default KnowledgeBase;

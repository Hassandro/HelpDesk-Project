import React from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API = 'http://localhost/api/stats.php';

const STATUS_COLORS   = { open: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280', failed: '#ef4444' };
const PRIORITY_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Urgent: '#7c3aed' };
const CATEGORY_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#ec4899', '#6b7280'];

function AnalyticsPanel({ userID, role }) {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', userID, role],
    queryFn: async () => {
      const res = await axios.get(`${API}?userID=${userID}&role=${role}`);
      return res.data.success ? res.data : null;
    },
  });

  if (isLoading) return <p style={styles.empty}>Loading analytics...</p>;
  if (!data) return <p style={styles.empty}>Unable to load analytics.</p>;

  const { kpis, statusBreakdown, categoryBreakdown, priorityBreakdown, ticketsOverTime, agentWorkload, userStats } = data;
  const isAdmin = role === 'admin' || role === 'manager';

  return (
    <div>
      <div style={styles.kpiRow}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...styles.statCard, borderColor: k.color }}>
            <span style={{ ...styles.statNum, color: k.color }}>{k.value}</span>
            <span style={styles.statLabel}>{k.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.chartGrid}>
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Tickets by Status</h4>
          {statusBreakdown.length === 0 ? <p style={styles.empty}>No data</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusBreakdown.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Tickets by Priority</h4>
          {priorityBreakdown.length === 0 ? <p style={styles.empty}>No data</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {priorityBreakdown.map(entry => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Tickets by Category</h4>
          {categoryBreakdown.length === 0 ? <p style={styles.empty}>No data</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Tickets Over Time (30 days)</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ticketsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {agentWorkload && agentWorkload.length > 0 && (
          <div style={{ ...styles.chartCard, gridColumn: '1 / -1' }}>
            <h4 style={styles.chartTitle}>Agent Workload (open + in progress)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={agentWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {isAdmin && userStats && userStats.length > 0 && (
        <div style={styles.userStatsSection}>
          <h3 style={styles.sectionTitle}>Per-User Breakdown</h3>

          {['it_agent', 'employee'].map(r => {
            const group = userStats.filter(u => u.role === r);
            if (!group.length) return null;
            return (
              <div key={r} style={{ marginBottom: '24px' }}>
                <h4 style={styles.groupTitle}>{r === 'it_agent' ? 'IT Agents' : 'Employees'}</h4>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {['Name', 'Total', 'Open', 'In Progress', 'Resolved', 'Closed', 'Hours Logged'].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((u, i) => (
                        <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{u.name}</td>
                          <td style={{ ...styles.td, ...styles.tdCenter }}>{u.total}</td>
                          <td style={{ ...styles.td, ...styles.tdCenter, color: '#3b82f6' }}>{u.open}</td>
                          <td style={{ ...styles.td, ...styles.tdCenter, color: '#f59e0b' }}>{u.in_progress}</td>
                          <td style={{ ...styles.td, ...styles.tdCenter, color: '#10b981' }}>{u.resolved}</td>
                          <td style={{ ...styles.td, ...styles.tdCenter, color: '#6b7280' }}>{u.closed}</td>
                          <td style={{ ...styles.td, ...styles.tdCenter, color: '#0ea5e9' }}>{u.hoursLogged}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  kpiRow:     { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  statCard:   { flex: '1 1 140px', border: '2px solid', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNum:    { fontSize: '28px', fontWeight: 'bold' },
  statLabel:  { fontSize: '13px', color: '#6b7280', marginTop: '4px', textAlign: 'center' },
  chartGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  chartCard:  { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' },
  chartTitle: { margin: '0 0 8px', fontSize: '14px', color: '#374151' },
  empty:           { color: '#9ca3af', fontSize: '13px' },
  userStatsSection:{ marginTop: '32px' },
  sectionTitle:    { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' },
  groupTitle:      { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
  tableWrap:       { overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' },
  table:           { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th:              { padding: '10px 14px', textAlign: 'left', backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' },
  td:              { padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#374151' },
  tdCenter:        { textAlign: 'center' },
};

export default AnalyticsPanel;

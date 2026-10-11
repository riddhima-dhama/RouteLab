import React, { useState } from 'react';
import { Search, Trash2, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportCSV.js';

export default function EventLog({ logs = [], onClear }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.type.toLowerCase().includes(search.toLowerCase()) ||
      log.asPair.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'ALL' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    exportToCSV(`bgp_event_logs_${Date.now()}`, filteredLogs);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>BGP Telemetry & System Event Journal</span>
          <span className="badge badge-cyan">{filteredLogs.length} Events</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExport} className="btn btn-sm btn-outline" title="Export CSV">
            <Download size={14} /> Export CSV
          </button>
          {onClear && (
            <button onClick={onClear} className="btn btn-sm btn-outline" title="Clear Logs">
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', top: '10px' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, ASN, BGP message..."
            className="input-field"
            style={{ width: '100%', paddingLeft: '34px' }}
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="select-field"
        >
          <option value="ALL">All Event Types</option>
          <option value="BGP_UPDATE">BGP Announcements</option>
          <option value="BGP_WITHDRAW">BGP Withdrawals</option>
          <option value="ROUTE_SELECTED">Route Selections</option>
          <option value="POLICY_CHANGE">Policy Modifications</option>
          <option value="SYSTEM_RESET">System Resets</option>
        </select>
      </div>

      {/* Event Stream List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '400px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {filteredLogs.map((log) => {
          let badgeClass = 'badge-cyan';
          if (log.severity === 'error') badgeClass = 'badge-red';
          else if (log.severity === 'success') badgeClass = 'badge-green';
          else if (log.severity === 'warning') badgeClass = 'badge-amber';
          else if (log.type === 'POLICY_CHANGE') badgeClass = 'badge-purple';

          return (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: '60px' }}>
                  {log.time}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '0.62rem' }}>
                      {log.type}
                    </span>
                    <span className="text-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.78rem' }}>
                      {log.asPair}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{log.description}</div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No events match current filter.
          </div>
        )}
      </div>
    </div>
  );
}

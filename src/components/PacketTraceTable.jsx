import React from 'react';
import { Download, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { exportToCSV } from '../utils/exportCSV.js';

export default function PacketTraceTable({ steps = [], currentActiveHop = null, packetId = 1 }) {
  const handleExport = () => {
    if (!steps || steps.length === 0) return;
    const formatted = steps.map((s) => ({
      Hop: s.hopIndex,
      Router: s.routerId,
      AutonomousSystem: s.asId,
      IPAddress: s.ip,
      TTL_Remaining: s.ttlRemaining,
      CumulativeDelay_ms: s.delayMs,
      Action: s.action,
      Status: s.status,
      Notes: s.notes,
    }));
    exportToCSV(`packet_trace_pkt${packetId}_${Date.now()}`, formatted);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>Live Packet Forwarding Trace Table</span>
          {steps.length > 0 && (
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              {steps.length} Hops Traversed
            </span>
          )}
        </div>
        <button
          onClick={handleExport}
          className="btn btn-sm btn-outline"
          disabled={!steps || steps.length === 0}
          title="Download trace table as CSV"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hop #</th>
              <th>Router</th>
              <th>Autonomous System</th>
              <th>IP Address</th>
              <th>TTL Remaining</th>
              <th>Cumulative Delay</th>
              <th>Forwarding Action</th>
              <th>Status</th>
              <th>Forwarding Notes</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, idx) => {
              const isCurrent = currentActiveHop !== null && step.hopIndex === currentActiveHop;
              const isDrop = step.status === 'DROP';
              const isSuccess = step.status === 'SUCCESS';

              return (
                <tr
                  key={idx}
                  className={isCurrent ? 'active-row' : ''}
                  style={{
                    backgroundColor: isCurrent ? 'rgba(56, 189, 248, 0.12)' : undefined,
                  }}
                >
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    Hop {step.hopIndex}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-cyan">{step.routerId}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {step.asId}
                    </span>
                  </td>
                  <td className="text-mono" style={{ fontSize: '0.8rem' }}>
                    {step.ip}
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: step.ttlRemaining <= 1 ? '#ef4444' : '#f8fafc',
                      }}
                    >
                      {step.ttlRemaining}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {step.delayMs} ms
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                      {step.action}
                    </span>
                  </td>
                  <td>
                    {isSuccess && (
                      <span className="badge badge-green">
                        <CheckCircle size={11} /> DELIVERED
                      </span>
                    )}
                    {isDrop && (
                      <span className="badge badge-red">
                        <XCircle size={11} /> DROPPED
                      </span>
                    )}
                    {!isSuccess && !isDrop && (
                      <span className="badge badge-cyan">
                        <ArrowRight size={11} /> FORWARDED
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {step.notes}
                  </td>
                </tr>
              );
            })}

            {steps.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  No packet trace available. Configure simulation parameters and click "Start Simulation".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

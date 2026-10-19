import React from 'react';
import { Download, CheckCircle, XCircle, ArrowRight, Clock, AlertOctagon } from 'lucide-react';
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
                    {step.status === 'CREATED' && (
                      <span className="badge badge-cyan" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowRight size={11} /> CREATED
                      </span>
                    )}
                    {step.status === 'FORWARDED' && (
                      <span className="badge badge-cyan" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowRight size={11} /> FORWARDED
                      </span>
                    )}
                    {(step.status === 'DELIVERED' || step.status === 'SUCCESS') && (
                      <span className="badge badge-green" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={11} /> DELIVERED
                      </span>
                    )}
                    {(step.status === 'DROPPED' || step.status === 'DROP') && (
                      <span className="badge badge-red" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={11} /> DROPPED
                      </span>
                    )}
                    {step.status === 'TTL_EXPIRED' && (
                      <span className="badge badge-amber" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> TTL EXPIRED
                      </span>
                    )}
                    {(step.status === 'DEST_UNREACHABLE' || step.status === 'UNREACHABLE') && (
                      <span className="badge badge-red" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertOctagon size={11} /> UNREACHABLE
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

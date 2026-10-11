import React from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { formatBandwidth } from '../utils/calculations.js';

export default function RouteComparison({ bgpResult }) {
  if (!bgpResult) {
    return <div className="card">No routing evaluation available.</div>;
  }

  const { bestRoute, validRoutes, rejectedRoutes, decisionBreakdown } = bgpResult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Best Selected BGP Route Card */}
      {bestRoute ? (
        <div
          className="card"
          style={{
            borderColor: 'var(--accent-cyan)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
            background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.08) 0%, var(--bg-surface) 100%)',
          }}
        >
          <div className="card-header">
            <div className="card-title">
              <CheckCircle2 color="var(--accent-cyan)" size={20} />
              <span>Installed Best BGP Path (Loc-RIB)</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-cyan">WINNER</span>
              <span className="badge badge-green">STATUS: ACTIVE</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* AS Path Sequence Visualization */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                AS-PATH:
              </span>
              {bestRoute.asPath.map((asn, idx) => (
                <React.Fragment key={asn + idx}>
                  <div
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: idx === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid var(--accent-cyan)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {asn}
                  </div>
                  {idx < bestRoute.asPath.length - 1 && (
                    <ArrowRight size={16} color="var(--accent-cyan)" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Path Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
              }}
            >
              <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AS-PATH LENGTH</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {bestRoute.asPathLength} hops
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LEARNED VIA</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', textTransform: 'capitalize' }}>
                  {bestRoute.learnedVia}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LOCAL PREFERENCE</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  {bestRoute.localPref}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL LATENCY</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {bestRoute.totalLatencyMs} ms
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BOTTLENECK BW</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  {formatBandwidth(bestRoute.bottleneckBandwidthMbps)}
                </div>
              </div>
            </div>

            {/* Router Hop Sequence */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Forwarding Router Path:{' '}
              <span className="text-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {bestRoute.routerPath.join(' ➔ ')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ borderColor: 'var(--accent-crimson)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
            <XCircle size={22} />
            <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>No Usable BGP Route Found</span>
          </div>
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            All candidate paths from {bgpResult.sourceAsId} to {bgpResult.destAsId} are either partitioned by link failure or filtered out by policy.
          </p>
        </div>
      )}

      {/* 2. Step-by-Step Policy Decision Breakdown */}
      {decisionBreakdown && decisionBreakdown.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck color="var(--accent-cyan)" size={18} />
              <span>BGP Tie-Breaking & Decision Engine Walkthrough</span>
            </div>
            <span className="badge badge-cyan">RFC 4271 COMPLIANT</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {decisionBreakdown.map((item) => (
              <div
                key={item.step}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderLeft: `3px solid ${
                    item.status === 'DETERMINANT'
                      ? 'var(--accent-cyan)'
                      : item.status === 'PASSED'
                      ? 'var(--accent-emerald)'
                      : 'var(--accent-amber)'
                  }`,
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc' }}>
                      {item.rule}
                    </span>
                    <span
                      className={`badge ${
                        item.status === 'DETERMINANT'
                          ? 'badge-cyan'
                          : item.status === 'PASSED'
                          ? 'badge-green'
                          : 'badge-amber'
                      }`}
                      style={{ fontSize: '0.62rem' }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {item.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. All Discovered Valid Routes Comparison Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers color="var(--accent-cyan)" size={18} />
            <span>Candidate Route Comparison Table</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {validRoutes.length} valid route(s) evaluated
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Candidate AS-PATH</th>
                <th>Router Path</th>
                <th>Learned Via</th>
                <th>Local-Pref</th>
                <th>Hops</th>
                <th>Latency</th>
                <th>Bottleneck BW</th>
              </tr>
            </thead>
            <tbody>
              {validRoutes.map((route) => (
                <tr key={route.id} className={route.isBest ? 'active-row' : ''}>
                  <td>
                    {route.isBest ? (
                      <span className="badge badge-green">BEST</span>
                    ) : (
                      <span className="badge badge-amber">BACKUP</span>
                    )}
                  </td>
                  <td>
                    <span className="text-mono" style={{ fontWeight: 600, color: route.isBest ? 'var(--accent-cyan)' : '#f8fafc' }}>
                      {route.asPath.join(' → ')}
                    </span>
                  </td>
                  <td>
                    <span className="text-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {route.routerPath.join(' ➔ ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                      {route.learnedVia}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{route.localPref}</td>
                  <td>{route.asPathLength}</td>
                  <td>{route.totalLatencyMs} ms</td>
                  <td>{formatBandwidth(route.bottleneckBandwidthMbps)}</td>
                </tr>
              ))}
              {validRoutes.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No valid routes discovered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Rejected Routes & BGP Policy Filters */}
      {rejectedRoutes.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <XCircle color="var(--accent-crimson)" size={18} />
              <span>Rejected Candidate Paths & Policy Filters</span>
            </div>
            <span className="badge badge-red">{rejectedRoutes.length} REJECTED</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rejectedRoutes.map((rej, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <div>
                  <div className="text-mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5' }}>
                    {rej.asPath.join(' → ')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {rej.reason}
                  </div>
                </div>
                <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>
                  {rej.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

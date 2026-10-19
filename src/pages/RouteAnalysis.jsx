import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import { verifyAsPathLoop } from '../engine/policyEngine.js';
import { GitFork, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export default function RouteAnalysis() {
  const { bgpResult, sourceAs, destAs } = useNetwork();

  // Interactive Loop Prevention state
  const [testAsPath, setTestAsPath] = useState('65001, 65003, 65005, 65001');
  const [testReceivingAsn, setTestReceivingAsn] = useState('65001');
  const [loopResult, setLoopResult] = useState(null);

  const handleTestLoop = (e) => {
    e.preventDefault();
    const asPathArray = testAsPath
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));
    const result = verifyAsPathLoop(asPathArray, Number(testReceivingAsn));
    setLoopResult(result);
  };

  const validRoutes = bgpResult?.validRoutes || [];
  const rejectedRoutes = bgpResult?.rejectedRoutes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitFork size={18} color="var(--accent-blue)" />
          <h1 style={{ fontSize: '1.05rem', fontWeight: 600 }}>BGP Routing & Policy Decisions</h1>
        </div>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          Path-vector route discovery between {sourceAs} and {destAs}. Demonstrates Gao-Rexford commercial policy preference and AS-path loop prevention.
        </p>
      </div>

      {/* Core Principle Callout */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '3px solid var(--accent-blue)',
          borderTop: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        <ShieldCheck size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#f1f5f9' }}>BGP Route Selection Principle:</strong>{' '}
          BGP route selection depends on routing policy and route attributes, not merely the shortest path. Under standard Gao-Rexford commercial relationships, routes learned from{' '}
          <strong style={{ color: '#38bdf8' }}>Customers</strong> are preferred over{' '}
          <strong style={{ color: '#ec4899' }}>Peers</strong>, which are preferred over{' '}
          <strong style={{ color: '#a855f7' }}>Providers</strong> (<code>Customer &gt; Peer &gt; Provider</code>). AS-path length serves as a tie-breaker only when commercial preferences are equal.
        </div>
      </div>

      {/* Section 2 Table: Candidate Routes & Loc-RIB Decision */}
      <div className="card" style={{ padding: '14px' }}>
        <div className="card-header" style={{ marginBottom: '10px', paddingBottom: '8px' }}>
          <div className="card-title" style={{ fontSize: '0.88rem' }}>
            Available Routes & Selection Status ({sourceAs} → {destAs})
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {validRoutes.length} candidate path(s) evaluated
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '22%' }}>AS Path</th>
                <th style={{ width: '12%' }}>Neighbor AS</th>
                <th style={{ width: '15%' }}>Relationship</th>
                <th style={{ width: '10%' }}>AS Hops</th>
                <th style={{ width: '10%' }}>Local-Pref</th>
                <th style={{ width: '19%' }}>Selection Rationale</th>
              </tr>
            </thead>
            <tbody>
              {validRoutes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#f87171', padding: '16px' }}>
                    No viable BGP routes found. Destination is currently unreachable.
                  </td>
                </tr>
              ) : (
                validRoutes.map((route) => {
                  const isWinner = route.isBest;
                  return (
                    <tr
                      key={route.id}
                      className={isWinner ? 'active-row' : ''}
                      style={{ backgroundColor: isWinner ? 'rgba(37, 99, 235, 0.08)' : undefined }}
                    >
                      <td>
                        <span
                          className={`badge ${isWinner ? 'badge-green' : 'badge-amber'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {isWinner ? 'SELECTED (BEST)' : 'ALTERNATIVE'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: isWinner ? 600 : 400 }}>
                        {route.asPath.join(' → ')}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {route.nextHopAs || route.asPath[1] || 'Direct'}
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>
                          {route.learnedVia} route
                        </span>
                      </td>
                      <td>{route.asPathLength - 1}</td>
                      <td>{route.localPref}</td>
                      <td style={{ fontSize: '0.78rem', color: isWinner ? '#f1f5f9' : 'var(--text-muted)' }}>
                        {isWinner
                          ? `Selected via Gao-Rexford rule: learned from ${route.learnedVia} with Local-Pref ${route.localPref}. Generates transit revenue, overriding other paths.`
                          : `Valid backup route. Held in standby with Local-Pref ${route.localPref}.`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loop Prevention & Rejected Routes Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
        {/* Rejected Routes List */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px', paddingBottom: '8px' }}>
            <div className="card-title" style={{ fontSize: '0.88rem' }}>
              <span>Loop Prevention & Filtered Paths</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Path</th>
                  <th>Filter Rule</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {rejectedRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                      No routes rejected by import filter for current session.
                    </td>
                  </tr>
                ) : (
                  rejectedRoutes.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                        {r.asPath?.join(' → ') || r.id}
                      </td>
                      <td>
                        <span className="badge badge-red">{r.filterType || 'RFC 4271'}</span>
                      </td>
                      <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {r.reason || 'Rejected by policy or link down'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive AS-Path Loop Tester (RFC 4271) */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px', paddingBottom: '8px' }}>
            <div className="card-title" style={{ fontSize: '0.88rem' }}>
              <span>AS-Path Loop Tester (RFC 4271)</span>
            </div>
          </div>

          <form onSubmit={handleTestLoop} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Advertised AS-Path Sequence:
              </label>
              <input
                type="text"
                value={testAsPath}
                onChange={(e) => setTestAsPath(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.78rem' }}
                placeholder="65001, 65003, 65005, 65001"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Receiving Router ASN:
              </label>
              <input
                type="number"
                value={testReceivingAsn}
                onChange={(e) => setTestReceivingAsn(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.78rem' }}
                placeholder="65001"
              />
            </div>

            <button type="submit" className="btn btn-sm btn-primary" style={{ marginTop: '4px' }}>
              Verify AS-Path Loop
            </button>
          </form>

          {loopResult && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: loopResult.hasLoop ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${loopResult.hasLoop ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                fontSize: '0.76rem',
                color: loopResult.hasLoop ? '#fca5a5' : '#a7f3d0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                {loopResult.hasLoop ? <XCircle size={14} color="#ef4444" /> : <CheckCircle2 size={14} color="#10b981" />}
                <span>{loopResult.hasLoop ? 'ROUTE REJECTED (LOOP DETECTED)' : 'ROUTE ACCEPTED'}</span>
              </div>
              <p style={{ marginTop: '2px', lineHeight: 1.35 }}>
                {loopResult.hasLoop
                  ? `ASN ${loopResult.receivingAsn} is already present in the received AS-Path. The eBGP router drops this announcement to prevent routing loops.`
                  : `ASN ${loopResult.receivingAsn} is not in the AS-Path. Safe to install into Adj-RIB-In.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

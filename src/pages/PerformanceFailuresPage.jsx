import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import MetricCard from '../components/MetricCard.jsx';
import {
  computeRoutePerformance,
  compareRoutingCandidates,
} from '../engine/performanceAnalyzer.js';
import { formatBandwidth } from '../utils/calculations.js';
import { exportToCSV } from '../utils/exportCSV.js';
import {
  Activity,
  AlertOctagon,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Download,
  Gauge,
  Zap,
  Timer,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function PerformanceFailuresPage() {
  const {
    links,
    bgpResult,
    previousRoute,
    toggleLinkStatus,
    resetNetworkToDefault,
  } = useNetwork();

  // Selected link for failure simulation in dropdown
  const [selectedLinkId, setSelectedLinkId] = useState(links[0]?.id || 'L-3-5');

  const targetLink = links.find((l) => l.id === selectedLinkId) || links[0];
  const isTargetDown = targetLink?.status === 'FAILED';
  const failedLinks = links.filter((l) => l.status === 'FAILED');
  const hasAnyFailedLink = failedLinks.length > 0;

  const currentBestRoute = bgpResult?.bestRoute;
  const isReachable = Boolean(currentBestRoute);

  // Derive baseline route from previous route or fallback default
  const baselineRoute = previousRoute || {
    asPath: ['AS1', 'AS3', 'AS5', 'AS4'],
    routerPath: ['R1', 'R4', 'R5', 'R6'],
    asPathLength: 4,
    totalLatencyMs: 36,
    bottleneckBandwidthMbps: 1000,
    learnedVia: 'provider',
    localPref: 220,
  };

  // Performance metrics for current active route
  const metrics = computeRoutePerformance(currentBestRoute);
  const candidates = compareRoutingCandidates(bgpResult?.validRoutes || []);

  // Export metrics to CSV
  const handleExportCSV = () => {
    const exportRows = candidates.length > 0
      ? candidates.map((c) => ({
          Candidate: c.category,
          AS_Path: c.asPathStr,
          AS_Hops: c.hops,
          Bandwidth_Mbps: c.bandwidthMbps,
          Throughput_Mbps: c.throughputMbps,
          Delay_ms: c.delayMs,
          Latency_ms: c.latencyMs,
          Status: c.isWinner ? 'Active Best Route' : 'Alternative / Bypassed',
          Decision_Reason: c.decisionReason,
        }))
      : [
          {
            Candidate: 'Current State',
            AS_Path: currentBestRoute ? currentBestRoute.asPath.join(' -> ') : 'None',
            Bandwidth_Mbps: metrics.bandwidthMbps,
            Throughput_Mbps: metrics.throughputMbps,
            Delay_ms: metrics.delayMs,
            Latency_ms: metrics.latencyMs,
            Status: isReachable ? 'Reachable' : 'Unreachable',
            Decision_Reason: isReachable ? 'Operational' : 'All viable paths severed',
          },
        ];

    exportToCSV(`routelab_performance_metrics_${Date.now()}`, exportRows);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Toolbar */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-blue)" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Performance & Failure Analysis
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px', margin: 0 }}>
              Simulate physical link outages, inspect dynamic BGP convergence, and analyze quantitative telemetry.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleExportCSV}
              className="btn btn-sm btn-outline"
              title="Download telemetry metrics as CSV"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Link Failure Simulation Controller */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="var(--accent-amber)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Target Link:
              </span>
            </div>

            <select
              value={selectedLinkId}
              onChange={(e) => setSelectedLinkId(e.target.value)}
              className="select-field"
              style={{ fontSize: '0.8rem', padding: '5px 10px', minWidth: '180px' }}
            >
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} ({l.fromAs} ↔ {l.toAs}) [{l.status}]
                </option>
              ))}
            </select>

            <button
              onClick={() => toggleLinkStatus(selectedLinkId)}
              className={`btn btn-sm ${isTargetDown ? 'btn-primary' : 'btn-danger'}`}
              style={{ fontWeight: 600 }}
            >
              <AlertOctagon size={13} />
              <span>{isTargetDown ? `Restore Link ${selectedLinkId}` : `Fail Link ${selectedLinkId}`}</span>
            </button>

            <button
              onClick={resetNetworkToDefault}
              className="btn btn-sm btn-outline"
              title="Restore all links to healthy default state"
            >
              <RotateCcw size={13} />
              <span>Reset All Links</span>
            </button>
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Failed links in topology:{' '}
            <span style={{ fontWeight: 600, color: hasAnyFailedLink ? '#ef4444' : '#10b981' }}>
              {failedLinks.length === 0 ? 'None (All Links Up)' : failedLinks.map((l) => l.id).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Failover Summary Box */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          backgroundColor: !hasAnyFailedLink
            ? 'var(--bg-secondary)'
            : isReachable
            ? 'rgba(37, 99, 235, 0.06)'
            : 'rgba(239, 68, 68, 0.06)',
          borderColor: !hasAnyFailedLink
            ? 'var(--border-subtle)'
            : isReachable
            ? 'var(--accent-blue)'
            : 'var(--accent-crimson)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '10px',
          }}
        >
          {/* Previous Route */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              PREVIOUS ROUTE
            </div>
            <div className="text-mono" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>
              {baselineRoute.asPath.join(' → ')}
            </div>
          </div>

          {/* Failed Link */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              FAILED LINK(S)
            </div>
            <div
              className="text-mono"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: hasAnyFailedLink ? '#ef4444' : '#10b981',
              }}
            >
              {hasAnyFailedLink ? failedLinks.map((l) => l.id).join(', ') : 'None (Healthy)'}
            </div>
          </div>

          {/* New Active Route */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              CONVERGED ROUTE
            </div>
            <div
              className="text-mono"
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: isReachable ? '#2563eb' : '#ef4444',
              }}
            >
              {isReachable ? currentBestRoute.asPath.join(' → ') : 'No Alternative Route'}
            </div>
          </div>

          {/* Reachability Status */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              DESTINATION REACHABILITY
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isReachable ? (
                <>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                    REACHABLE
                  </span>
                </>
              ) : (
                <>
                  <XCircle size={16} color="#ef4444" />
                  <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>
                    UNREACHABLE (PARTITIONED)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Explanation text */}
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '8px',
            lineHeight: 1.4,
          }}
        >
          {!hasAnyFailedLink ? (
            <span>
              Network is operating in baseline state. Primary path <strong>{baselineRoute.asPath.join(' → ')}</strong> is installed in the Routing Information Base (Loc-RIB).
            </span>
          ) : isReachable ? (
            <span>
              Interface failure detected on <strong>{failedLinks.map((l) => l.id).join(', ')}</strong>. BGP WITHDRAWAL message was propagated to peer routers, removing the primary route from Loc-RIB. Router re-evaluated candidate paths and converged to backup path <strong>{currentBestRoute.asPath.join(' → ')}</strong>.
            </span>
          ) : (
            <span style={{ color: '#ef4444' }}>
              All viable paths to destination prefix have suffered link failure or policy rejection. Loc-RIB contains no valid route. Packets will be discarded with ICMP Destination Network Unreachable.
            </span>
          )}
        </div>
      </div>

      {/* 4 Essential Performance Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        <MetricCard
          title="Bandwidth"
          value={isReachable ? formatBandwidth(metrics.bandwidthMbps) : '0 Mbps'}
          subtext="Bottleneck link capacity along path"
          icon={Gauge}
        />

        <MetricCard
          title="Throughput"
          value={isReachable ? formatBandwidth(metrics.throughputMbps) : '0 Mbps'}
          subtext="Effective data transmission rate"
          icon={Zap}
        />

        <MetricCard
          title="Delay"
          value={isReachable ? `${metrics.delayMs} ms` : '—'}
          subtext="Total end-to-end delay (propagation + queuing)"
          icon={Timer}
        />

        <MetricCard
          title="Latency"
          value={isReachable ? `${metrics.latencyMs} ms` : '—'}
          subtext="Physical link propagation time"
          icon={Clock}
        />
      </div>

      {/* Network Topology Visualization */}
      <div className="card" style={{ padding: '12px' }}>
        <div
          style={{
            padding: '4px 8px 10px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
            Topology Failure View (Failed links shown in dashed red)
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Drag nodes or canvas to reposition
          </span>
        </div>
        <NetworkTopology height="360px" allowEdit={false} />
      </div>

      {/* Candidate Route Performance Comparison Table */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div className="card-header" style={{ marginBottom: '10px' }}>
          <div className="card-title">
            <span>Candidate Route Telemetry Comparison</span>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Comparing candidate paths across the 4 key networking metrics
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate Type</th>
                <th>AS-Path</th>
                <th>AS Hops</th>
                <th>Bandwidth</th>
                <th>Throughput</th>
                <th>Delay</th>
                <th>Latency</th>
                <th>Decision Rationale</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand, idx) => (
                <tr key={idx} className={cand.isWinner ? 'active-row' : ''}>
                  <td style={{ fontWeight: 600 }}>
                    <span className={`badge ${cand.isWinner ? 'badge-green' : 'badge-cyan'}`}>
                      {cand.tag}
                    </span>
                  </td>
                  <td className="text-mono" style={{ fontWeight: 600 }}>
                    {cand.asPathStr}
                  </td>
                  <td>{cand.hops}</td>
                  <td style={{ fontWeight: 600 }}>{formatBandwidth(cand.bandwidthMbps)}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>
                    {formatBandwidth(cand.throughputMbps)}
                  </td>
                  <td style={{ color: '#2563eb', fontWeight: 700 }}>{cand.delayMs} ms</td>
                  <td style={{ color: '#818cf8' }}>{cand.latencyMs} ms</td>
                  <td style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                    {cand.decisionReason}
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No viable candidate routes available for current topology state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

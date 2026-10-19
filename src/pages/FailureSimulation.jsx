import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import {
  AlertOctagon,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Radio,
  Clock,
  Layers,
} from 'lucide-react';

export default function FailureSimulation() {
  const {
    links,
    bgpResult,
    previousRoute,
    toggleLinkStatus,
    resetNetworkToDefault,
    logs,
  } = useNetwork();

  // Selected link for failure simulation in dropdown
  const [selectedLinkId, setSelectedLinkId] = useState('L-3-5');

  const targetLink = links.find((l) => l.id === selectedLinkId) || links[0];
  const isTargetDown = targetLink?.status === 'FAILED';
  const failedLinks = links.filter((l) => l.status === 'FAILED');
  const hasAnyFailedLink = failedLinks.length > 0;

  const currentBestRoute = bgpResult?.bestRoute;

  // Use recorded previous route or derive baseline
  const baselineRoute = previousRoute || {
    asPath: ['AS1', 'AS3', 'AS5', 'AS4'],
    routerPath: ['R1', 'R4', 'R5', 'R6'],
    asPathLength: 4,
    totalLatencyMs: 36,
    bottleneckBandwidthMbps: 1000,
    learnedVia: 'provider',
    localPref: 220,
  };

  // Explanation generator
  const getExplanation = () => {
    if (!hasAnyFailedLink) {
      return {
        title: 'Network Operating in Primary Baseline State',
        detail:
          'All inter-domain and intra-domain links are ACTIVE. Primary path [AS1 → AS3 → AS5 → AS4] is selected based on highest Local Preference (220) and commercial policy.',
        status: 'NORMAL',
      };
    }

    if (currentBestRoute) {
      return {
        title: `Dynamic Failover Complete: Rerouted to [${currentBestRoute.asPath.join(' → ')}]`,
        detail: `Interface failure detected on ${failedLinks.map((l) => l.id).join(', ')}. BGP WITHDRAWAL message propagated to peer routers. Primary route was removed from Loc-RIB. Router evaluated candidate backup paths and installed alternative route [${currentBestRoute.asPath.join(
          ' → '
        )}] with Local-Pref = ${currentBestRoute.localPref}.`,
        status: 'REROUTED',
      };
    }

    return {
      title: 'Destination Unreachable (Network Partitioned)',
      detail:
        'All viable candidate paths to the destination have suffered link failure or violate commercial policy. No alternative BGP route exists in Loc-RIB. Packets will be dropped with ICMP Type 3 Code 0 (Destination Network Unreachable).',
      status: 'UNREACHABLE',
    };
  };

  const explanation = getExplanation();

  // Find recent withdrawal logs
  const withdrawalLogs = logs.filter(
    (l) => l.type === 'BGP_WITHDRAW' || l.type === 'BGP_UPDATE'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header Toolbar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--accent-amber)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Dynamic Routing, Link Failure & BGP Policy Failover
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Sever any inter-domain link to observe BGP route withdrawal, dynamic policy re-evaluation, and traffic failover.
            </p>
          </div>

          {/* Link Trigger Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>SELECT LINK:</span>
              <select
                value={selectedLinkId}
                onChange={(e) => setSelectedLinkId(e.target.value)}
                className="select-field"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
              >
                {links.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} ({l.fromAs} ↔ {l.toAs}) [{l.status}]
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => toggleLinkStatus(selectedLinkId)}
              className={`btn btn-sm ${isTargetDown ? 'btn-danger' : 'btn-primary'}`}
              style={{ fontWeight: 600 }}
            >
              <AlertOctagon size={14} />
              <span>{isTargetDown ? `Restore Link ${selectedLinkId}` : `Sever Link ${selectedLinkId}`}</span>
            </button>

            <button
              onClick={resetNetworkToDefault}
              className="btn btn-sm btn-outline"
              title="Reset topology to baseline state"
            >
              <RotateCcw size={14} />
              <span>Reset State</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Explanation Callout */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          backgroundColor:
            explanation.status === 'NORMAL'
              ? 'rgba(56, 189, 248, 0.08)'
              : explanation.status === 'REROUTED'
              ? 'rgba(245, 158, 11, 0.08)'
              : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${
            explanation.status === 'NORMAL'
              ? 'rgba(56, 189, 248, 0.3)'
              : explanation.status === 'REROUTED'
              ? 'rgba(245, 158, 11, 0.3)'
              : 'rgba(239, 68, 68, 0.3)'
          }`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          {explanation.status === 'NORMAL' && <CheckCircle2 color="var(--accent-cyan)" size={18} />}
          {explanation.status === 'REROUTED' && <Radio color="var(--accent-amber)" size={18} />}
          {explanation.status === 'UNREACHABLE' && <XCircle color="var(--accent-crimson)" size={18} />}
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
            {explanation.title}
          </span>
          <span
            className={`badge ${
              explanation.status === 'NORMAL'
                ? 'badge-cyan'
                : explanation.status === 'REROUTED'
                ? 'badge-amber'
                : 'badge-red'
            }`}
            style={{ fontSize: '0.65rem' }}
          >
            {explanation.status}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {explanation.detail}
        </div>
      </div>

      {/* Side-by-Side: Before Failure vs After Failure */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Before Failure Card */}
        <div
          className="card"
          style={{
            borderColor: !hasAnyFailedLink ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="card-header">
            <div className="card-title">
              <span style={{ color: 'var(--text-secondary)' }}>Route State: Before Failure</span>
            </div>
            <span className={`badge ${!hasAnyFailedLink ? 'badge-green' : 'badge-amber'}`}>
              {!hasAnyFailedLink ? 'ACTIVE (LOC-RIB)' : 'SUPERSEDED / RECORDED'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AS-PATH:</div>
              <div className="text-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>
                {baselineRoute.asPath.join(' → ')}
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Forwarding Router Path:{' '}
              <span className="text-mono" style={{ color: '#f8fafc', fontWeight: 600 }}>
                {baselineRoute.routerPath.join(' ➔ ')}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>AS Hops:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{baselineRoute.asPathLength - 1}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Path Latency:</span>
                <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{baselineRoute.totalLatencyMs} ms</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Local-Pref:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{baselineRoute.localPref}</div>
              </div>
            </div>
          </div>
        </div>

        {/* After Failure Card */}
        <div
          className="card"
          style={{
            borderColor: hasAnyFailedLink ? (currentBestRoute ? 'var(--accent-cyan)' : 'var(--accent-crimson)') : 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="card-header">
            <div className="card-title">
              <span style={{ color: 'var(--text-secondary)' }}>Route State: After Link Failure</span>
            </div>
            {currentBestRoute ? (
              <span className="badge badge-green">DYNAMICALLY INSTALLED</span>
            ) : (
              <span className="badge badge-red">UNREACHABLE</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CONVERGED AS-PATH:</div>
              {currentBestRoute ? (
                <div className="text-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981' }}>
                  {currentBestRoute.asPath.join(' → ')}
                </div>
              ) : (
                <div className="text-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ef4444' }}>
                  No Alternative Route Exists
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Forwarding Router Path:{' '}
              <span className="text-mono" style={{ color: currentBestRoute ? '#f8fafc' : '#ef4444', fontWeight: 600 }}>
                {currentBestRoute ? currentBestRoute.routerPath.join(' ➔ ') : 'Forwarding Disrupted'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>AS Hops:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                  {currentBestRoute ? currentBestRoute.asPathLength - 1 : '—'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Path Latency:</span>
                <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {currentBestRoute ? `${currentBestRoute.totalLatencyMs} ms` : '—'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Local-Pref:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                  {currentBestRoute ? currentBestRoute.localPref : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Topology Canvas */}
      <div className="card" style={{ padding: '12px' }}>
        <div style={{ padding: '4px 8px 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
            Live Network Topology (Failed Links Shown in Dashed Red)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Click any link or router to inspect
          </span>
        </div>
        <NetworkTopology height="460px" allowEdit={false} />
      </div>

      {/* BGP Convergence Timeline & Route Withdrawal Events */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
        {/* Convergence Timeline */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={16} color="var(--accent-cyan)" />
              <span>BGP Dynamic Convergence Protocol Sequence</span>
            </div>
            <span className="badge badge-cyan">EVENT-DRIVEN</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem' }}>
              <span className="text-mono" style={{ color: 'var(--text-muted)', width: '55px', flexShrink: 0 }}>T = 0.0s</span>
              <span className="badge badge-red" style={{ fontSize: '0.62rem', flexShrink: 0 }}>LINK DOWN</span>
              <span style={{ color: '#f8fafc' }}>
                Physical carrier detect / BFD reports loss of signal on link {hasAnyFailedLink ? failedLinks[0].id : 'interface'}.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem' }}>
              <span className="text-mono" style={{ color: 'var(--text-muted)', width: '55px', flexShrink: 0 }}>T = 0.3s</span>
              <span className="badge badge-amber" style={{ fontSize: '0.62rem', flexShrink: 0 }}>BGP WITHDRAW</span>
              <span style={{ color: '#f8fafc' }}>
                Border router generates BGP UPDATE message with Withdrawn Routes field containing affected destination prefix.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem' }}>
              <span className="text-mono" style={{ color: 'var(--text-muted)', width: '55px', flexShrink: 0 }}>T = 0.7s</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem', flexShrink: 0 }}>RIB EVALUATION</span>
              <span style={{ color: '#f8fafc' }}>
                BGP speaker removes withdrawn path from Adj-RIB-In and re-evaluates Loc-RIB candidates using Gao-Rexford preferences.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem' }}>
              <span className="text-mono" style={{ color: 'var(--text-muted)', width: '55px', flexShrink: 0 }}>T = 1.1s</span>
              <span className="badge badge-green" style={{ fontSize: '0.62rem', flexShrink: 0 }}>CONVERGED</span>
              <span style={{ color: '#f8fafc' }}>
                {currentBestRoute
                  ? `New best path [${currentBestRoute.asPath.join(' → ')}] installed into FIB. IP forwarding resumes.`
                  : 'No candidate available. FIB entry purged; ICMP destination unreachable enabled.'}
              </span>
            </div>
          </div>
        </div>

        {/* Withdrawal Telemetry Stream */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={16} color="var(--accent-amber)" />
              <span>Route Withdrawal Events</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {withdrawalLogs.slice(0, 4).map((evt) => (
              <div
                key={evt.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderLeft: `3px solid ${evt.severity === 'error' ? '#ef4444' : '#10b981'}`,
                  fontSize: '0.76rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{evt.type}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{evt.time}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{evt.description}</div>
              </div>
            ))}
            {withdrawalLogs.length === 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>
                No withdrawal events recorded yet. Click &quot;Sever Link&quot; above to trigger an event.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

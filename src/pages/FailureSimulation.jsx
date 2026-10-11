import React from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import {
  AlertOctagon,
  RotateCcw,
} from 'lucide-react';

export default function FailureSimulation() {
  const {
    links,
    bgpResult,
    toggleLinkStatus,
    resetNetworkToDefault,
  } = useNetwork();

  const as3As5Link = links.find((l) => l.id === 'L-3-5');
  const isL3Down = as3As5Link?.status === 'FAILED';

  const bestRoute = bgpResult?.bestRoute;

  const beforeBaseline = {
    pathStr: 'AS1 → AS3 → AS5 → AS4',
    asHops: 4,
    routerPath: 'R1 ➔ R4 ➔ R5 ➔ R6',
    latencyMs: 36,
  };

  const afterState = {
    pathStr: bestRoute ? bestRoute.asPath.join(' → ') : 'No Route',
    asHops: bestRoute ? bestRoute.asPathLength : 0,
    routerPath: bestRoute ? bestRoute.routerPath.join(' ➔ ') : 'None',
    latencyMs: bestRoute ? bestRoute.totalLatencyMs : 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Toolbar */}
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
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Link Failure & Dynamic Failover</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Simulate an inter-domain link failure to observe dynamic route recalculation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => toggleLinkStatus('L-3-5')}
            className={`btn btn-sm ${isL3Down ? 'btn-danger' : 'btn-primary'}`}
          >
            <AlertOctagon size={14} />
            <span>{isL3Down ? 'Restore Link AS3–AS5' : 'Cut Link AS3–AS5'}</span>
          </button>

          <button
            onClick={resetNetworkToDefault}
            className="btn btn-sm btn-outline"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Before vs After Route State Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Baseline Before Failure */}
        <div
          className="card"
          style={{
            borderColor: !isL3Down ? 'var(--accent-blue)' : 'var(--border-subtle)',
            padding: '14px',
          }}
        >
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">
              <span>Primary Route (Normal)</span>
            </div>
            <span className={`badge ${!isL3Down ? 'badge-green' : 'badge-red'}`}>
              {!isL3Down ? 'ACTIVE' : 'WITHDRAWN'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              className="text-mono"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: !isL3Down ? '#60a5fa' : 'var(--text-muted)',
              }}
            >
              {beforeBaseline.pathStr}
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Hops: <strong style={{ color: '#f1f5f9' }}>{beforeBaseline.asHops}</strong></span>
              <span>Delay: <strong style={{ color: '#f1f5f9' }}>{beforeBaseline.latencyMs} ms</strong></span>
              <span>Routers: <strong style={{ color: '#f1f5f9' }}>{beforeBaseline.routerPath}</strong></span>
            </div>
          </div>
        </div>

        {/* Dynamic Failover Route */}
        <div
          className="card"
          style={{
            borderColor: isL3Down ? 'var(--accent-blue)' : 'var(--border-subtle)',
            padding: '14px',
          }}
        >
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">
              <span>Failover Route (Backup)</span>
            </div>
            <span className={`badge ${isL3Down ? 'badge-green' : 'badge-amber'}`}>
              {isL3Down ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              className="text-mono"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: isL3Down ? '#60a5fa' : '#f1f5f9',
              }}
            >
              {afterState.pathStr}
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Hops: <strong style={{ color: '#f1f5f9' }}>{afterState.asHops}</strong></span>
              <span>Delay: <strong style={{ color: '#f1f5f9' }}>{afterState.latencyMs} ms</strong></span>
              <span>Routers: <strong style={{ color: '#f1f5f9' }}>{afterState.routerPath}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Topology Canvas */}
      <div className="card" style={{ padding: '12px' }}>
        <NetworkTopology height="360px" allowEdit={false} />
      </div>

      {/* Clean Convergence Timeline */}
      <div className="card" style={{ padding: '14px' }}>
        <div className="card-header" style={{ marginBottom: '10px' }}>
          <div className="card-title">
            <span>Convergence Timeline</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem' }}>
            <span className="text-mono" style={{ color: 'var(--text-muted)', width: '50px' }}>T = 0s</span>
            <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>LINK DOWN</span>
            <span style={{ color: 'var(--text-primary)' }}>Link L-3-5 between AS3 and AS5 fails.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem' }}>
            <span className="text-mono" style={{ color: 'var(--text-muted)', width: '50px' }}>T = 0.4s</span>
            <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>WITHDRAW</span>
            <span style={{ color: 'var(--text-primary)' }}>AS3 sends route withdrawal to AS1.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem' }}>
            <span className="text-mono" style={{ color: 'var(--text-muted)', width: '50px' }}>T = 0.8s</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>REROUTE</span>
            <span style={{ color: 'var(--text-primary)' }}>AS1 evaluates alternative path via AS2.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.78rem' }}>
            <span className="text-mono" style={{ color: 'var(--text-muted)', width: '50px' }}>T = 1.2s</span>
            <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>RESTORED</span>
            <span style={{ color: 'var(--text-primary)' }}>Traffic forwards via AS1 → AS2 → AS4.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

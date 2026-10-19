import React from 'react';
import NetworkTopology from '../components/NetworkTopology.jsx';
import { useNetwork } from '../context/NetworkContext.jsx';
import { Network } from 'lucide-react';

export default function TopologyPage() {
  const { bgpResult, sourceAs, destAs } = useNetwork();
  const bestRoute = bgpResult?.bestRoute;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Concise Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '2px 0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={18} color="var(--accent-blue)" />
            <h1 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Network Topology</h1>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Autonomous Systems (AS1–AS5) with interdomain BGP peering and interior routing. Click any node or link to inspect properties.
          </p>
        </div>

        {/* Current Active Route Pill */}
        {bestRoute ? (
          <div
            style={{
              fontSize: '0.76rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Active Path ({sourceAs} → {destAs}):</span>
            <strong style={{ color: 'var(--accent-blue)' }}>{bestRoute.asPath.join(' → ')}</strong>
            <span style={{ color: 'var(--text-muted)' }}>({bestRoute.asPathLength - 1} hops • {bestRoute.learnedVia})</span>
          </div>
        ) : (
          <div
            style={{
              fontSize: '0.76rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              color: '#f87171',
            }}
          >
            Destination Unreachable
          </div>
        )}
      </div>

      {/* Main Full-Screen Topology Canvas */}
      <NetworkTopology height="calc(100vh - 145px)" allowEdit={true} />
    </div>
  );
}

import React from 'react';
import {
  RotateCcw,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext.jsx';

export default function Topbar({ activeTab }) {
  const {
    ases,
    sourceAs,
    setSourceAs,
    destAs,
    setDestAs,
    bgpResult,
    links,
    toggleLinkStatus,
    resetNetworkToDefault,
  } = useNetwork();

  const as3As5Link = links.find((l) => l.id === 'L-3-5');
  const isL3Down = as3As5Link?.status === 'FAILED';

  const titles = {
    dashboard: 'Dashboard',
    topology: 'Network Topology',
    simulator: 'Packet Simulator',
    failure: 'Link Failure & Failover',
    performance: 'Performance Analysis',
    transport: 'TCP / UDP Simulation',
  };

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 40,
        gap: '16px',
      }}
    >
      {/* Left: Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
          {titles[activeTab] || 'RouteLab'}
        </h1>
      </div>

      {/* Center: Source & Destination Selector + Current Route */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-surface)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>From:</span>
        <select
          value={sourceAs}
          onChange={(e) => setSourceAs(e.target.value)}
          className="select-field"
          style={{ padding: '2px 6px', fontSize: '0.78rem' }}
        >
          {ases.map((a) => (
            <option key={a.id} value={a.id}>{a.id}</option>
          ))}
        </select>

        <ArrowRight size={13} color="var(--text-muted)" />

        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>To:</span>
        <select
          value={destAs}
          onChange={(e) => setDestAs(e.target.value)}
          className="select-field"
          style={{ padding: '2px 6px', fontSize: '0.78rem' }}
        >
          {ases.map((a) => (
            <option key={a.id} value={a.id}>{a.id}</option>
          ))}
        </select>

        {/* Selected Route Display */}
        {bgpResult?.bestRoute ? (
          <div
            style={{
              marginLeft: '6px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: '#60a5fa',
              fontWeight: 600,
            }}
          >
            {bgpResult.bestRoute.asPath.join(' → ')}
          </div>
        ) : (
          <div
            style={{
              marginLeft: '6px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.75rem',
              color: '#f87171',
            }}
          >
            No Route
          </div>
        )}
      </div>

      {/* Right: Quick Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => toggleLinkStatus('L-3-5')}
          className={`btn btn-sm ${isL3Down ? 'btn-danger' : 'btn-secondary'}`}
        >
          <AlertOctagon size={14} />
          <span>{isL3Down ? 'Restore AS3–AS5' : 'Cut AS3–AS5'}</span>
        </button>

        <button
          onClick={resetNetworkToDefault}
          className="btn btn-sm btn-outline"
          title="Reset"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}

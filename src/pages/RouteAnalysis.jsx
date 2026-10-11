import React from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import RouteComparison from '../components/RouteComparison.jsx';
import { GitFork, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';

export default function RouteAnalysis() {
  const {
    ases,
    sourceAs,
    setSourceAs,
    destAs,
    setDestAs,
    bgpResult,
    notify,
  } = useNetwork();

  const handleRecalculate = () => {
    notify('BGP Path Vector Engine recalculated routing tables and Loc-RIB', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Route Control Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitFork size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                BGP Path Vector Routing & Policy Analysis
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Evaluate inter-AS path discovery, Gao-Rexford business policy weighting, and loop prevention.
            </p>
          </div>

          {/* Source & Destination Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>SOURCE AS:</span>
              <select
                value={sourceAs}
                onChange={(e) => setSourceAs(e.target.value)}
                className="select-field"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                {ases.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name}
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight size={18} color="var(--accent-cyan)" />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEST AS:</span>
              <select
                value={destAs}
                onChange={(e) => setDestAs(e.target.value)}
                className="select-field"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                {ases.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRecalculate}
              className="btn btn-sm btn-primary"
              style={{ marginLeft: '6px' }}
            >
              <RefreshCw size={14} /> Recompute Paths
            </button>
          </div>
        </div>
      </div>

      {/* Educational Notice Banner */}
      <div
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <BookOpen size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent-cyan)' }}>Gao-Rexford Routing Model:</strong>{' '}
          BGP does not select routes based on shortest distance or hop count alone. Routes learned from <strong>Customers</strong> are preferred over <strong>Peers</strong>, which are preferred over <strong>Providers</strong> (Customer &gt; Peer &gt; Provider). AS-Path length is utilized as a tie-breaker only when commercial preferences are identical.
        </div>
      </div>

      {/* Main Route Comparison & Decision Walkthrough */}
      <RouteComparison bgpResult={bgpResult} />
    </div>
  );
}

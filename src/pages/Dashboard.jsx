import React from 'react';
import {
  Globe,
  Server,
  Network,
  Activity,
  ArrowRight,
  Radio,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext.jsx';
import MetricCard from '../components/MetricCard.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import { TrafficTimeSeriesChart } from '../components/PerformanceCharts.jsx';
import { MOCK_TRAFFIC_SERIES } from '../data/mockMetrics.js';

export default function Dashboard({ setActiveTab }) {
  const {
    ases,
    routers,
    links,
    bgpResult,
    activeLinksCount,
    healthPercent,
    logs,
  } = useNetwork();

  const bestRoute = bgpResult?.bestRoute;
  const isHealthy = healthPercent === 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Subtle Link Down Alert */}
      {!isHealthy && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5' }}>
            <AlertTriangle size={16} />
            <span>Link failure detected. Path dynamically recalculated to {bestRoute ? bestRoute.asPath.join(' → ') : 'None'}.</span>
          </div>
          <button
            onClick={() => setActiveTab('failure')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
          >
            View Details <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 4 Clean Essential Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <MetricCard
          title="Autonomous Systems"
          value={ases.length}
          subtext="AS1 (Campus) to AS5 (Core)"
          icon={Globe}
        />

        <MetricCard
          title="Active Routers"
          value={routers.length}
          subtext="R1 to R6 (Border Gateways)"
          icon={Server}
        />

        <MetricCard
          title="Active Route"
          value={bestRoute ? bestRoute.asPath.join(' → ') : 'No Route'}
          subtext={bestRoute ? `${bestRoute.asPathLength} hops (${bestRoute.learnedVia})` : 'Unreachable'}
          icon={Radio}
        />

        <MetricCard
          title="Path Latency"
          value={bestRoute ? `${bestRoute.totalLatencyMs} ms` : '—'}
          subtext={`${activeLinksCount}/${links.length} links active`}
          icon={Clock}
        />
      </div>

      {/* Main 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
        {/* Topology Panel */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">
              <Network size={16} color="var(--accent-blue)" />
              <span>Network Topology</span>
            </div>
            <button
              onClick={() => setActiveTab('topology')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.75rem' }}
            >
              Full Canvas <ArrowRight size={13} />
            </button>
          </div>
          <NetworkTopology height="380px" allowEdit={false} />
        </div>

        {/* Right Column: Chart + Recent Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Traffic Chart */}
          <div className="card" style={{ padding: '14px' }}>
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <div className="card-title">
                <Activity size={16} color="var(--accent-blue)" />
                <span>Traffic & Latency</span>
              </div>
            </div>
            <TrafficTimeSeriesChart data={MOCK_TRAFFIC_SERIES} />
          </div>

          {/* Recent Events */}
          <div className="card" style={{ padding: '14px' }}>
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <div className="card-title">
                <span>Recent Events</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {logs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span
                      className="status-dot"
                      style={{
                        backgroundColor:
                          log.severity === 'error'
                            ? '#ef4444'
                            : log.severity === 'success'
                            ? '#10b981'
                            : '#3b82f6',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.description}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0, marginLeft: '8px' }}>
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

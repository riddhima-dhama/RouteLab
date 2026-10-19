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
  GitFork,
  ShieldCheck,
  Send,
  Zap,
  FileText,
  Sliders,
  CheckCircle2,
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
    sourceAs,
    destAs,
  } = useNetwork();

  const bestRoute = bgpResult?.bestRoute;
  const isHealthy = healthPercent === 100;

  const quickNavItems = [
    {
      id: 'topology',
      title: 'Network Topology',
      desc: 'AS domains, border routers, OSPF costs, and commercial peering',
      icon: Network,
      color: 'var(--accent-blue)',
    },
    {
      id: 'bgp-routing',
      title: 'BGP Routing',
      desc: 'Path-vector calculation, Loc-RIB candidate comparison, and AS-paths',
      icon: GitFork,
      color: 'var(--accent-cyan)',
    },
    {
      id: 'policies',
      title: 'BGP Policies & Loops',
      desc: 'Gao-Rexford business rules and RFC 4271 AS-path loop prevention',
      icon: ShieldCheck,
      color: '#10b981',
    },
    {
      id: 'simulator',
      title: 'Packet Simulator',
      desc: 'Hop-by-hop packet forwarding, TTL decrements, and delivery trace',
      icon: Send,
      color: '#38bdf8',
    },
    {
      id: 'performance',
      title: 'Performance Analyzer',
      desc: 'Bandwidth, throughput, latency, delay, and bottleneck analysis',
      icon: Activity,
      color: '#a855f7',
    },
    {
      id: 'dynamic-routing',
      title: 'Dynamic Routing',
      desc: 'Link severing, route withdrawal, convergence, and failover',
      icon: AlertTriangle,
      color: 'var(--accent-amber)',
    },
    {
      id: 'transport',
      title: 'TCP/UDP Analysis',
      desc: 'AIMD congestion control, Fast Retransmit, and UDP datagram stream',
      icon: Zap,
      color: '#ec4899',
    },
    {
      id: 'events',
      title: 'Simulation Events',
      desc: 'Protocol state changes, withdrawal audit trail, and CSV export',
      icon: FileText,
      color: '#94a3b8',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Dynamic Link Down / Failover Alert */}
      {!isHealthy && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.09)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
            <AlertTriangle size={18} />
            <span>
              <strong>Dynamic Failover Active:</strong> Link severance detected. Traffic rerouted via{' '}
              <strong style={{ color: '#fff' }}>{bestRoute ? bestRoute.asPath.join(' → ') : 'None (Unreachable)'}</strong>.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('dynamic-routing')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem', padding: '4px 10px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
          >
            Inspect Failover Telemetry <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 4 Primary System Metric Cards */}
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
          subtext={bestRoute ? `${bestRoute.asPathLength - 1} AS Hops (${bestRoute.learnedVia})` : 'Unreachable'}
          icon={Radio}
        />

        <MetricCard
          title="Path Latency"
          value={bestRoute ? `${bestRoute.totalLatencyMs} ms` : '—'}
          subtext={`${activeLinksCount}/${links.length} links operational`}
          icon={Clock}
        />
      </div>

      {/* Active Loc-RIB & BGP Policy Status Banner */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderLeft: '4px solid var(--accent-cyan)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Session:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {sourceAs} → {destAs}
            </span>
          </div>

          <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Policy Winner:</span>
            <span style={{ fontSize: '0.82rem', color: '#f1f5f9' }}>
              {bestRoute ? (
                <>
                  <strong style={{ color: '#34d399' }}>{bestRoute.learnedVia.toUpperCase()} Route</strong> (Local-Pref: {bestRoute.localPref}, AS-Path: {bestRoute.asPath.join(' → ')})
                </>
              ) : (
                <span style={{ color: '#f87171' }}>Destination Unreachable</span>
              )}
            </span>
          </div>

          <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
              {isHealthy ? 'Topology Converged' : 'Dynamic Backup Path'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('simulator')}
            className="btn btn-sm btn-primary"
            style={{ fontSize: '0.75rem' }}
          >
            <Send size={12} /> Trace Packet
          </button>
          <button
            onClick={() => setActiveTab('dynamic-routing')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.75rem' }}
          >
            <AlertTriangle size={12} /> Test Failover
          </button>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '16px' }}>
        {/* Topology Panel */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">
              <Network size={16} color="var(--accent-blue)" />
              <span>Interdomain BGP Topology</span>
            </div>
            <button
              onClick={() => setActiveTab('topology')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.75rem' }}
            >
              Full Canvas <ArrowRight size={13} />
            </button>
          </div>
          <NetworkTopology height="460px" allowEdit={false} />
        </div>

        {/* Right Column: Traffic Chart + Recent Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Traffic Chart */}
          <div className="card" style={{ padding: '14px' }}>
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <div className="card-title">
                <Activity size={16} color="var(--accent-blue)" />
                <span>Telemetry: Traffic &amp; Latency</span>
              </div>
            </div>
            <TrafficTimeSeriesChart data={MOCK_TRAFFIC_SERIES} />
          </div>

          {/* Recent Events */}
          <div className="card" style={{ padding: '14px' }}>
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <div className="card-title">
                <FileText size={16} color="var(--accent-cyan)" />
                <span>Recent Protocol Events</span>
              </div>
              <button
                onClick={() => setActiveTab('events')}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              >
                All Logs <ArrowRight size={12} />
              </button>
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

      {/* Module Hub Navigation Grid (Section 10 Requirement) */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div>
            <div className="card-title">
              <Sliders size={18} color="var(--accent-cyan)" />
              <span>RouteLab Analysis Modules</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Direct access to all 8 specialized interdomain routing, packet tracing, and transport analysis environments
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
          }}
        >
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} color={item.color} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                  </div>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

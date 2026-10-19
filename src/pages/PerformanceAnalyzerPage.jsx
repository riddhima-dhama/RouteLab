import React from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import {
  computeRoutePerformance,
  compareRoutingCandidates,
} from '../engine/performanceAnalyzer.js';
import {
  TrafficTimeSeriesChart,
  RouteComparisonBarChart,
} from '../components/PerformanceCharts.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { Download, Clock, Zap, Gauge, Timer, Layers, Info } from 'lucide-react';
import { formatBandwidth } from '../utils/calculations.js';
import { exportToCSV } from '../utils/exportCSV.js';
import { MOCK_TRAFFIC_SERIES } from '../data/mockMetrics.js';

export default function PerformanceAnalyzerPage() {
  const { bgpResult } = useNetwork();

  const bestRoute = bgpResult?.bestRoute;
  const metrics = computeRoutePerformance(bestRoute);
  const candidates = compareRoutingCandidates(bgpResult?.validRoutes || []);

  const handleExportPerformance = () => {
    const exportData = candidates.map((c) => ({
      Category: c.category,
      AS_Path: c.asPathStr,
      AS_Hops: c.hops,
      Bandwidth_Mbps: c.bandwidthMbps,
      Throughput_Mbps: c.throughputMbps,
      Delay_ms: c.delayMs,
      Latency_ms: c.latencyMs,
      PDR_Percent: c.pdr,
    }));
    exportToCSV(`performance_metrics_${Date.now()}`, exportData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Network Performance & Telemetry Dashboard</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Quantitative measurement of bandwidth capacity, effective throughput, total delay, and link propagation latency.
            </p>
          </div>

          <button onClick={handleExportPerformance} className="btn btn-primary btn-sm">
            <Download size={13} /> Export Telemetry CSV
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        <MetricCard
          title="Bandwidth"
          value={formatBandwidth(metrics.bandwidthMbps)}
          subtext="Maximum bottleneck data rate"
          icon={Gauge}
        />

        <MetricCard
          title="Throughput"
          value={formatBandwidth(metrics.throughputMbps)}
          subtext="Achieved transmission rate"
          icon={Zap}
        />

        <MetricCard
          title="Delay"
          value={`${metrics.delayMs} ms`}
          subtext="Total end-to-end time (prop + tx + queue)"
          icon={Timer}
        />

        <MetricCard
          title="Latency"
          value={`${metrics.latencyMs} ms`}
          subtext="Physical propagation time"
          icon={Clock}
        />
      </div>

      {/* Secondary Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Packet Delivery Ratio:</span>
          <div style={{ fontWeight: 700, color: '#10b981', fontSize: '1.05rem' }}>{metrics.pdr}%</div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Packet Loss Rate:</span>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>{metrics.packetLossPercent}%</div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Bandwidth-Delay Product:</span>
          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '1.05rem' }}>
            {Math.round(metrics.bdpKbits || 0).toLocaleString()} Kbit
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Bottleneck Capacity Utilized:</span>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>{metrics.utilizationPercent}%</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {/* Route Comparison Bar Chart */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">
              <Layers size={16} color="var(--accent-cyan)" />
              <span>Route Candidate Telemetry Comparison</span>
            </div>
            <span className="badge badge-cyan">BENCHMARK</span>
          </div>
          <RouteComparisonBarChart comparisonData={candidates} />
        </div>

        {/* Traffic Time Series */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">
              <Clock size={16} color="var(--accent-blue)" />
              <span>Network Traffic & Latency Stream</span>
            </div>
            <span className="badge badge-cyan" title="Illustrative baseline stream sampled over time">
              TELEMETRY STREAM
            </span>
          </div>
          <TrafficTimeSeriesChart data={MOCK_TRAFFIC_SERIES} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            <Info size={13} />
            <span>Illustrative baseline telemetry stream sampled over a 24-hour observation window.</span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="card" style={{ padding: '14px' }}>
        <div className="card-header" style={{ marginBottom: '10px' }}>
          <div className="card-title">
            <span>Route Performance Benchmark Table</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Comparing BGP Policy Path vs Alternative Path vs Shortest-Delay Path
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate Type</th>
                <th>AS-PATH</th>
                <th>AS Hops</th>
                <th>Bandwidth (Capacity)</th>
                <th>Throughput</th>
                <th>Delay (Total)</th>
                <th>Latency (Prop)</th>
                <th>Delivery %</th>
                <th>Selection Decision Rationale</th>
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
                  <td className="text-mono" style={{ fontWeight: 600 }}>{cand.asPathStr}</td>
                  <td>{cand.hops}</td>
                  <td style={{ fontWeight: 600 }}>{formatBandwidth(cand.bandwidthMbps)}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{formatBandwidth(cand.throughputMbps)}</td>
                  <td style={{ color: '#38bdf8', fontWeight: 700 }}>{cand.delayMs} ms</td>
                  <td style={{ color: '#818cf8' }}>{cand.latencyMs} ms</td>
                  <td style={{ color: '#34d399' }}>{cand.pdr}%</td>
                  <td style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                    {cand.decisionReason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

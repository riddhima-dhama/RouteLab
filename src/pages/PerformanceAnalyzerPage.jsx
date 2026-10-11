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
import { Download, Clock, Zap, Percent, Gauge } from 'lucide-react';
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
      Latency_ms: c.latencyMs,
      Bandwidth_Mbps: c.bandwidthMbps,
      Throughput_Mbps: c.throughputMbps,
      PDR_Percent: c.pdr,
    }));
    exportToCSV(`performance_metrics_${Date.now()}`, exportData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Performance Analysis</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Throughput, propagation delay, and packet delivery ratio.
          </p>
        </div>

        <button onClick={handleExportPerformance} className="btn btn-primary btn-sm">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        <MetricCard
          title="Latency"
          value={`${metrics.latencyMs} ms`}
          subtext="Round-trip delay"
          icon={Clock}
        />

        <MetricCard
          title="Throughput"
          value={formatBandwidth(metrics.throughputMbps)}
          subtext="Effective transfer rate"
          icon={Zap}
        />

        <MetricCard
          title="Delivery Ratio"
          value={`${metrics.pdr}%`}
          subtext="Packet success rate"
          icon={Percent}
        />

        <MetricCard
          title="Path Capacity"
          value={formatBandwidth(metrics.bandwidthMbps)}
          subtext="Bottleneck link"
          icon={Gauge}
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">
              <span>Route Comparison</span>
            </div>
          </div>
          <RouteComparisonBarChart comparisonData={candidates} />
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">
              <span>Traffic & Latency Trend</span>
            </div>
          </div>
          <TrafficTimeSeriesChart data={MOCK_TRAFFIC_SERIES} />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="card" style={{ padding: '14px' }}>
        <div className="card-header" style={{ marginBottom: '10px' }}>
          <div className="card-title">
            <span>Route Benchmark</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>AS-PATH</th>
                <th>Hops</th>
                <th>Latency</th>
                <th>Throughput</th>
                <th>Delivery %</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand, idx) => (
                <tr key={idx} className={cand.isWinner ? 'active-row' : ''}>
                  <td style={{ fontWeight: 600 }}>{cand.tag}</td>
                  <td className="text-mono">{cand.asPathStr}</td>
                  <td>{cand.hops}</td>
                  <td style={{ color: '#60a5fa', fontWeight: 600 }}>{cand.latencyMs} ms</td>
                  <td>{formatBandwidth(cand.throughputMbps)}</td>
                  <td style={{ color: '#34d399' }}>{cand.pdr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

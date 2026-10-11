import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function TrafficTimeSeriesChart({ data }) {
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
          <Area
            type="monotone"
            dataKey="throughput"
            name="Throughput (Mbps)"
            stroke="#38bdf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#throughputGrad)"
          />
          <Area
            type="monotone"
            dataKey="latency"
            name="Latency (ms)"
            stroke="#a855f7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#latencyGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RouteComparisonBarChart({ comparisonData }) {
  const chartData = comparisonData.map((c) => ({
    name: c.tag,
    Latency: c.latencyMs,
    Hops: c.hops,
    Throughput: c.throughputMbps,
  }));

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
          <Bar dataKey="Latency" name="Latency (ms)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Hops" name="AS Hops" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Throughput" name="Throughput (Mbps)" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TcpCwndChart({ data }) {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="round"
            stroke="#64748b"
            fontSize={11}
            label={{ value: 'Transmission Round (RTT)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            label={{ value: 'CWND (MSS)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Line
            type="monotone"
            dataKey="cwnd"
            name="Congestion Window (cwnd)"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={{ r: 4, fill: '#38bdf8' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="stepAfter"
            dataKey="ssthresh"
            name="Slow Start Threshold (ssthresh)"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

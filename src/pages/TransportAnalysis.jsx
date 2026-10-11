import React, { useState } from 'react';
import {
  simulateTcpRounds,
  simulateUdpBurst,
} from '../engine/performanceAnalyzer.js';
import { TcpCwndChart } from '../components/PerformanceCharts.jsx';
import { Play } from 'lucide-react';

export default function TransportAnalysis() {
  const [tcpRoundsCount, setTcpRoundsCount] = useState(18);
  const [tcpDropRound, setTcpDropRound] = useState(8);
  const [hasLossEvent, setHasLossEvent] = useState(true);
  const [tcpData, setTcpData] = useState(() =>
    simulateTcpRounds({ numRounds: 18, initialSsthresh: 16, dropAtRound: 8, hasLoss: true })
  );

  const [udpPacketsCount, setUdpPacketsCount] = useState(20);
  const [udpLossRate, setUdpLossRate] = useState(5);
  const [udpResult, setUdpResult] = useState(() =>
    simulateUdpBurst({ packetCount: 20, lossRate: 5 })
  );

  const handleRunTcp = () => {
    setTcpData(
      simulateTcpRounds({
        numRounds: tcpRoundsCount,
        initialSsthresh: 16,
        dropAtRound: tcpDropRound,
        hasLoss: hasLossEvent,
      })
    );
  };

  const handleRunUdp = () => {
    setUdpResult(simulateUdpBurst({ packetCount: udpPacketsCount, lossRate: udpLossRate }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>TCP & UDP Simulation</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Compare TCP congestion window behavior against connectionless UDP transmission.
        </p>
      </div>

      {/* TCP Section */}
      <div className="card" style={{ padding: '14px' }}>
        <div className="card-header" style={{ marginBottom: '10px' }}>
          <div className="card-title">
            <span>TCP Congestion Window (AIMD)</span>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rounds:</span>
              <input
                type="number"
                value={tcpRoundsCount}
                min="10"
                max="35"
                onChange={(e) => setTcpRoundsCount(Number(e.target.value))}
                className="input-field"
                style={{ width: '55px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drop at round:</span>
              <input
                type="number"
                value={tcpDropRound}
                min="2"
                max="25"
                onChange={(e) => setTcpDropRound(Number(e.target.value))}
                className="input-field"
                style={{ width: '55px' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasLossEvent}
                onChange={(e) => setHasLossEvent(e.target.checked)}
              />
              <span>Simulate Packet Drop (Fast Retransmit)</span>
            </label>
          </div>

          <button onClick={handleRunTcp} className="btn btn-sm btn-primary">
            <Play size={13} /> Run TCP
          </button>
        </div>

        <TcpCwndChart data={tcpData} />
      </div>

      {/* UDP Section */}
      <div className="card" style={{ padding: '14px' }}>
        <div className="card-header" style={{ marginBottom: '10px' }}>
          <div className="card-title">
            <span>UDP Datagram Stream</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Packets:</span>
              <input
                type="number"
                value={udpPacketsCount}
                min="5"
                max="40"
                onChange={(e) => setUdpPacketsCount(Number(e.target.value))}
                className="input-field"
                style={{ width: '55px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loss %:</span>
              <input
                type="number"
                value={udpLossRate}
                min="0"
                max="40"
                onChange={(e) => setUdpLossRate(Number(e.target.value))}
                className="input-field"
                style={{ width: '55px' }}
              />
            </div>
          </div>

          <button onClick={handleRunUdp} className="btn btn-sm btn-primary">
            <Play size={13} /> Transmit
          </button>
        </div>

        {/* Small stats row */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', marginBottom: '12px' }}>
          <span>Sent: <strong style={{ color: '#f1f5f9' }}>{udpResult.totalSent}</strong></span>
          <span>Delivered: <strong style={{ color: '#34d399' }}>{udpResult.delivered}</strong></span>
          <span>Dropped: <strong style={{ color: '#f87171' }}>{udpResult.dropped}</strong></span>
          <span>Loss Rate: <strong style={{ color: '#fbbf24' }}>{udpResult.lossPercent}%</strong></span>
        </div>

        {/* Datagram pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {udpResult.packets.map((pkt) => (
            <div
              key={pkt.seq}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                backgroundColor: pkt.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${pkt.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: pkt.status === 'DELIVERED' ? '#34d399' : '#f87171',
              }}
              title={`Pkt #${pkt.seq}: ${pkt.status}`}
            >
              {pkt.seq}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  simulateTcpRounds,
  simulateUdpBurst,
} from '../engine/performanceAnalyzer.js';
import { TcpCwndChart } from '../components/PerformanceCharts.jsx';
import api from '../services/api.js';
import {
  Play,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

export default function TransportAnalysis() {
  // TCP Simulation State
  const [tcpRoundsCount, setTcpRoundsCount] = useState(18);
  const [tcpInitialSsthresh, setTcpInitialSsthresh] = useState(16);
  const [tcpDropRound, setTcpDropRound] = useState(8);
  const [hasLossEvent, setHasLossEvent] = useState(true);
  const [tcpLossType, setTcpLossType] = useState('fast_retransmit'); // 'fast_retransmit' | 'timeout'
  const [tcpDataSource, setTcpDataSource] = useState('standalone');
  const [isTcpLoading, setIsTcpLoading] = useState(false);

  const [tcpData, setTcpData] = useState(() =>
    simulateTcpRounds({
      numRounds: 18,
      initialSsthresh: 16,
      dropAtRound: 8,
      hasLoss: true,
      lossType: 'fast_retransmit',
    })
  );

  // UDP Simulation State
  const [udpPacketsCount, setUdpPacketsCount] = useState(24);
  const [udpLossRate, setUdpLossRate] = useState(8);
  const [udpDataSource, setUdpDataSource] = useState('standalone');
  const [isUdpLoading, setIsUdpLoading] = useState(false);

  const [udpResult, setUdpResult] = useState(() =>
    simulateUdpBurst({ packetCount: 24, lossRate: 8 })
  );

  // Run TCP simulation
  const handleRunTcp = async (overrideLossType = tcpLossType, overrideDrop = tcpDropRound) => {
    setIsTcpLoading(true);
    try {
      const res = await api.simulateTransport({
        protocol: 'TCP',
        rounds: tcpRoundsCount,
        dropRound: overrideDrop,
        hasLoss: hasLossEvent,
        lossType: overrideLossType,
        initialSsthresh: tcpInitialSsthresh,
      });

      if (res && res.data && Array.isArray(res.data.rounds)) {
        setTcpData(res.data.rounds);
        setTcpDataSource('backend');
      } else {
        throw new Error('Fallback to local engine');
      }
    } catch {
      // Local RFC 5681 engine fallback
      const localResult = simulateTcpRounds({
        numRounds: tcpRoundsCount,
        initialSsthresh: tcpInitialSsthresh,
        dropAtRound: overrideDrop,
        hasLoss: hasLossEvent,
        lossType: overrideLossType,
      });
      setTcpData(localResult);
      setTcpDataSource('standalone');
    } finally {
      setIsTcpLoading(false);
    }
  };

  // Run UDP simulation
  const handleRunUdp = async () => {
    setIsUdpLoading(true);
    try {
      const res = await api.simulateTransport({
        protocol: 'UDP',
        packetCount: udpPacketsCount,
        lossRate: udpLossRate,
      });

      if (res && res.data && Array.isArray(res.data.packets)) {
        setUdpResult(res.data);
        setUdpDataSource('backend');
      } else {
        throw new Error('Fallback to local engine');
      }
    } catch {
      const localResult = simulateUdpBurst({
        packetCount: udpPacketsCount,
        lossRate: udpLossRate,
      });
      setUdpResult(localResult);
      setUdpDataSource('standalone');
    } finally {
      setIsUdpLoading(false);
    }
  };

  // Preset triggers for BGP Link Failure impact on TCP
  const triggerBgpFlapSimulation = (type) => {
    setHasLossEvent(true);
    setTcpDropRound(8);
    setTcpLossType(type);
    handleRunTcp(type, 8);
  };

  // Compute TCP Summary Stats
  const peakCwnd = Math.max(...tcpData.map((d) => d.cwnd), 0);
  const finalRound = tcpData[tcpData.length - 1] || {};
  const retransmitEvents = tcpData.filter((d) => d.event && d.event.includes('Loss') || d.event?.includes('Timeout')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={22} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                TCP vs UDP Transport Layer & Congestion Control
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Evaluate connection-oriented reliable delivery with AIMD congestion control versus connectionless UDP datagram streaming, and evaluate the transport impact of dynamic routing failovers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: tcpDataSource === 'backend' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                color: tcpDataSource === 'backend' ? '#34d399' : 'var(--accent-cyan)',
                border: `1px solid ${tcpDataSource === 'backend' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.25)'}`,
                fontWeight: 600,
              }}
            >
              {tcpDataSource === 'backend' ? 'Backend Transport Engine' : 'Engine: Standalone (RFC 5681 AIMD)'}
            </span>
          </div>
        </div>
      </div>

      {/* Protocol Architecture Comparison Table (Section 9 Requirement) */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div className="card-title">
            <Layers size={18} color="var(--accent-cyan)" />
            <span>TCP vs UDP Architectural Comparison</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Transport Layer Protocols (OSI Layer 4)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Protocol Feature</th>
                <th style={{ width: '39%', color: 'var(--accent-cyan)' }}>Transmission Control Protocol (TCP)</th>
                <th style={{ width: '39%', color: 'var(--accent-amber)' }}>User Datagram Protocol (UDP)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Connection Model</strong></td>
                <td>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Connection-Oriented</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Requires 3-way handshake (SYN, SYN-ACK, ACK) to negotiate state and initial sequence numbers before transmission.
                  </div>
                </td>
                <td>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>Connectionless</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Transmits datagrams immediately without handshake or state setup. Zero connection establishment delay.
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>Delivery Reliability</strong></td>
                <td>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Guaranteed & In-Order</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Byte-stream sequence numbering, cumulative acknowledgments (ACKs), and automatic retransmissions for lost segments.
                  </div>
                </td>
                <td>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>Unreliable (Best Effort)</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    No delivery guarantees, no acknowledgments, no sequence numbering, and no retransmissions. Dropped packets are discarded.
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>Flow Control</strong></td>
                <td>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>Sliding Window Flow Control</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Receiver advertises its available buffer window (<code>rwnd</code>) in TCP header to prevent sender buffer overrun.
                  </div>
                </td>
                <td>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>No Flow Control</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Sender transmits at application rate regardless of receiver socket buffer capacity. Buffer overrun causes silent drops.
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>Congestion Control</strong></td>
                <td>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>AIMD Congestion Control</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Dynamically modulates Congestion Window (<code>cwnd</code>) using Additive Increase / Multiplicative Decrease.
                  </div>
                </td>
                <td>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>No Congestion Control</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Transmits at application rate without throttling during bottleneck link saturation.
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>Slow Start Phase</strong></td>
                <td>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>Exponential Growth</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Starts with <code>cwnd = 1 MSS</code>; doubles window each RTT (<code>cwnd = cwnd * 2</code>) until reaching <code>ssthresh</code>.
                  </div>
                </td>
                <td>
                  <span style={{ color: '#94a3b8' }}>Not Applicable</span>
                </td>
              </tr>
              <tr>
                <td><strong>Congestion Avoidance</strong></td>
                <td>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Linear Additive Increase</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    When <code>cwnd &gt;= ssthresh</code>, increases by 1 MSS per RTT (<code>cwnd = cwnd + 1</code>) to probe available bottleneck bandwidth.
                  </div>
                </td>
                <td>
                  <span style={{ color: '#94a3b8' }}>Not Applicable</span>
                </td>
              </tr>
              <tr>
                <td><strong>Fast Retransmit</strong></td>
                <td>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>3 Duplicate ACKs Trigger</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Detects isolated packet loss before RTO timer expires, immediately retransmitting missing segment.
                  </div>
                </td>
                <td>
                  <span style={{ color: '#94a3b8' }}>Not Applicable</span>
                </td>
              </tr>
              <tr>
                <td><strong>Fast Recovery</strong></td>
                <td>
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>Halves ssthresh, Skips Slow Start</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Sets <code>ssthresh = cwnd / 2</code> and <code>cwnd = ssthresh</code>, continuing in Congestion Avoidance rather than resetting to 1.
                  </div>
                </td>
                <td>
                  <span style={{ color: '#94a3b8' }}>Not Applicable</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Layer BGP Link Flap & Rerouting Impact Panel */}
      <div
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Cross-Layer Impact: How BGP Route Failover Affects Transport Layer Protocols
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => triggerBgpFlapSimulation('fast_retransmit')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.74rem', borderColor: 'rgba(56, 189, 248, 0.4)' }}
            >
              Simulate BGP Link Flap (Fast Retransmit)
            </button>
            <button
              onClick={() => triggerBgpFlapSimulation('timeout')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.74rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
            >
              Simulate Convergence Timeout (RTO Drop)
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>Impact on TCP Streams:</strong>
            <p style={{ marginTop: '4px', lineHeight: 1.45 }}>
              When an inter-AS link severs, packets buffered on the dead link are dropped during BGP convergence.
              The receiver generates duplicate ACKs. Upon receiving <strong>3 Duplicate ACKs</strong>, TCP enters <strong>Fast Retransmit &amp; Fast Recovery</strong>, halving <code>ssthresh</code> and throttling throughput. If convergence exceeds the Retransmission Timeout (RTO), <code>cwnd</code> collapses down to <strong>1 MSS</strong>, forcing a Slow Start restart.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-amber)' }}>Impact on UDP Streams:</strong>
            <p style={{ marginTop: '4px', lineHeight: 1.45 }}>
              UDP has no sequence tracking or acknowledgment mechanisms. All datagrams routed toward the severed link are permanently discarded. The application experiences a burst loss gap equal to the BGP convergence duration, without any transport-layer notification or rate adjustment.
            </p>
          </div>
        </div>
      </div>

      {/* TCP Simulation Panel */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div>
            <div className="card-title">
              <Zap size={18} color="var(--accent-cyan)" />
              <span>TCP Congestion Control Visualizer (RFC 5681 AIMD)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Interactive visualization of Slow Start exponential growth, Additive Increase, and Multiplicative Decrease
            </div>
          </div>

          <button
            onClick={() => handleRunTcp(tcpLossType, tcpDropRound)}
            className="btn btn-sm btn-primary"
            disabled={isTcpLoading}
          >
            <Play size={13} /> {isTcpLoading ? 'Simulating...' : 'Run TCP Simulation'}
          </button>
        </div>

        {/* Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rounds (RTT):</span>
              <input
                type="number"
                value={tcpRoundsCount}
                min="10"
                max="35"
                onChange={(e) => setTcpRoundsCount(Number(e.target.value))}
                className="input-field"
                style={{ width: '55px', fontSize: '0.8rem', padding: '4px 6px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Initial ssthresh:</span>
              <select
                value={tcpInitialSsthresh}
                onChange={(e) => setTcpInitialSsthresh(Number(e.target.value))}
                className="select-field"
                style={{ fontSize: '0.78rem', padding: '4px 8px' }}
              >
                <option value={8}>8 MSS</option>
                <option value={16}>16 MSS (Standard)</option>
                <option value={24}>24 MSS</option>
                <option value={32}>32 MSS (High Bandwidth)</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasLossEvent}
                onChange={(e) => setHasLossEvent(e.target.checked)}
              />
              <span style={{ color: 'var(--text-primary)' }}>Simulate Loss Event</span>
            </label>

            {hasLossEvent && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>At Round:</span>
                  <input
                    type="number"
                    value={tcpDropRound}
                    min="2"
                    max={tcpRoundsCount - 2}
                    onChange={(e) => setTcpDropRound(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '50px', fontSize: '0.8rem', padding: '4px 6px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reaction:</span>
                  <select
                    value={tcpLossType}
                    onChange={(e) => setTcpLossType(e.target.value)}
                    className="select-field"
                    style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                  >
                    <option value="fast_retransmit">3 Dup ACKs (Fast Retransmit &amp; Recovery)</option>
                    <option value="timeout">RTO Timeout (Route Cut: cwnd -&gt; 1 MSS)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Telemetry Metric Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak CWND Achieved</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
              {peakCwnd} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>MSS</span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Final Throughput</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
              {finalRound.throughput || 0} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Mbps</span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Phase</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#60a5fa', marginTop: '4px' }}>
              {finalRound.phase || 'Idle'}
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Retransmission Events</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: retransmitEvents > 0 ? 'var(--accent-amber)' : '#34d399', marginTop: '2px' }}>
              {retransmitEvents} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>detected</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <TcpCwndChart data={tcpData} />

        {/* Step-by-Step Transmission Rounds Ledger */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Transmission Rounds Ledger (Hop-by-Hop RTT History)
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <table className="table" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th>Round</th>
                  <th>CWND (MSS)</th>
                  <th>ssthresh (MSS)</th>
                  <th>Protocol Phase</th>
                  <th>Est. Throughput</th>
                  <th>Action / Event</th>
                </tr>
              </thead>
              <tbody>
                {tcpData.map((d) => (
                  <tr key={d.round}>
                    <td style={{ fontWeight: 600 }}>Round {d.round}</td>
                    <td>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{d.cwnd}</strong>
                    </td>
                    <td style={{ color: '#f87171' }}>{d.ssthresh}</td>
                    <td>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor:
                            d.phase.includes('Slow Start')
                              ? 'rgba(56, 189, 248, 0.15)'
                              : d.phase.includes('Congestion')
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            d.phase.includes('Slow Start')
                              ? 'var(--accent-cyan)'
                              : d.phase.includes('Congestion')
                              ? '#34d399'
                              : '#f87171',
                        }}
                      >
                        {d.phase}
                      </span>
                    </td>
                    <td>{d.throughput} Mbps</td>
                    <td style={{ color: d.event ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                      {d.event || 'Window normal progression'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* UDP Datagram Stream Visualizer */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="card-title">
                <Activity size={18} color="var(--accent-amber)" />
                <span>UDP Datagram Stream &amp; Packet Loss Profile</span>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: udpDataSource === 'backend' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                  color: udpDataSource === 'backend' ? '#34d399' : 'var(--accent-amber)',
                  border: `1px solid ${udpDataSource === 'backend' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.25)'}`,
                  fontWeight: 600,
                }}
              >
                {udpDataSource === 'backend' ? 'Backend Stream' : 'Engine: Standalone (Stateless UDP)'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Connectionless datagram transmission with no retransmission, no flow control, and no window throttling
            </div>
          </div>

          <button
            onClick={handleRunUdp}
            className="btn btn-sm btn-primary"
            disabled={isUdpLoading}
          >
            <Play size={13} /> {isUdpLoading ? 'Transmitting...' : 'Transmit Datagram Burst'}
          </button>
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Datagram Count:</span>
              <input
                type="number"
                value={udpPacketsCount}
                min="5"
                max="40"
                onChange={(e) => setUdpPacketsCount(Number(e.target.value))}
                className="input-field"
                style={{ width: '55px', fontSize: '0.8rem', padding: '4px 6px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Simulated Loss Rate:</span>
              <input
                type="number"
                value={udpLossRate}
                min="0"
                max="40"
                onChange={(e) => setUdpLossRate(Number(e.target.value))}
                className="input-field"
                style={{ width: '55px', fontSize: '0.8rem', padding: '4px 6px' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            Best-effort stateless delivery — packets arriving out of order or dropped are never retransmitted
          </span>
        </div>

        {/* UDP Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Datagrams Sent</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginTop: '2px' }}>
              {udpResult.totalSent}
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Successfully Delivered</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
              {udpResult.delivered}{' '}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({Math.round((udpResult.delivered / udpResult.totalSent) * 100)}%)
              </span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dropped Datagrams</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: udpResult.dropped > 0 ? '#f87171' : '#34d399', marginTop: '2px' }}>
              {udpResult.dropped}{' '}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({udpResult.lossPercent}%)
              </span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Congestion Control</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '4px' }}>
              None (Unthrottled)
            </div>
          </div>
        </div>

        {/* Datagram Pills Matrix */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Datagram Sequence Transmission Map (Click or hover to inspect individual packet outcomes):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {udpResult.packets.map((pkt) => {
              const isDelivered = pkt.status === 'DELIVERED';
              return (
                <div
                  key={pkt.seq}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${isDelivered ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: isDelivered ? '#34d399' : '#f87171',
                    cursor: 'default',
                    transition: 'all 0.15s ease',
                  }}
                  title={`UDP Datagram #${pkt.seq}\nStatus: ${pkt.status}\nLatency: ${pkt.latency}ms\nJitter: ${pkt.jitter}ms\n${pkt.note}`}
                >
                  {pkt.seq}
                </div>
              );
            })}
          </div>
        </div>

        {/* Datagram Details Table */}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            UDP Datagram Telemetry Stream
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <table className="table" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th>Seq #</th>
                  <th>Delivery Status</th>
                  <th>Latency</th>
                  <th>Jitter</th>
                  <th>Transport Handling</th>
                </tr>
              </thead>
              <tbody>
                {udpResult.packets.map((pkt) => {
                  const isDelivered = pkt.status === 'DELIVERED';
                  return (
                    <tr key={pkt.seq}>
                      <td style={{ fontWeight: 600 }}>Datagram #{pkt.seq}</td>
                      <td>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isDelivered ? '#34d399' : '#f87171',
                          }}
                        >
                          {pkt.status}
                        </span>
                      </td>
                      <td>{isDelivered ? `${pkt.latency} ms` : '—'}</td>
                      <td>{isDelivered ? `${pkt.jitter > 0 ? '+' : ''}${pkt.jitter} ms` : '—'}</td>
                      <td style={{ color: isDelivered ? 'var(--text-secondary)' : '#fca5a5' }}>
                        {pkt.note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

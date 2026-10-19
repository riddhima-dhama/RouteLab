import React, { useState, useEffect, useRef } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import PacketTraceTable from '../components/PacketTraceTable.jsx';
import { buildPacketTraceSteps } from '../engine/packetSimulator.js';
import api from '../services/api.js';
import { Play, RotateCcw, Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function PacketSimulatorPage() {
  const { routers, bgpResult, addLog, backendStatus } = useNetwork();

  // Parameters
  const [sourceRouter, setSourceRouter] = useState('R1');
  const [destRouter, setDestRouter] = useState('R6');
  const [initialTtl, setInitialTtl] = useState(64);

  // Runtime State
  const [simState, setSimState] = useState('IDLE'); // 'IDLE' | 'RUNNING' | 'COMPLETED'
  const [activeHopIndex, setActiveHopIndex] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [traceResult, setTraceResult] = useState(null);
  const [animatedPos, setAnimatedPos] = useState(null);

  const timerRef = useRef(null);

  const routerCoords = useRef(new Map());
  useEffect(() => {
    const map = new Map();
    routers.forEach((r) => map.set(r.id, { x: r.x, y: r.y }));
    routerCoords.current = map;
  }, [routers]);

  const generateTracePlan = async () => {
    if (backendStatus.connected) {
      try {
        const backendRes = await api.simulatePacket({
          sourceRouter,
          destRouter,
          ttl: initialTtl,
          packetSize: 1400,
          activeRoute: bgpResult?.bestRoute,
        });
        if (backendRes && backendRes.steps) return backendRes;
      } catch (err) {
        console.warn('[RouteLab] Backend packet simulate fallback:', err.message);
      }
    }

    return buildPacketTraceSteps({
      packetId: 1,
      sourceRouter,
      destRouter,
      initialTtl,
      packetSize: 1400,
      activeRoute: bgpResult?.bestRoute,
      routers,
    });
  };

  const startSimulation = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const trace = await generateTracePlan();
    setTraceResult(trace);
    setCompletedSteps([]);
    setActiveHopIndex(0);
    setSimState('RUNNING');
    addLog('PACKET_START', `Packet trace: ${sourceRouter} → ${destRouter} (TTL: ${initialTtl})`, 'PACKET', 'info');
  };

  const resetSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSimState('IDLE');
    setActiveHopIndex(null);
    setCompletedSteps([]);
    setTraceResult(null);
    setAnimatedPos(null);
  };

  useEffect(() => {
    if (simState === 'RUNNING' && traceResult) {
      timerRef.current = setInterval(() => {
        setActiveHopIndex((currentIdx) => {
          if (currentIdx === null || currentIdx >= traceResult.steps.length) {
            setSimState('COMPLETED');
            clearInterval(timerRef.current);
            return currentIdx;
          }

          const currentStep = traceResult.steps[currentIdx];
          const coords = routerCoords.current.get(currentStep.routerId);
          if (coords) {
            setAnimatedPos({ x: coords.x, y: coords.y, routerId: currentStep.routerId });
          }

          setCompletedSteps((prev) => {
            if (prev.some((s) => s.hopIndex === currentStep.hopIndex)) return prev;
            return [...prev, currentStep];
          });

          if (currentIdx + 1 >= traceResult.steps.length) {
            setSimState('COMPLETED');
            clearInterval(timerRef.current);
            return currentIdx + 1;
          }

          return currentIdx + 1;
        });
      }, 700);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [simState, traceResult]);

  const outcome = traceResult?.outcome;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header & Controls Strip */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} color="var(--accent-blue)" />
              <h1 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Packet Trace Simulator</h1>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Step-by-step IP packet forwarding, TTL decrementing, and next-hop resolution over the active BGP path.
            </p>
          </div>

          {/* Form Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
              <select
                value={sourceRouter}
                onChange={(e) => setSourceRouter(e.target.value)}
                disabled={simState === 'RUNNING'}
                className="select-field"
                style={{ padding: '3px 8px', fontSize: '0.78rem' }}
              >
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>{r.id} ({r.asId})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
              <select
                value={destRouter}
                onChange={(e) => setDestRouter(e.target.value)}
                disabled={simState === 'RUNNING'}
                className="select-field"
                style={{ padding: '3px 8px', fontSize: '0.78rem' }}
              >
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>{r.id} ({r.asId})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TTL:</span>
              <input
                type="number"
                min="1"
                max="128"
                value={initialTtl}
                onChange={(e) => setInitialTtl(Math.max(1, Number(e.target.value)))}
                disabled={simState === 'RUNNING'}
                className="input-field"
                style={{ width: '50px', padding: '3px 6px', fontSize: '0.78rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setInitialTtl(64)}
                disabled={simState === 'RUNNING'}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                title="Standard initial TTL"
              >
                TTL=64
              </button>
              <button
                onClick={() => setInitialTtl(2)}
                disabled={simState === 'RUNNING'}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                title="Set low TTL to demonstrate ICMP Time Exceeded drop"
              >
                TTL=2
              </button>
            </div>

            <button
              onClick={startSimulation}
              disabled={simState === 'RUNNING'}
              className="btn btn-sm btn-primary"
            >
              <Play size={13} /> {simState === 'RUNNING' ? 'Tracing...' : 'Start Trace'}
            </button>

            <button
              onClick={resetSimulation}
              className="btn btn-sm btn-outline"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Outcome Banner (if trace finished) */}
      {simState === 'COMPLETED' && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor:
              outcome === 'DELIVERED'
                ? 'rgba(16, 185, 129, 0.12)'
                : outcome === 'TTL_EXPIRED'
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${
              outcome === 'DELIVERED'
                ? 'rgba(16, 185, 129, 0.3)'
                : outcome === 'TTL_EXPIRED'
                ? 'rgba(245, 158, 11, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
            color:
              outcome === 'DELIVERED'
                ? '#a7f3d0'
                : outcome === 'TTL_EXPIRED'
                ? '#fde68a'
                : '#fca5a5',
          }}
        >
          {outcome === 'DELIVERED' ? (
            <CheckCircle2 size={16} color="#10b981" />
          ) : outcome === 'TTL_EXPIRED' ? (
            <AlertTriangle size={16} color="#f59e0b" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          )}

          <div>
            <strong>
              {outcome === 'DELIVERED' && 'Packet Delivered Successfully'}
              {outcome === 'TTL_EXPIRED' && 'Packet Dropped: TTL Expired in Transit (ICMP Time Exceeded)'}
              {outcome === 'DROPPED' && 'Packet Dropped: Link Failure / Dead Next-Hop'}
              {outcome === 'DEST_UNREACHABLE' && 'Destination Network Unreachable (No Loc-RIB Entry)'}
            </strong>
            <span style={{ marginLeft: '6px' }}>
              {outcome === 'DELIVERED' && `Reached ${destRouter} in ${completedSteps.length - 1} hops (Total delay: ${completedSteps[completedSteps.length - 1]?.cumulativeDelayMs || 0} ms).`}
              {outcome === 'TTL_EXPIRED' && `TTL decremented to 0 at hop ${completedSteps.length}. Router discarded packet and returned ICMP Type 11.`}
              {outcome === 'DROPPED' && `Severed link encountered along forwarding path. Ingress buffer dropped frame.`}
              {outcome === 'DEST_UNREACHABLE' && `No active BGP route available to target Autonomous System.`}
            </span>
          </div>
        </div>
      )}

      {/* Path Visualization Canvas */}
      <NetworkTopology
        height="380px"
        allowEdit={false}
        animatedPacketPos={animatedPos}
      />

      {/* Hop-by-Hop Trace Table */}
      <PacketTraceTable
        steps={completedSteps}
        currentActiveHop={activeHopIndex !== null ? activeHopIndex + 1 : null}
        packetId={1}
      />
    </div>
  );
}

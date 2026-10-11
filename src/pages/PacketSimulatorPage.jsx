import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import PacketTraceTable from '../components/PacketTraceTable.jsx';
import { buildPacketTraceSteps } from '../engine/packetSimulator.js';
import {
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

export default function PacketSimulatorPage() {
  const { routers, bgpResult, addLog, notify } = useNetwork();

  // Simulation Parameters
  const [sourceRouter, setSourceRouter] = useState('R1');
  const [destRouter, setDestRouter] = useState('R6');
  const [initialTtl, setInitialTtl] = useState(64);

  // Runtime State
  const [simState, setSimState] = useState('IDLE'); // 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  const [activeHopIndex, setActiveHopIndex] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [traceResult, setTraceResult] = useState(null);
  const [animatedPos, setAnimatedPos] = useState(null);

  const timerRef = useRef(null);

  const routerCoords = useMemo(() => {
    const map = new Map();
    routers.forEach((r) => map.set(r.id, { x: r.x, y: r.y }));
    return map;
  }, [routers]);

  const generateTracePlan = () => {
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

  const startSimulation = () => {
    const trace = generateTracePlan();
    setTraceResult(trace);
    setCompletedSteps([]);
    setActiveHopIndex(0);
    setSimState('RUNNING');
    addLog('PACKET_START', `Packet trace: ${sourceRouter} → ${destRouter} (TTL: ${initialTtl})`, 'PACKET', 'info');
  };

  const pauseSimulation = () => {
    setSimState('PAUSED');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resumeSimulation = () => {
    setSimState('RUNNING');
  };

  const resetSimulation = () => {
    setSimState('IDLE');
    setActiveHopIndex(null);
    setCompletedSteps([]);
    setTraceResult(null);
    setAnimatedPos(null);
    if (timerRef.current) clearInterval(timerRef.current);
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
          setCompletedSteps((prev) => {
            if (prev.some((s) => s.hopIndex === currentStep.hopIndex)) return prev;
            return [...prev, currentStep];
          });

          const coords = routerCoords.get(currentStep.routerId);
          if (coords) setAnimatedPos(coords);

          if (currentIdx + 1 >= traceResult.steps.length) {
            setSimState('COMPLETED');
            clearInterval(timerRef.current);
            if (traceResult.status === 'DELIVERED') {
              notify(`Packet delivered to ${destRouter} in ${traceResult.totalDelayMs}ms`, 'success');
            } else {
              notify(`Packet dropped: ${traceResult.reason}`, 'error');
            }
            return currentIdx;
          }

          return currentIdx + 1;
        });
      }, 850);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simState, traceResult, destRouter, routerCoords, notify, addLog]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Clean Controls Card */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Packet Simulator</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Simulate packet forwarding along the selected route with TTL decrement.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {simState === 'IDLE' && (
              <button onClick={startSimulation} className="btn btn-primary btn-sm">
                <Play size={14} /> Start Simulation
              </button>
            )}

            {simState === 'RUNNING' && (
              <button onClick={pauseSimulation} className="btn btn-secondary btn-sm">
                <Pause size={14} /> Pause
              </button>
            )}

            {simState === 'PAUSED' && (
              <button onClick={resumeSimulation} className="btn btn-primary btn-sm">
                <Play size={14} /> Resume
              </button>
            )}

            {simState === 'COMPLETED' && (
              <button onClick={startSimulation} className="btn btn-primary btn-sm">
                <Play size={14} /> Re-run
              </button>
            )}

            <button onClick={resetSimulation} className="btn btn-outline btn-sm">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Minimal Inputs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source:</span>
            <select
              value={sourceRouter}
              onChange={(e) => setSourceRouter(e.target.value)}
              disabled={simState === 'RUNNING'}
              className="select-field"
            >
              {routers.map((r) => (
                <option key={r.id} value={r.id}>{r.id} ({r.asId})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Destination:</span>
            <select
              value={destRouter}
              onChange={(e) => setDestRouter(e.target.value)}
              disabled={simState === 'RUNNING'}
              className="select-field"
            >
              {routers.map((r) => (
                <option key={r.id} value={r.id}>{r.id} ({r.asId})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TTL:</span>
            <input
              type="number"
              value={initialTtl}
              min="1"
              max="255"
              onChange={(e) => setInitialTtl(Math.max(1, Number(e.target.value)))}
              disabled={simState === 'RUNNING'}
              className="input-field"
              style={{ width: '60px' }}
            />
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Path: <span className="text-mono" style={{ color: '#60a5fa' }}>{bgpResult?.bestRoute?.asPath.join(' → ') || 'No Route'}</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="card" style={{ padding: '12px' }}>
        <NetworkTopology
          height="340px"
          allowEdit={false}
          animatedPacketPos={animatedPos}
        />
      </div>

      {/* Trace Table */}
      <PacketTraceTable
        steps={completedSteps}
        currentActiveHop={activeHopIndex !== null ? activeHopIndex + 1 : null}
        packetId={1}
      />
    </div>
  );
}

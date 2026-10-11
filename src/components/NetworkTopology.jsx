import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  AlertOctagon,
  X,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext.jsx';
import { formatBandwidth } from '../utils/calculations.js';

export default function NetworkTopology({
  animatedPacketPos = null, // { x, y, routerId } when packet simulator is running
  height = '580px',
  allowEdit = true,
}) {
  const {
    ases,
    routers,
    links,
    bgpResult,
    selectedElement,
    setSelectedElement,
    toggleLinkStatus,
    updateLinkRelationship,
    updateAsRole,
    deleteRouter,
    deleteLink,
    addRouter,
    addLink,
  } = useNetwork();

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Add Element Dialog states
  const [showAddRouter, setShowAddRouter] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newRouterAs, setNewRouterAs] = useState('AS1');
  const [newRouterName, setNewRouterName] = useState('');
  const [newLinkFrom, setNewLinkFrom] = useState('R1');
  const [newLinkTo, setNewLinkTo] = useState('R3');
  const [newLinkRel, setNewLinkRel] = useState('peer-peer');

  const svgRef = useRef(null);

  // Determine active route router IDs and link IDs
  const bestRoute = bgpResult?.bestRoute;
  const activeRouterIds = new Set(bestRoute?.routerPath || []);
  const activeLinkIds = new Set((bestRoute?.traversedLinks || []).map((l) => l.id));

  // Determine alternative routes links
  const altLinkIds = new Set();
  (bgpResult?.validRoutes || [])
    .filter((r) => !r.isBest)
    .forEach((r) => {
      (r.traversedLinks || []).forEach((l) => altLinkIds.add(l.id));
    });

  // Pan handling
  const handleMouseDown = (e) => {
    // Only drag if left click and not clicked on an interactive SVG element
    if (e.button === 0 && e.target.tagName === 'svg' || e.target.id === 'topology-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.5, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Find router coords lookup
  const routerCoords = new Map();
  routers.forEach((r) => {
    routerCoords.set(r.id, { x: r.x, y: r.y, router: r });
  });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Topology Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(19, 28, 49, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => handleZoom(0.15)}
          className="btn btn-sm btn-outline"
          title="Zoom In"
          style={{ padding: '4px 8px' }}
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="btn btn-sm btn-outline"
          title="Zoom Out"
          style={{ padding: '4px 8px' }}
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={resetView}
          className="btn btn-sm btn-outline"
          title="Reset View"
          style={{ padding: '4px 8px' }}
        >
          <Maximize2 size={15} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        {allowEdit && (
          <>
            <button
              onClick={() => setShowAddRouter(!showAddRouter)}
              className="btn btn-sm btn-secondary"
              title="Add Router"
              style={{ fontSize: '0.78rem' }}
            >
              <Plus size={14} /> Add Router
            </button>
            <button
              onClick={() => setShowAddLink(!showAddLink)}
              className="btn btn-sm btn-secondary"
              title="Add Link"
              style={{ fontSize: '0.78rem' }}
            >
              <Plus size={14} /> Add Link
            </button>
          </>
        )}
      </div>

      {/* Minimal Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '14px',
          zIndex: 20,
          backgroundColor: 'rgba(17, 24, 39, 0.85)',
          padding: '5px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#3b82f6', display: 'inline-block' }} />
          <span>Active Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#64748b', display: 'inline-block' }} />
          <span>Available Link</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#ef4444', borderTop: '2px dashed #ef4444', display: 'inline-block' }} />
          <span style={{ color: '#ef4444' }}>Link Down</span>
        </div>
      </div>

      {/* Main Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        id="topology-bg"
        width="100%"
        height="100%"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
          </pattern>

          {/* Glowing Filter for Selected Route */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Pan and Zoom Transform Container */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. AS Bounding Containers */}
          {ases.map((as) => (
            <g key={as.id}>
              {/* AS Box */}
              <rect
                x={as.x}
                y={as.y}
                width={as.width}
                height={as.height}
                rx={12}
                fill="rgba(19, 28, 49, 0.45)"
                stroke={as.color}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedElement({ type: 'AS', data: as })}
              />

              {/* AS Label Header Pill */}
              <rect
                x={as.x + 8}
                y={as.y + 8}
                width={as.width - 16}
                height={26}
                rx={6}
                fill="rgba(8, 12, 20, 0.85)"
                stroke="rgba(255, 255, 255, 0.1)"
              />
              <text
                x={as.x + 14}
                y={as.y + 25}
                fill={as.color}
                fontSize={12}
                fontWeight={700}
                fontFamily="var(--font-mono)"
              >
                {as.id} • AS{as.asn}
              </text>
              <text
                x={as.x + as.width - 14}
                y={as.y + 25}
                fill="var(--text-muted)"
                fontSize={10}
                textAnchor="end"
                fontFamily="var(--font-mono)"
              >
                {as.type}
              </text>

              {/* AS Prefix Footer Tag */}
              <text
                x={as.x + 14}
                y={as.y + as.height - 10}
                fill="var(--text-muted)"
                fontSize={10}
                fontFamily="var(--font-mono)"
              >
                Prefix: {as.prefix}
              </text>
            </g>
          ))}

          {/* 2. Links */}
          {links.map((link) => {
            const from = routerCoords.get(link.fromRouter);
            const to = routerCoords.get(link.toRouter);
            if (!from || !to) return null;

            const isBest = activeLinkIds.has(link.id);
            const isAlt = altLinkIds.has(link.id);
            const isFailed = link.status === 'FAILED';
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            // Link color based on status and relationship
            let strokeColor = '#475569';
            let strokeWidth = 2.5;

            if (isFailed) {
              strokeColor = '#ef4444';
              strokeWidth = 3;
            } else if (isBest) {
              strokeColor = '#38bdf8';
              strokeWidth = 4;
            } else if (isAlt) {
              strokeColor = '#818cf8';
              strokeWidth = 2.5;
            } else if (link.relationship === 'peer-peer') {
              strokeColor = '#ec4899';
            } else if (link.relationship === 'provider-customer') {
              strokeColor = '#a855f7';
            } else if (link.relationship === 'customer-provider') {
              strokeColor = '#38bdf8';
            } else if (link.relationship === 'internal') {
              strokeColor = '#10b981';
            } else if (link.relationship === 'unassigned') {
              strokeColor = '#64748b';
            }

            const isUnassigned = link.relationship === 'unassigned';
            const dashArray = isFailed ? '6 4' : isUnassigned ? '5 5' : 'none';

            return (
              <g key={link.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedElement({ type: 'LINK', data: link })}>
                {/* Background Line for easier clicking */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="transparent"
                  strokeWidth={20}
                />

                {/* Base Link Line */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeOpacity={isFailed ? 1 : isBest ? 1 : isUnassigned ? 0.6 : 0.75}
                />

                {/* Animated Dash for BGP Selected Best Route */}
                {isBest && !isFailed && (
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#38bdf8"
                    strokeWidth={4}
                    className="flow-active-route"
                    filter="url(#glow-cyan)"
                  />
                )}

                {/* Link Badge in the Middle */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-46}
                    y={-12}
                    width={92}
                    height={22}
                    rx={6}
                    fill={isFailed ? '#450a0a' : isBest ? '#082f49' : 'rgba(15, 23, 42, 0.9)'}
                    stroke={isFailed ? '#ef4444' : isBest ? '#38bdf8' : isUnassigned ? '#64748b' : 'var(--border-subtle)'}
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={2}
                    fill={isFailed ? '#fca5a5' : isBest ? '#38bdf8' : isUnassigned ? '#94a3b8' : 'var(--text-secondary)'}
                    fontSize={10}
                    fontWeight={600}
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    {isFailed ? 'CUT / DOWN' : isUnassigned ? 'UNASSIGNED' : `${link.latencyMs}ms • C:${link.ospfCost}`}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 3. Routers */}
          {routers.map((router) => {
            const isBest = activeRouterIds.has(router.id);
            const isSelected = selectedElement?.data?.id === router.id;

            return (
              <g
                key={router.id}
                transform={`translate(${router.x}, ${router.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedElement({ type: 'ROUTER', data: router })}
              >
                {/* Router Glow Ring if in active path or selected */}
                {isBest && (
                  <circle
                    r={24}
                    fill="none"
                    stroke="var(--accent-cyan)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    className="flow-active-route"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={18}
                  fill={isSelected ? 'var(--accent-cyan)' : isBest ? '#0284c7' : 'var(--bg-surface)'}
                  stroke={isSelected ? '#ffffff' : isBest ? '#38bdf8' : 'var(--border-strong)'}
                  strokeWidth={2}
                  filter={isBest ? 'url(#glow-cyan)' : 'none'}
                />

                {/* Server / Router Icon */}
                <circle r={8} fill="rgba(255, 255, 255, 0.15)" />
                <text
                  x={0}
                  y={4}
                  fill={isBest || isSelected ? '#ffffff' : 'var(--text-primary)'}
                  fontSize={11}
                  fontWeight={700}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {router.id}
                </text>

                {/* Router Name / IP Label under node */}
                <rect
                  x={-45}
                  y={22}
                  width={90}
                  height={18}
                  rx={4}
                  fill="rgba(8, 12, 20, 0.85)"
                  stroke="rgba(255, 255, 255, 0.08)"
                />
                <text
                  x={0}
                  y={34}
                  fill="var(--text-secondary)"
                  fontSize={9}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {router.ip}
                </text>
              </g>
            );
          })}

          {/* 4. Animated Packet Marker in Flight (during simulation) */}
          {animatedPacketPos && (
            <g transform={`translate(${animatedPacketPos.x}, ${animatedPacketPos.y})`}>
              <circle r={14} fill="var(--accent-amber)" opacity={0.3}>
                <animate attributeName="r" values="8;18;8" dur="1s" repeatCount="indefinite" />
              </circle>
              <circle r={9} fill="var(--accent-amber)" stroke="#fff" strokeWidth={2} />
              <text x={0} y={3} fill="#000" fontSize={8} fontWeight={900} textAnchor="middle">
                IP
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* Side Inspector Drawer */}
      {selectedElement && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '320px',
            height: '100%',
            backgroundColor: 'rgba(13, 20, 36, 0.95)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid var(--border-subtle)',
            padding: '20px',
            zIndex: 30,
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            animation: 'slide-left 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-cyan">{selectedElement.type}</span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>
                {selectedElement.data.id || selectedElement.data.name}
              </span>
            </div>
            <button
              onClick={() => setSelectedElement(null)}
              className="btn btn-sm btn-outline"
              style={{ padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ROUTER INSPECTION */}
          {selectedElement.type === 'ROUTER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Autonomous System:</span>
                <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  {selectedElement.data.asId}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Management IPv4:</span>
                <div className="text-mono" style={{ color: '#f8fafc' }}>{selectedElement.data.ip}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>BGP Router ID / Loopback:</span>
                <div className="text-mono" style={{ color: '#f8fafc' }}>{selectedElement.data.loopback}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>IGP Interior Routing:</span>
                <div style={{ color: '#10b981' }}>OSPF Area {selectedElement.data.ospfArea}</div>
              </div>

              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>BGP RIB Status:</span>
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                  }}
                >
                  {activeRouterIds.has(selectedElement.data.id) ? (
                    <div style={{ color: 'var(--accent-cyan)' }}>
                      ✓ Installed in active forwarding FIB for {bgpResult?.destAsId}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Idle border router (standby path)</div>
                  )}
                </div>
              </div>

              {allowEdit && (
                <button
                  onClick={() => {
                    deleteRouter(selectedElement.data.id);
                    setSelectedElement(null);
                  }}
                  className="btn btn-sm btn-danger"
                  style={{ marginTop: '10px' }}
                >
                  <Trash2 size={14} /> Decommission Router
                </button>
              )}
            </div>
          )}

          {/* LINK INSPECTION */}
          {selectedElement.type === 'LINK' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Link Endpoints:</span>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                  {selectedElement.data.fromRouter} ({selectedElement.data.fromAs}) ↔{' '}
                  {selectedElement.data.toRouter} ({selectedElement.data.toAs})
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Physical State:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span
                    className={`status-dot ${selectedElement.data.status === 'ACTIVE' ? 'healthy' : 'failed'}`}
                  />
                  <span style={{ fontWeight: 600, color: selectedElement.data.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}>
                    {selectedElement.data.status}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Commercial Relationship:</span>
                <select
                  value={selectedElement.data.relationship}
                  onChange={(e) => {
                    const newRel = e.target.value;
                    updateLinkRelationship(selectedElement.data.id, newRel);
                    setSelectedElement({
                      ...selectedElement,
                      data: { ...selectedElement.data, relationship: newRel },
                    });
                  }}
                  className="select-field"
                  style={{ width: '100%', marginTop: '4px', fontSize: '0.82rem' }}
                >
                  <option value="unassigned">⚠️ Unassigned (Not Set)</option>
                  <option value="customer-provider">🔹 {selectedElement.data.fromAs} (Cust) → {selectedElement.data.toAs} (Prov)</option>
                  <option value="provider-customer">🔹 {selectedElement.data.toAs} (Cust) → {selectedElement.data.fromAs} (Prov)</option>
                  <option value="peer-peer">🔄 {selectedElement.data.fromAs} ↔ {selectedElement.data.toAs} (Peers)</option>
                  {selectedElement.data.fromAs === selectedElement.data.toAs && (
                    <option value="internal">🔒 Internal IGP Link (OSPF)</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LATENCY</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{selectedElement.data.latencyMs} ms</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BANDWIDTH</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{formatBandwidth(selectedElement.data.bandwidthMbps)}</div>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Intra-AS OSPF Metric:</span>
                <div className="text-mono" style={{ color: '#f8fafc' }}>Cost: {selectedElement.data.ospfCost}</div>
              </div>

              {/* Action: Toggle failure */}
              <button
                onClick={() => toggleLinkStatus(selectedElement.data.id)}
                className={`btn btn-sm ${selectedElement.data.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                style={{ marginTop: '10px' }}
              >
                <AlertOctagon size={14} />
                <span>{selectedElement.data.status === 'ACTIVE' ? 'Fail Link (Simulate Cable Cut)' : 'Restore Link'}</span>
              </button>

              {allowEdit && (
                <button
                  onClick={() => {
                    deleteLink(selectedElement.data.id);
                    setSelectedElement(null);
                  }}
                  className="btn btn-sm btn-outline"
                >
                  <Trash2 size={14} /> Delete Link
                </button>
              )}
            </div>
          )}

          {/* AS INSPECTION */}
          {selectedElement.type === 'AS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Autonomous System Name:</span>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedElement.data.name}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>BGP ASN:</span>
                <div className="text-mono" style={{ color: selectedElement.data.color, fontWeight: 700 }}>
                  AS{selectedElement.data.asn}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Originated IP Prefix:</span>
                <div className="text-mono" style={{ color: '#f8fafc' }}>{selectedElement.data.prefix}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Role (Customer / Peer / Provider):</span>
                <select
                  value={selectedElement.data.type}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    updateAsRole(selectedElement.data.id, newRole);
                    setSelectedElement({
                      ...selectedElement,
                      data: { ...selectedElement.data, type: newRole },
                    });
                  }}
                  className="select-field"
                  style={{ width: '100%', marginTop: '4px', fontSize: '0.82rem' }}
                >
                  <option value="Unassigned">Unassigned (Not Set)</option>
                  <option value="Customer">Customer (Stub / Edge)</option>
                  <option value="Provider">Provider (Regional Transit ISP)</option>
                  <option value="Tier-1">Tier-1 Provider (Global Backbone)</option>
                  <option value="Peer">Peer (IXP / Transit-Free)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Router Modal / Overlay */}
      {showAddRouter && (
        <div
          style={{
            position: 'absolute',
            top: '64px',
            left: '16px',
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            zIndex: 40,
            width: '280px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '10px', fontSize: '0.9rem' }}>Add New Router</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select AS</label>
              <select
                value={newRouterAs}
                onChange={(e) => setNewRouterAs(e.target.value)}
                className="select-field"
                style={{ width: '100%', marginTop: '4px' }}
              >
                {ases.map((a) => (
                  <option key={a.id} value={a.id}>{a.id} (AS{a.asn})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Router Name / ID</label>
              <input
                type="text"
                value={newRouterName}
                placeholder="e.g. R7"
                onChange={(e) => setNewRouterName(e.target.value)}
                className="input-field"
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => {
                  const targetAs = ases.find((a) => a.id === newRouterAs);
                  const id = newRouterName.trim() || `R${routers.length + 1}`;
                  addRouter({
                    id,
                    name: `${id} (Custom)`,
                    asId: newRouterAs,
                    ip: `10.${routers.length + 1}.0.1`,
                    loopback: `${routers.length + 1}.${routers.length + 1}.${routers.length + 1}.1`,
                    ospfArea: '0.0.0.0',
                    x: (targetAs?.x || 300) + 50,
                    y: (targetAs?.y || 200) + 60,
                    status: 'ACTIVE',
                  });
                  setShowAddRouter(false);
                  setNewRouterName('');
                }}
                className="btn btn-sm btn-primary"
                style={{ flex: 1 }}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddRouter(false)}
                className="btn btn-sm btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Modal / Overlay */}
      {showAddLink && (
        <div
          style={{
            position: 'absolute',
            top: '64px',
            left: '16px',
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            zIndex: 40,
            width: '290px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '10px', fontSize: '0.9rem' }}>Create Inter-Domain Link</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From</label>
                <select
                  value={newLinkFrom}
                  onChange={(e) => setNewLinkFrom(e.target.value)}
                  className="select-field"
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  {routers.map((r) => (
                    <option key={r.id} value={r.id}>{r.id} ({r.asId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To</label>
                <select
                  value={newLinkTo}
                  onChange={(e) => setNewLinkTo(e.target.value)}
                  className="select-field"
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  {routers.map((r) => (
                    <option key={r.id} value={r.id}>{r.id} ({r.asId})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Relationship</label>
              <select
                value={newLinkRel}
                onChange={(e) => setNewLinkRel(e.target.value)}
                className="select-field"
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="unassigned">⚠️ Unassigned (Configure Later)</option>
                <option value="peer-peer">🔄 Peer ↔ Peer</option>
                <option value="customer-provider">🔹 From AS is Customer ➔ To AS is Provider</option>
                <option value="provider-customer">🔹 To AS is Customer ➔ From AS is Provider</option>
                <option value="internal">🔒 Internal IGP (OSPF)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => {
                  const r1 = routers.find((r) => r.id === newLinkFrom);
                  const r2 = routers.find((r) => r.id === newLinkTo);
                  if (r1 && r2 && r1.id !== r2.id) {
                    addLink({
                      id: `L-${r1.id}-${r2.id}-${Date.now() % 1000}`,
                      fromRouter: r1.id,
                      toRouter: r2.id,
                      fromAs: r1.asId,
                      toAs: r2.asId,
                      relationship: newLinkRel,
                      status: 'ACTIVE',
                      bandwidthMbps: 1000,
                      latencyMs: 15,
                      ospfCost: 10,
                      label: `${r1.asId} ↔ ${r2.asId}`,
                    });
                    setShowAddLink(false);
                  }
                }}
                className="btn btn-sm btn-primary"
                style={{ flex: 1 }}
              >
                Establish Link
              </button>
              <button
                onClick={() => setShowAddLink(false)}
                className="btn btn-sm btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

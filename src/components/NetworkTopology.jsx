import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Plus,
  Trash2,
  AlertOctagon,
  X,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext.jsx';
import { formatBandwidth } from '../utils/calculations.js';

export default function NetworkTopology({
  animatedPacketPos = null, // { x, y, routerId } when packet simulator is running
  height = '560px',
  allowEdit = true,
}) {
  const {
    ases,
    routers,
    links,
    sourceAs,
    destAs,
    bgpResult,
    selectedElement,
    setSelectedElement,
    toggleLinkStatus,
    updateLinkRelationship,
    updateAsRole,
    updateRouterPosition,
    deleteRouter,
    deleteLink,
    addRouter,
    addLink,
  } = useNetwork();

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeDraggingId, setActiveDraggingId] = useState(null);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  // Add Element Dialog states
  const [showAddRouter, setShowAddRouter] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newRouterAs, setNewRouterAs] = useState('AS1');
  const [newRouterName, setNewRouterName] = useState('');
  const [newLinkFrom, setNewLinkFrom] = useState('R1');
  const [newLinkTo, setNewLinkTo] = useState('R3');
  const [newLinkRel, setNewLinkRel] = useState('peer-peer');

  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const pointerStartRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0, hasMoved: false, target: null });
  const draggedRouterRef = useRef(null);

  // Determine active route router IDs and link IDs
  const bestRoute = bgpResult?.bestRoute;
  const activeRouterIds = new Set(bestRoute?.routerPath || []);
  const activeLinkIds = new Set((bestRoute?.traversedLinks || []).map((l) => l.id));

  // Determine source and destination routers
  const sourceRouterId =
    bestRoute?.routerPath?.[0] || routers.find((r) => r.asId === sourceAs)?.id || 'R1';
  const destRouterId =
    bestRoute?.routerPath?.[bestRoute.routerPath.length - 1] ||
    routers.find((r) => r.asId === destAs)?.id ||
    'R6';

  // Determine alternative routes links
  const altLinkIds = new Set();
  (bgpResult?.validRoutes || [])
    .filter((r) => !r.isBest)
    .forEach((r) => {
      (r.traversedLinks || []).forEach((l) => altLinkIds.add(l.id));
    });

  // Find router coords lookup
  const routerCoords = new Map();
  routers.forEach((r) => {
    routerCoords.set(r.id, { x: r.x, y: r.y, router: r });
  });

  // Fit to screen calculation: centers and scales all AS containers & routers
  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;

    // Calculate bounding box of all ASes and routers
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    ases.forEach((as) => {
      minX = Math.min(minX, as.x);
      maxX = Math.max(maxX, as.x + as.width);
      minY = Math.min(minY, as.y);
      maxY = Math.max(maxY, as.y + as.height);
    });

    routers.forEach((r) => {
      minX = Math.min(minX, r.x - 50);
      maxX = Math.max(maxX, r.x + 50);
      minY = Math.min(minY, r.y - 40);
      maxY = Math.max(maxY, r.y + 45);
    });

    if (!isFinite(minX)) {
      minX = 100;
      maxX = 1200;
      minY = 100;
      maxY = 600;
    }

    const topologyWidth = maxX - minX;
    const topologyHeight = maxY - minY;
    const topologyCenterX = (minX + maxX) / 2;
    const topologyCenterY = (minY + maxY) / 2;

    // Available viewport space (padding for toolbar at top and legend at bottom)
    const topPadding = 60; // toolbar
    const bottomPadding = isLegendCollapsed ? 30 : 68; // legend
    const sidePadding = 40;

    const availableWidth = Math.max(200, width - sidePadding * 2);
    const availableHeight = Math.max(200, height - topPadding - bottomPadding);

    // Optimal zoom to fit both dimensions
    const scaleX = availableWidth / topologyWidth;
    const scaleY = availableHeight / topologyHeight;
    const optimalZoom = Math.min(1.15, Math.max(0.42, Math.min(scaleX, scaleY)));

    // Center topology in available area
    const targetCenterY = topPadding + availableHeight / 2;
    const targetCenterX = width / 2;

    const targetPanX = Math.round(targetCenterX - topologyCenterX * optimalZoom);
    const targetPanY = Math.round(targetCenterY - topologyCenterY * optimalZoom);

    setZoom(Math.round(optimalZoom * 100) / 100);
    setPan({ x: targetPanX, y: targetPanY });
  }, [ases, routers, isLegendCollapsed]);

  // Reset View to 1:1 scale (centered)
  const resetToOneToOne = useCallback(() => {
    const container = containerRef.current;
    const width = container ? container.clientWidth : 800;
    const height = container ? container.clientHeight : 500;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    ases.forEach((as) => {
      minX = Math.min(minX, as.x);
      maxX = Math.max(maxX, as.x + as.width);
      minY = Math.min(minY, as.y);
      maxY = Math.max(maxY, as.y + as.height);
    });

    const topologyCenterX = (minX + maxX) / 2 || 650;
    const topologyCenterY = (minY + maxY) / 2 || 350;

    setZoom(1);
    setPan({
      x: Math.round(width / 2 - topologyCenterX),
      y: Math.round(height / 2 - topologyCenterY),
    });
  }, [ases]);

  // Auto-fit on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen();
    }, 40);

    return () => clearTimeout(timer);
  }, [fitToScreen]);

  // Zoom with Center Anchor
  const handleZoom = (delta) => {
    const container = containerRef.current;
    const width = container ? container.clientWidth : 800;
    const height = container ? container.clientHeight : 500;
    const centerX = width / 2;
    const centerY = height / 2;

    setZoom((prev) => {
      const next = Math.min(2.5, Math.max(0.35, Math.round((prev + delta) * 100) / 100));
      if (next === prev) return prev;

      setPan((prevPan) => ({
        x: Math.round(centerX - (centerX - prevPan.x) * (next / prev)),
        y: Math.round(centerY - (centerY - prevPan.y) * (next / prev)),
      }));
      return next;
    });
  };

  // Wheel Zoom centered at cursor position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(2.5, Math.max(0.35, Math.round(prevZoom * zoomFactor * 100) / 100));
        if (nextZoom === prevZoom) return prevZoom;

        setPan((prevPan) => ({
          x: Math.round(cursorX - (cursorX - prevPan.x) * (nextZoom / prevZoom)),
          y: Math.round(cursorY - (cursorY - prevPan.y) * (nextZoom / prevZoom)),
        }));

        return nextZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Pointer Down (Mouse click or Touch start)
  const handleCanvasPointerDown = (e) => {
    // Only primary pointer button
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Check if clicked an interactive UI overlay (button, input, select)
    if (e.target.closest('button, select, input')) return;

    // 1. Check if clicked on a Router Node
    const routerElement = e.target.closest('[data-router-id]');
    if (routerElement) {
      const routerId = routerElement.getAttribute('data-router-id');
      const routerObj = routers.find((r) => r.id === routerId);
      if (routerObj) {
        draggedRouterRef.current = {
          id: routerId,
          pointerStartX: e.clientX,
          pointerStartY: e.clientY,
          routerStartX: routerObj.x,
          routerStartY: routerObj.y,
          hasMoved: false,
        };
        setActiveDraggingId(routerId);

        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        return;
      }
    }

    // 2. Otherwise: Canvas Panning (clicked empty grid, link, or AS bounding box)
    setIsPanning(true);
    pointerStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
      hasMoved: false,
      target: e.target,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  // Pointer Move (Mouse move or Touch drag)
  const handleCanvasPointerMove = (e) => {
    // Handling Router Node Dragging
    if (draggedRouterRef.current) {
      const dr = draggedRouterRef.current;
      const dx = (e.clientX - dr.pointerStartX) / zoom;
      const dy = (e.clientY - dr.pointerStartY) / zoom;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dr.hasMoved = true;
      }

      const newX = Math.round(dr.routerStartX + dx);
      const newY = Math.round(dr.routerStartY + dy);

      if (updateRouterPosition) {
        updateRouterPosition(dr.id, newX, newY);
      }
      return;
    }

    // Handling Canvas Panning
    if (isPanning) {
      const dx = e.clientX - pointerStartRef.current.startX;
      const dy = e.clientY - pointerStartRef.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        pointerStartRef.current.hasMoved = true;
      }

      setPan({
        x: pointerStartRef.current.panX + dx,
        y: pointerStartRef.current.panY + dy,
      });
    }
  };

  // Pointer Up / Cancel (Release drag or click)
  const handleCanvasPointerUp = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // 1. Router Node release
    if (draggedRouterRef.current) {
      const dr = draggedRouterRef.current;
      if (!dr.hasMoved) {
        // Selection click
        const r = routers.find((item) => item.id === dr.id);
        if (r) setSelectedElement({ type: 'ROUTER', data: r });
      }
      draggedRouterRef.current = null;
      setActiveDraggingId(null);
      return;
    }

    // 2. Canvas Pan release
    if (isPanning) {
      if (!pointerStartRef.current.hasMoved) {
        // Was a click, not a pan! Check if user clicked an interactive Link or AS box
        const linkElement = pointerStartRef.current.target?.closest('[data-link-id]');
        const asElement = pointerStartRef.current.target?.closest('[data-as-id]');

        if (linkElement) {
          const linkId = linkElement.getAttribute('data-link-id');
          const linkObj = links.find((l) => l.id === linkId);
          if (linkObj) setSelectedElement({ type: 'LINK', data: linkObj });
        } else if (asElement) {
          const asId = asElement.getAttribute('data-as-id');
          const asObj = ases.find((a) => a.id === asId);
          if (asObj) setSelectedElement({ type: 'AS', data: asObj });
        }
      }
      setIsPanning(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        minHeight: '380px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none', // Prevents touch conflicts with browser panning
      }}
    >
      {/* Topology Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(10px)',
          padding: '5px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <button
          onClick={() => handleZoom(0.15)}
          className="btn btn-sm btn-outline"
          title="Zoom In (+15%)"
          style={{ padding: '4px 8px' }}
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="btn btn-sm btn-outline"
          title="Zoom Out (-15%)"
          style={{ padding: '4px 8px' }}
        >
          <ZoomOut size={14} />
        </button>

        {/* Current Zoom Indicator */}
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            minWidth: '38px',
            textAlign: 'center',
            fontWeight: 600,
          }}
          title="Current Zoom Level"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={fitToScreen}
          className="btn btn-sm btn-outline"
          title="Fit Network to Viewport"
          style={{ padding: '4px 8px' }}
        >
          <Maximize2 size={14} />
        </button>

        <button
          onClick={resetToOneToOne}
          className="btn btn-sm btn-outline"
          title="Reset Zoom to 100%"
          style={{ padding: '4px 8px' }}
        >
          <RotateCcw size={14} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

        {allowEdit && (
          <>
            <button
              onClick={() => setShowAddRouter(!showAddRouter)}
              className="btn btn-sm btn-secondary"
              title="Add Router"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              <Plus size={13} /> Add Router
            </button>
            <button
              onClick={() => setShowAddLink(!showAddLink)}
              className="btn btn-sm btn-secondary"
              title="Add Link"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              <Plus size={13} /> Add Link
            </button>
          </>
        )}
      </div>

      {/* Comprehensive Topology Legend (Collapsible) */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '14px',
          right: isLegendCollapsed ? 'auto' : '14px',
          zIndex: 20,
        }}
      >
        {isLegendCollapsed ? (
          <button
            onClick={() => setIsLegendCollapsed(false)}
            className="btn btn-sm btn-outline"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.72rem',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-md)',
            }}
            title="Expand Topology Legend"
          >
            <HelpCircle size={13} color="var(--accent-cyan)" />
            <span>Show Legend</span>
          </button>
        ) : (
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '3px', backgroundColor: '#2563eb', display: 'inline-block' }} />
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>Active BGP Path</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '3px', backgroundColor: '#818cf8', display: 'inline-block' }} />
                <span>Backup / Alt Path</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '3px', backgroundColor: '#10b981', display: 'inline-block' }} />
                <span>Intra-AS (OSPF Cost)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '3px', backgroundColor: '#a855f7', display: 'inline-block' }} />
                <span>Customer/Provider</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '3px', backgroundColor: '#ec4899', display: 'inline-block' }} />
                <span>Settlement-Free Peer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '3px', borderTop: '2px dashed #ef4444', display: 'inline-block' }} />
                <span style={{ color: '#ef4444' }}>Link Cut (BGP Withdrawn)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                <span style={{ color: '#10b981', fontWeight: 600 }}>Source Router</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Destination Router</span>
              </div>
            </div>

            <button
              onClick={() => setIsLegendCollapsed(true)}
              className="btn btn-sm btn-outline"
              style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                border: 'none',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Minimize Legend"
            >
              <ChevronDown size={13} />
              <span>Hide</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        id="topology-bg"
        width="100%"
        height="100%"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: isPanning ? 'grabbing' : activeDraggingId ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" pointerEvents="none" />

        {/* Pan and Zoom Transform Container */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. AS Bounding Containers */}
          {ases.map((as) => (
            <g
              key={as.id}
              data-as-id={as.id}
              style={{ cursor: isPanning ? 'grabbing' : 'pointer' }}
            >
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

            // Link styling
            let strokeColor = '#475569';
            let strokeWidth = 2;
            let dashArray = 'none';

            if (isFailed) {
              strokeColor = '#ef4444';
              strokeWidth = 2.5;
              dashArray = '6 4';
            } else if (isBest) {
              strokeColor = '#2563eb';
              strokeWidth = 3.5;
            } else if (isAlt) {
              strokeColor = '#818cf8';
              strokeWidth = 2;
              dashArray = '5 4';
            } else if (link.relationship === 'peer-peer') {
              strokeColor = '#ec4899';
            } else if (link.relationship === 'provider-customer') {
              strokeColor = '#a855f7';
            } else if (link.relationship === 'customer-provider') {
              strokeColor = '#0284c7';
            } else if (link.relationship === 'internal') {
              strokeColor = '#10b981';
            } else if (link.relationship === 'unassigned') {
              strokeColor = '#64748b';
              dashArray = '4 4';
            }

            return (
              <g
                key={link.id}
                data-link-id={link.id}
                style={{ cursor: isPanning ? 'grabbing' : 'pointer' }}
              >
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
                  strokeOpacity={isFailed ? 1 : isBest ? 1 : 0.8}
                />

                {/* Link Badge in the Middle */}
                <g transform={`translate(${midX}, ${midY})`}>
                  {(() => {
                    const isInternal = link.relationship === 'internal';
                    let badgeText = '';
                    let badgeWidth = 110;

                    if (isFailed) {
                      badgeText = 'CUT (WITHDRAWN)';
                      badgeWidth = 120;
                    } else if (isInternal) {
                      badgeText = `OSPF Cost: ${link.ospfCost}`;
                      badgeWidth = 96;
                    } else if (link.relationship === 'customer-provider') {
                      badgeText = `Cust→Prov • ${link.latencyMs}ms`;
                      badgeWidth = 120;
                    } else if (link.relationship === 'provider-customer') {
                      badgeText = `Prov→Cust • ${link.latencyMs}ms`;
                      badgeWidth = 120;
                    } else if (link.relationship === 'peer-peer') {
                      badgeText = `Peer↔Peer • ${link.latencyMs}ms`;
                      badgeWidth = 118;
                    } else {
                      badgeText = `Unassigned • ${link.latencyMs}ms`;
                      badgeWidth = 118;
                    }

                    const badgeFill = isFailed
                      ? '#450a0a'
                      : isBest
                      ? '#082f49'
                      : isInternal
                      ? '#064e3b'
                      : 'rgba(15, 23, 42, 0.9)';
                    const badgeStroke = isFailed
                      ? '#ef4444'
                      : isBest
                      ? '#38bdf8'
                      : isInternal
                      ? '#10b981'
                      : isAlt
                      ? '#818cf8'
                      : isUnassigned
                      ? '#64748b'
                      : 'var(--border-subtle)';
                    const badgeColor = isFailed
                      ? '#fca5a5'
                      : isBest
                      ? '#38bdf8'
                      : isInternal
                      ? '#6ee7b7'
                      : isAlt
                      ? '#a5b4fc'
                      : isUnassigned
                      ? '#94a3b8'
                      : 'var(--text-secondary)';

                    return (
                      <>
                        <rect
                          x={-badgeWidth / 2}
                          y={-11}
                          width={badgeWidth}
                          height={22}
                          rx={6}
                          fill={badgeFill}
                          stroke={badgeStroke}
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={3}
                          fill={badgeColor}
                          fontSize={9.5}
                          fontWeight={600}
                          fontFamily="var(--font-mono)"
                          textAnchor="middle"
                        >
                          {badgeText}
                        </text>
                      </>
                    );
                  })()}
                </g>
              </g>
            );
          })}

          {/* 3. Routers */}
          {routers.map((router) => {
            const isBest = activeRouterIds.has(router.id);
            const isSelected = selectedElement?.data?.id === router.id;
            const isSource = router.id === sourceRouterId;
            const isDest = router.id === destRouterId;
            const isBeingDragged = activeDraggingId === router.id;

            return (
              <g
                key={router.id}
                data-router-id={router.id}
                transform={`translate(${router.x}, ${router.y})`}
                style={{ cursor: isBeingDragged ? 'grabbing' : 'grab' }}
              >
                {/* Source / Destination Indicator Tag above node */}
                {isSource && (
                  <g transform="translate(0, -28)">
                    <rect
                      x={-18}
                      y={-7}
                      width={36}
                      height={15}
                      rx={4}
                      fill="#064e3b"
                      stroke="#10b981"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={4}
                      fill="#6ee7b7"
                      fontSize={8.5}
                      fontWeight={800}
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                    >
                      SRC
                    </text>
                  </g>
                )}

                {isDest && (
                  <g transform="translate(0, -28)">
                    <rect
                      x={-22}
                      y={-7}
                      width={44}
                      height={15}
                      rx={4}
                      fill="#451a03"
                      stroke="#f59e0b"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={4}
                      fill="#fcd34d"
                      fontSize={8.5}
                      fontWeight={800}
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                    >
                      DEST
                    </text>
                  </g>
                )}

                {/* Main Node Circle */}
                <circle
                  r={18}
                  fill={
                    isSource
                      ? '#065f46'
                      : isDest
                      ? '#78350f'
                      : isBest
                      ? '#1e40af'
                      : isSelected
                      ? '#2563eb'
                      : '#1e293b'
                  }
                  stroke={
                    isSource
                      ? '#10b981'
                      : isDest
                      ? '#f59e0b'
                      : isBest
                      ? '#3b82f6'
                      : isSelected
                      ? '#60a5fa'
                      : '#475569'
                  }
                  strokeWidth={2}
                />

                {/* Server / Router Icon */}
                <circle r={8} fill="rgba(255, 255, 255, 0.15)" />
                <text
                  x={0}
                  y={4}
                  fill={isBest || isSelected || isSource || isDest ? '#ffffff' : 'var(--text-primary)'}
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

          {/* 4. Packet Marker in Flight (during simulation) */}
          {animatedPacketPos && (
            <g transform={`translate(${animatedPacketPos.x}, ${animatedPacketPos.y})`}>
              <circle r={10} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
              <text x={0} y={3} fill="#000" fontSize={8} fontWeight={800} textAnchor="middle">
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

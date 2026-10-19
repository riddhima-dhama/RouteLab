import React, { useState } from 'react';
import {
  RotateCcw,
  Network,
  GitFork,
  Send,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext.jsx';

export default function Topbar({ activeTab, setActiveTab }) {
  const {
    ases,
    sourceAs,
    setSourceAs,
    destAs,
    setDestAs,
    resetNetworkToDefault,
    backendStatus,
    checkBackendHealth,
    notify,
  } = useNetwork();

  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  const handleCheckBackend = async () => {
    setIsCheckingBackend(true);
    const res = await checkBackendHealth();
    setIsCheckingBackend(false);
    if (res?.connected) {
      notify(`Connected to backend API at ${backendStatus.baseUrl}`, 'success');
    } else {
      notify(`Backend API offline. Operating in standalone simulation mode.`, 'info');
    }
  };

  const navItems = [
    { id: 'topology', label: 'Topology', icon: Network },
    { id: 'bgp-routing', label: 'BGP Routing', icon: GitFork },
    { id: 'simulator', label: 'Packet Simulator', icon: Send },
    { id: 'performance-failures', label: 'Performance & Failures', icon: Activity },
  ];

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '54px',
        userSelect: 'none',
        flexShrink: 0,
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
          RouteLab
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          BGP Route Analyzer
        </span>
      </div>

      {/* 4 Main Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-blue)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent-blue)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#f1f5f9';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Source -> Dest AS, Backend Status, Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Endpoints Select */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px',
            fontSize: '0.75rem',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Src:</span>
          <select
            value={sourceAs}
            onChange={(e) => setSourceAs(e.target.value)}
            className="select-field"
            style={{ padding: '2px 4px', fontSize: '0.75rem', border: 'none', background: 'transparent' }}
          >
            {ases.map((a) => (
              <option key={a.id} value={a.id}>{a.id}</option>
            ))}
          </select>

          <ArrowRight size={12} color="var(--text-muted)" />

          <span style={{ color: 'var(--text-muted)' }}>Dst:</span>
          <select
            value={destAs}
            onChange={(e) => setDestAs(e.target.value)}
            className="select-field"
            style={{ padding: '2px 4px', fontSize: '0.75rem', border: 'none', background: 'transparent' }}
          >
            {ases.map((a) => (
              <option key={a.id} value={a.id}>{a.id}</option>
            ))}
          </select>
        </div>

        {/* Backend Status Indicator */}
        <button
          onClick={handleCheckBackend}
          disabled={isCheckingBackend}
          className="btn btn-sm btn-outline"
          style={{
            fontSize: '0.72rem',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="Click to check connection to backend server"
        >
          <span
            className="status-dot"
            style={{
              backgroundColor: backendStatus.connected ? 'var(--accent-emerald)' : 'var(--text-muted)',
            }}
          />
          <span>{backendStatus.connected ? 'API Online' : 'Local Engine'}</span>
        </button>

        {/* Reset State Button */}
        <button
          onClick={resetNetworkToDefault}
          className="btn btn-sm btn-outline"
          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
          title="Reset network to default classroom scenario"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}

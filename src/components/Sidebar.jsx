import React from 'react';
import {
  LayoutDashboard,
  Network,
  Send,
  Activity,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext.jsx';

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {
  const { activeLinksCount, links } = useNetwork();
  const hasFailedLink = links.some((l) => l.status === 'FAILED');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'topology', label: 'Topology', icon: Network },
    { id: 'simulator', label: 'Packet Simulator', icon: Send },
    { id: 'failure', label: 'Failure & Reroute', icon: AlertTriangle, alert: hasFailedLink },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'transport', label: 'TCP / UDP', icon: Zap },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '60px' : '200px',
        transition: 'width 0.15s ease',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '14px 6px' : '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="var(--accent-blue)" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f1f5f9' }}>
              RouteLab
            </span>
          </div>
        ) : (
          <Globe size={18} color="var(--accent-blue)" />
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '3px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '10px 6px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: collapsed ? '8px 0' : '7px 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: isActive ? '#f8fafc' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon
                  size={16}
                  color={isActive ? 'var(--accent-blue)' : 'currentColor'}
                  style={{ flexShrink: 0 }}
                />
                {!collapsed && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{item.label}</span>
                    {item.alert && (
                      <span className="badge badge-red" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                        FAIL
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Clean Footer */}
      {!collapsed && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{activeLinksCount}/{links.length} Links Up</span>
          <span className={`status-dot ${hasFailedLink ? 'warning' : 'healthy'}`} />
        </div>
      )}
    </aside>
  );
}

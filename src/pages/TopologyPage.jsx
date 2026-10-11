import React from 'react';
import NetworkTopology from '../components/NetworkTopology.jsx';
import { useNetwork } from '../context/NetworkContext.jsx';
import {
  RotateCcw,
  Sliders,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  getRelationshipBadgeColor,
  getAsRoleBadge,
} from '../utils/calculations.js';

export default function TopologyPage() {
  const {
    ases,
    links,
    bgpResult,
    sourceAs,
    destAs,
    toggleLinkStatus,
    updateLinkRelationship,
    updateAsRole,
    resetNetworkToDefault,
    clearAllAssignments,
    applyRolesToLinks,
    isManualMode,
  } = useNetwork();

  const assignedLinksCount = links.filter((l) => l.relationship !== 'unassigned').length;
  const assignedAsCount = ases.filter((a) => a.type !== 'Unassigned').length;
  const bestRoute = bgpResult?.bestRoute;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Topology Toolbar Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Network Topology & Commercial Peering Manager</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Manually define provider, customer, and peer hierarchies. Nothing is assigned automatically unless selected.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Button: Don't Assign Automatically / Clear */}
          <button
            onClick={clearAllAssignments}
            className="btn btn-sm btn-outline"
            title="Wipe all automatic assumptions to manually define who is provider and customer"
            style={{
              borderColor: isManualMode ? 'var(--accent-amber)' : 'var(--border-subtle)',
              color: isManualMode ? 'var(--accent-amber)' : 'var(--text-secondary)',
            }}
          >
            <Sliders size={13} />
            <span>Don't Assign Automatically</span>
          </button>

          {/* Button: Sync links from AS roles */}
          <button
            onClick={applyRolesToLinks}
            className="btn btn-sm btn-outline"
            title="Derive link customer/provider directions directly from the AS roles set below"
          >
            <ArrowRightLeft size={13} />
            <span>Derive Links from AS Roles</span>
          </button>

          {/* Button: Restore classroom preset */}
          <button
            onClick={resetNetworkToDefault}
            className="btn btn-sm btn-outline"
            title="Reset to default college presentation topology scenario"
          >
            <RotateCcw size={13} />
            <span>Load Preset Scenario</span>
          </button>
        </div>
      </div>

      {/* Mode Status Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isManualMode ? 'rgba(245, 158, 11, 0.08)' : 'rgba(56, 189, 248, 0.08)',
          border: `1px solid ${isManualMode ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)'}`,
          fontSize: '0.78rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isManualMode ? (
            <AlertTriangle size={15} color="var(--accent-amber)" />
          ) : (
            <Info size={15} color="var(--accent-cyan)" />
          )}
          <span>
            <strong>Current Configuration:</strong>{' '}
            {isManualMode
              ? 'Manual Mode Active — You have full manual control over every AS role and provider/customer relationship.'
              : 'Classroom Baseline Scenario — AS1 is Customer of AS3 (Alpha) and AS2 (Beta); AS3 & AS5 are Peers; AS5 is Provider of AS4.'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-secondary)' }}>
          <span>
            AS Roles: <strong style={{ color: '#f1f5f9' }}>{assignedAsCount}/{ases.length}</strong>
          </span>
          <span>
            Links Configured: <strong style={{ color: '#f1f5f9' }}>{assignedLinksCount}/{links.length}</strong>
          </span>
        </div>
      </div>

      {/* Interactive Canvas */}
      <NetworkTopology height="480px" allowEdit={true} />

      {/* Manual Role & Relationship Setters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '16px' }}>
        {/* Column 1: AS Business Roles ("What is what") */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div>
              <div className="card-title">Autonomous System Roles</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Specify what role each AS domain plays in the network hierarchy
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ases.length} Domains</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ases.map((a) => {
              const badge = getAsRoleBadge(a.type);
              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.78rem',
                    gap: '10px',
                  }}
                >
                  <div style={{ minWidth: '130px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: a.color || '#f1f5f9' }}>{a.id}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>AS{a.asn}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                      {a.name}
                    </div>
                  </div>

                  {/* AS Role Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>

                    <select
                      value={a.type}
                      onChange={(e) => updateAsRole(a.id, e.target.value)}
                      className="select-field"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.74rem',
                        backgroundColor: 'var(--bg-surface)',
                        minWidth: '130px',
                      }}
                    >
                      <option value="Unassigned">⚠️ Unassigned</option>
                      <option value="Customer">Customer (Edge / Stub)</option>
                      <option value="Provider">Provider (Transit ISP)</option>
                      <option value="Tier-1">Tier-1 Provider (Backbone)</option>
                      <option value="Peer">Peer (IXP / Transit-Free)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Peering Link Relationship Setter ("Who is Provider vs Customer") */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div>
              <div className="card-title">Inter-Domain Peering Links</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Explicitly choose which side is Customer and which side is Provider
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{links.length} Links</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '340px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {links.map((l) => {
              const badge = getRelationshipBadgeColor(l.relationship);
              const isInternal = l.fromAs === l.toAs;

              return (
                <div
                  key={l.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.78rem',
                    gap: '10px',
                  }}
                >
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontWeight: 600, color: l.status === 'ACTIVE' ? '#f1f5f9' : '#ef4444' }}>
                      {l.fromAs} ↔ {l.toAs}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {l.fromRouter} ↔ {l.toRouter} ({l.latencyMs}ms)
                    </div>
                  </div>

                  {/* Explicit Commercial Relationship Selector */}
                  <select
                    value={l.relationship}
                    onChange={(e) => updateLinkRelationship(l.id, e.target.value)}
                    className="select-field"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      backgroundColor: 'var(--bg-surface)',
                      flex: 1,
                      maxWidth: '280px',
                    }}
                  >
                    {isInternal ? (
                      <option value="internal">🔒 Internal IGP Link (OSPF)</option>
                    ) : (
                      <>
                        <option value="unassigned">⚠️ Unassigned (Not Set)</option>
                        <option value="customer-provider">
                          🔹 {l.fromAs} (Cust) ➔ {l.toAs} (Prov)
                        </option>
                        <option value="provider-customer">
                          🔹 {l.toAs} (Cust) ➔ {l.fromAs} (Prov)
                        </option>
                        <option value="peer-peer">
                          🔄 {l.fromAs} ↔ {l.toAs} are Peers
                        </option>
                      </>
                    )}
                  </select>

                  {/* Status & Failure Cut Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {l.relationship === 'customer-provider'
                        ? 'Cust ➔ Prov'
                        : l.relationship === 'provider-customer'
                        ? 'Prov ➔ Cust'
                        : l.relationship === 'peer-peer'
                        ? 'Peers'
                        : l.relationship === 'internal'
                        ? 'IGP'
                        : 'Unassigned'}
                    </span>

                    <button
                      onClick={() => toggleLinkStatus(l.id)}
                      className={`btn btn-sm ${l.status === 'ACTIVE' ? 'btn-outline' : 'btn-primary'}`}
                      style={{ padding: '2px 6px', fontSize: '0.68rem' }}
                      title={l.status === 'ACTIVE' ? 'Simulate Link Cut' : 'Restore Link'}
                    >
                      {l.status === 'ACTIVE' ? 'Cut' : 'Restore'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-Time BGP Decision & Valley-Free Impact Summary */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--accent-cyan)',
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Live BGP Routing Outcome ({sourceAs} ➔ {destAs})
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {bestRoute ? (
                <>
                  Best AS-Path: <span className="text-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{bestRoute.asPath.join(' → ')}</span> • Next-Hop: <span className="text-mono" style={{ color: '#f1f5f9' }}>{bestRoute.nextHopAs}</span> • Local-Pref: <span className="text-mono" style={{ color: 'var(--accent-emerald)' }}>{bestRoute.localPref}</span> ({bestRoute.learnedVia.toUpperCase()})
                </>
              ) : (
                <span style={{ color: '#ef4444' }}>No valid route available under current topology and policy assignments.</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
          {bestRoute?.isValleyFree ? (
            <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} />
              Valley-Free Compliant
            </span>
          ) : bestRoute ? (
            <span style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={13} />
              Valley-Free Check Passed
            </span>
          ) : null}

          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Total Latency: <strong style={{ color: '#f1f5f9' }}>{bestRoute?.totalLatencyMs || 0} ms</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

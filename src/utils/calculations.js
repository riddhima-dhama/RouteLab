/**
 * RouteLab — Calculation and Formatting Utilities
 */

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatBandwidth(mbps) {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(1)} Gbps`;
  }
  return `${mbps} Mbps`;
}

export function formatLatency(ms) {
  return `${Math.round(ms * 10) / 10} ms`;
}

export function getRelationshipBadgeColor(type) {
  switch (type) {
    case 'customer-provider':
      return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' };
    case 'provider-customer':
      return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.4)' };
    case 'peer-peer':
      return { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.4)' };
    case 'internal':
      return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.4)' };
    case 'unassigned':
      return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' };
  }
}

export function getRelationshipLabel(relationship, fromAs = 'A', toAs = 'B') {
  switch (relationship) {
    case 'customer-provider':
      return `${fromAs} (Cust) → ${toAs} (Prov)`;
    case 'provider-customer':
      return `${toAs} (Cust) → ${fromAs} (Prov)`;
    case 'peer-peer':
      return `${fromAs} ↔ ${toAs} (Peers)`;
    case 'internal':
      return 'Internal IGP (OSPF)';
    case 'unassigned':
      return 'Unassigned (Manual)';
    default:
      return relationship || 'Unassigned';
  }
}

export function getAsRoleBadge(role) {
  switch (role) {
    case 'Provider':
    case 'Tier-1':
      return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.35)', label: role === 'Tier-1' ? 'Tier-1 Provider' : 'Provider' };
    case 'Peer':
      return { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.35)', label: 'Peer' };
    case 'Customer':
      return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)', label: 'Customer' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)', label: 'Unassigned' };
  }
}

/**
 * RouteLab — Default Network Topology
 * 5 Autonomous Systems (AS1 to AS5), 6 Routers (R1 to R6)
 * Supports customer, peer, and provider BGP relationships.
 * Matches project scenario:
 * Default path: AS1 -> AS3 -> AS5 -> AS4
 * Failover path: AS1 -> AS2 -> AS4 (when AS3-AS5 link fails)
 */

export const DEFAULT_ASES = [
  {
    id: 'AS1',
    asn: 65001,
    name: 'Campus / Enterprise Stub',
    type: 'Customer', // In relation to Tier-2
    prefix: '198.51.100.0/24',
    routers: ['R1', 'R2'],
    color: '#38bdf8', // Sky cyan
    x: 140,
    y: 280,
    width: 200,
    height: 180,
    defaultLocalPref: 100,
  },
  {
    id: 'AS2',
    asn: 65002,
    name: 'Regional Provider Beta',
    type: 'Provider',
    prefix: '203.0.113.0/24',
    routers: ['R3'],
    color: '#818cf8', // Indigo
    x: 440,
    y: 420,
    width: 170,
    height: 150,
    defaultLocalPref: 150,
  },
  {
    id: 'AS3',
    asn: 65003,
    name: 'Regional Provider Alpha',
    type: 'Provider',
    prefix: '192.0.2.0/24',
    routers: ['R4'],
    color: '#a855f7', // Purple
    x: 440,
    y: 120,
    width: 170,
    height: 150,
    defaultLocalPref: 200, // Higher default local pref from AS1 to prefer AS3
  },
  {
    id: 'AS5',
    asn: 65005,
    name: 'Tier-1 Backbone Transit',
    type: 'Peer',
    prefix: '100.64.0.0/24',
    routers: ['R5'],
    color: '#ec4899', // Pink
    x: 740,
    y: 120,
    width: 170,
    height: 150,
    defaultLocalPref: 100,
  },
  {
    id: 'AS4',
    asn: 65004,
    name: 'Datacenter / Core Target',
    type: 'Customer',
    prefix: '198.18.0.0/24',
    routers: ['R6'],
    color: '#10b981', // Emerald green
    x: 990,
    y: 280,
    width: 180,
    height: 160,
    defaultLocalPref: 100,
  },
];

export const DEFAULT_ROUTERS = [
  {
    id: 'R1',
    name: 'R1 (Edge-East)',
    asId: 'AS1',
    ip: '198.51.100.1',
    x: 190,
    y: 330,
    loopback: '1.1.1.1',
    ospfArea: '0.0.0.0',
    status: 'ACTIVE',
  },
  {
    id: 'R2',
    name: 'R2 (Edge-South)',
    asId: 'AS1',
    ip: '198.51.100.2',
    x: 280,
    y: 400,
    loopback: '1.1.1.2',
    ospfArea: '0.0.0.0',
    status: 'ACTIVE',
  },
  {
    id: 'R3',
    name: 'R3 (Transit-B)',
    asId: 'AS2',
    ip: '203.0.113.1',
    x: 520,
    y: 490,
    loopback: '2.2.2.1',
    ospfArea: '0.0.0.0',
    status: 'ACTIVE',
  },
  {
    id: 'R4',
    name: 'R4 (Transit-A)',
    asId: 'AS3',
    ip: '192.0.2.1',
    x: 520,
    y: 190,
    loopback: '3.3.3.1',
    ospfArea: '0.0.0.0',
    status: 'ACTIVE',
  },
  {
    id: 'R5',
    name: 'R5 (Core-T1)',
    asId: 'AS5',
    ip: '100.64.0.1',
    x: 820,
    y: 190,
    loopback: '5.5.5.1',
    ospfArea: '0.0.0.0',
    status: 'ACTIVE',
  },
  {
    id: 'R6',
    name: 'R6 (DC-Core)',
    asId: 'AS4',
    ip: '198.18.0.1',
    x: 1070,
    y: 360,
    loopback: '4.4.4.1',
    ospfArea: '0.0.0.0',
    status: 'ACTIVE',
  },
];

/**
 * Links connect Routers.
 * Each link has an AS relationship type:
 * - 'customer-provider': fromNode AS is customer, toNode AS is provider
 * - 'provider-customer': fromNode AS is provider, toNode AS is customer
 * - 'peer-peer': both ASes are settlement-free peers
 * - 'internal': intra-AS link (OSPF IGP)
 */
export const DEFAULT_LINKS = [
  {
    id: 'L-INTRA-1',
    fromRouter: 'R1',
    toRouter: 'R2',
    fromAs: 'AS1',
    toAs: 'AS1',
    relationship: 'internal',
    status: 'ACTIVE',
    bandwidthMbps: 10000,
    latencyMs: 2,
    ospfCost: 5,
    label: 'Intra-AS1 (OSPF)',
  },
  {
    id: 'L-1-3',
    fromRouter: 'R1',
    toRouter: 'R4',
    fromAs: 'AS1',
    toAs: 'AS3',
    relationship: 'customer-provider', // AS1 is customer of AS3
    status: 'ACTIVE',
    bandwidthMbps: 1000,
    latencyMs: 12,
    ospfCost: 10,
    label: 'AS1 → AS3 (Cust-Prov)',
  },
  {
    id: 'L-1-2',
    fromRouter: 'R2',
    toRouter: 'R3',
    fromAs: 'AS1',
    toAs: 'AS2',
    relationship: 'customer-provider', // AS1 is customer of AS2
    status: 'ACTIVE',
    bandwidthMbps: 500,
    latencyMs: 22,
    ospfCost: 25,
    label: 'AS1 → AS2 (Cust-Prov)',
  },
  {
    id: 'L-3-5',
    fromRouter: 'R4',
    toRouter: 'R5',
    fromAs: 'AS3',
    toAs: 'AS5',
    relationship: 'peer-peer', // AS3 and AS5 are Peers
    status: 'ACTIVE',
    bandwidthMbps: 1000,
    latencyMs: 14,
    ospfCost: 15,
    label: 'AS3 ↔ AS5 (Peer-Peer)',
  },
  {
    id: 'L-5-4',
    fromRouter: 'R5',
    toRouter: 'R6',
    fromAs: 'AS5',
    toAs: 'AS4',
    relationship: 'provider-customer', // AS5 is provider of AS4
    status: 'ACTIVE',
    bandwidthMbps: 1000,
    latencyMs: 10,
    ospfCost: 10,
    label: 'AS5 → AS4 (Prov-Cust)',
  },
  {
    id: 'L-2-4',
    fromRouter: 'R3',
    toRouter: 'R6',
    fromAs: 'AS2',
    toAs: 'AS4',
    relationship: 'peer-peer', // AS2 and AS4 are Peers
    status: 'ACTIVE',
    bandwidthMbps: 500,
    latencyMs: 28,
    ospfCost: 30,
    label: 'AS2 ↔ AS4 (Peer-Peer)',
  },
];

export const DEFAULT_POLICIES = {
  // Gao-Rexford commercial preference weightings
  relationshipPreferences: {
    customer: 300, // Highest revenue / preferred
    peer: 200,     // Settlement-free
    provider: 100, // Costs money
  },
  // AS-specific Local Preference adjustments for outbound traffic
  asLocalPrefs: {
    'AS1->AS3': 220, // Local preference set on AS1 for routes via AS3
    'AS1->AS2': 180, // Local preference set on AS1 for routes via AS2
  },
  // Valley-Free export rules enforcement
  enforceValleyFree: true,
  // AS Loop detection
  rejectLoops: true,
  // Tie-breakers
  tieBreakers: ['relationship', 'localPref', 'asPathLength', 'lowestCost', 'lowestRouterId'],
};

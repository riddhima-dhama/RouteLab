/**
 * RouteLab — Mock Performance Metrics and Telemetry
 */

export const INITIAL_METRICS = {
  totalPacketsSent: 14250,
  totalPacketsDelivered: 14192,
  totalPacketsDropped: 58,
  deliveryRatioPercent: 99.59,
  avgLatencyMs: 38.4,
  avgThroughputMbps: 742.6,
  networkHealthPercent: 100,
  activeAlertsCount: 0,
};

export const MOCK_TRAFFIC_SERIES = [
  { time: '00:00', throughput: 520, latency: 42, loss: 0.1 },
  { time: '02:00', throughput: 480, latency: 39, loss: 0.0 },
  { time: '04:00', throughput: 410, latency: 36, loss: 0.0 },
  { time: '06:00', throughput: 610, latency: 40, loss: 0.2 },
  { time: '08:00', throughput: 820, latency: 45, loss: 0.4 },
  { time: '10:00', throughput: 910, latency: 48, loss: 0.5 },
  { time: '12:00', throughput: 880, latency: 44, loss: 0.3 },
  { time: '14:00', throughput: 950, latency: 47, loss: 0.4 },
  { time: '16:00', throughput: 920, latency: 46, loss: 0.3 },
  { time: '18:00', throughput: 850, latency: 42, loss: 0.2 },
  { time: '20:00', throughput: 780, latency: 40, loss: 0.1 },
  { time: '22:00', throughput: 640, latency: 38, loss: 0.1 },
];

export const MOCK_ALERTS = [
  {
    id: 'ALT-101',
    severity: 'info',
    title: 'BGP Peering Established',
    message: 'eBGP session established between AS3 (R4) and AS5 (R5)',
    timestamp: '2 min ago',
    source: 'BGP-OPEN',
  },
  {
    id: 'ALT-102',
    severity: 'info',
    title: 'Prefix Announced',
    message: 'Target prefix 198.18.0.0/24 originated by AS4 (R6)',
    timestamp: '8 min ago',
    source: 'BGP-UPDATE',
  },
  {
    id: 'ALT-103',
    severity: 'warning',
    title: 'Transit Congestion Notice',
    message: 'Link L-1-2 (AS1-AS2) utilization exceeded 68%',
    timestamp: '24 min ago',
    source: 'SNMP-TRAP',
  },
];

export const MOCK_ROUTING_EVENTS = [
  {
    id: 'EVT-1001',
    time: '22:14:02',
    type: 'BGP_UPDATE',
    severity: 'success',
    asPair: 'AS4 → AS5',
    description: 'AS4 announced prefix 198.18.0.0/24 to provider AS5 (AS-PATH: [65004])',
  },
  {
    id: 'EVT-1002',
    time: '22:14:05',
    type: 'BGP_UPDATE',
    severity: 'success',
    asPair: 'AS5 → AS3',
    description: 'AS5 exported route to peer AS3 (AS-PATH: [65005, 65004])',
  },
  {
    id: 'EVT-1003',
    time: '22:14:09',
    type: 'BGP_UPDATE',
    severity: 'success',
    asPair: 'AS3 → AS1',
    description: 'AS3 announced customer route to AS1 (AS-PATH: [65003, 65005, 65004])',
  },
  {
    id: 'EVT-1004',
    time: '22:14:12',
    type: 'ROUTE_SELECTED',
    severity: 'info',
    asPair: 'AS1',
    description: 'Best path selected: AS1 → AS3 → AS5 → AS4 (Local-Pref: 220, Len: 4)',
  },
];

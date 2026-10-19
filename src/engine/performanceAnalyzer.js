/**
 * RouteLab — Performance Analysis Engine
 * Calculates networking metrics:
 * - End-to-end Delay (ms)
 * - Bandwidth & Throughput (Mbps)
 * - Packet Delivery Ratio (PDR %) & Packet Loss Rate (%)
 * - Route Comparison (BGP Policy Route vs Alternative vs Shortest Physical Cost)
 * - TCP Congestion Window (cwnd) dynamics (Slow Start, Congestion Avoidance, Fast Retransmit)
 */

export function computeRoutePerformance(route) {
  if (!route) {
    return {
      bandwidthMbps: 0,
      throughputMbps: 0,
      delayMs: 0,
      latencyMs: 0,
      hopCount: 0,
      asCount: 0,
      pdr: 0,
      packetLossPercent: 100,
      utilizationPercent: 0,
    };
  }

  const links = route.traversedLinks || [];
  let totalLatency = 0;
  let minBandwidth = 10000;
  let totalCost = 0;

  links.forEach((l) => {
    if (l) {
      totalLatency += l.latencyMs || 10;
      if (l.bandwidthMbps < minBandwidth) minBandwidth = l.bandwidthMbps;
      totalCost += l.ospfCost || 10;
    }
  });

  const hopCount = route.routerPath ? route.routerPath.length - 1 : 0;
  // Latency = physical propagation time (ms)
  const latencyMs = totalLatency;
  // Delay = total end-to-end time (propagation + hop transmission & queuing delay, ~1.5ms per hop)
  const delayMs = Math.round((latencyMs + hopCount * 1.5) * 10) / 10;

  // Effective throughput is limited by bottleneck bandwidth and RTT (BDP - Bandwidth Delay Product)
  const bdpKbits = minBandwidth * totalLatency;
  // Typical realistic throughput with BGP protocol overhead and buffer efficiency (~88% of bottleneck)
  const throughputMbps = Math.round(minBandwidth * 0.88 * 10) / 10;
  const pdr = 99.8; // Baseline when route is healthy
  const packetLossPercent = 0.2;
  const utilizationPercent = Math.min(95, Math.round((throughputMbps / minBandwidth) * 100));

  return {
    bandwidthMbps: minBandwidth,
    throughputMbps,
    delayMs,
    latencyMs,
    bdpKbits,
    totalOspfCost: totalCost,
    hopCount,
    asCount: route.asPath ? route.asPath.length : 0,
    pdr,
    packetLossPercent,
    utilizationPercent,
  };
}

/**
 * Compares BGP Policy Route vs Alternative Route vs Shortest-Cost (IGP/Physical) Route
 */
export function compareRoutingCandidates(allRoutes = []) {
  if (!allRoutes || allRoutes.length === 0) return [];

  // Find candidate 1: BGP Best Route
  const bgpBest = allRoutes.find((r) => r.isBest) || allRoutes[0];

  // Find candidate 2: Alternative BGP Route
  const bgpAlt = allRoutes.find((r) => !r.isBest) || null;

  // Find candidate 3: Shortest Cost Route (by lowest total latency or lowest OSPF cost)
  const sortedByCost = [...allRoutes].sort((a, b) => a.totalLatencyMs - b.totalLatencyMs);
  const shortestCost = sortedByCost[0] || bgpBest;

  return [
    {
      category: 'BGP Policy Best Route',
      tag: 'BGP Winner',
      isWinner: true,
      route: bgpBest,
      asPathStr: bgpBest.asPath.join(' → '),
      hops: bgpBest.asPathLength - 1,
      latencyMs: bgpBest.totalLatencyMs,
      delayMs: Math.round((bgpBest.totalLatencyMs + (bgpBest.routerPath?.length || 3) * 1.5) * 10) / 10,
      bandwidthMbps: bgpBest.bottleneckBandwidthMbps,
      throughputMbps: Math.round(bgpBest.bottleneckBandwidthMbps * 0.88),
      pdr: 99.8,
      decisionReason: `Preferred via Gao-Rexford commercial policy (Local-Pref: ${bgpBest.localPref}, ${bgpBest.learnedVia.toUpperCase()}). Commercial agreements take precedence over physical hops.`,
    },
    ...(bgpAlt
      ? [
          {
            category: 'Alternative BGP Candidate',
            tag: 'Backup Route',
            isWinner: false,
            route: bgpAlt,
            asPathStr: bgpAlt.asPath.join(' → '),
            hops: bgpAlt.asPathLength - 1,
            latencyMs: bgpAlt.totalLatencyMs,
            delayMs: Math.round((bgpAlt.totalLatencyMs + (bgpAlt.routerPath?.length || 3) * 1.5) * 10) / 10,
            bandwidthMbps: bgpAlt.bottleneckBandwidthMbps,
            throughputMbps: Math.round(bgpAlt.bottleneckBandwidthMbps * 0.88),
            pdr: 99.4,
            decisionReason: `Viable candidate but holds lower Local-Pref (${bgpAlt.localPref}) or longer AS-Path. Will be selected dynamically if primary fails.`,
          },
        ]
      : []),
    {
      category: 'Shortest Physical Delay Route',
      tag: 'Lowest Delay',
      isWinner: shortestCost.id === bgpBest.id,
      route: shortestCost,
      asPathStr: shortestCost.asPath.join(' → '),
      hops: shortestCost.asPathLength - 1,
      latencyMs: shortestCost.totalLatencyMs,
      delayMs: Math.round((shortestCost.totalLatencyMs + (shortestCost.routerPath?.length || 3) * 1.5) * 10) / 10,
      bandwidthMbps: shortestCost.bottleneckBandwidthMbps,
      throughputMbps: Math.round(shortestCost.bottleneckBandwidthMbps * 0.9),
      pdr: 99.9,
      decisionReason:
        shortestCost.id === bgpBest.id
          ? 'BGP policy aligns with the lowest physical delay path.'
          : 'Lowest physical delay, but bypassed because BGP does NOT use link delay or OSPF cost as global metrics; BGP prioritizes autonomous policy and economics.',
    },
  ];
}

/**
 * Simulates TCP Congestion Control behavior over rounds
 * Models Slow Start, Congestion Avoidance (AIMD), and Fast Retransmit / Fast Recovery.
 */
export function simulateTcpRounds({
  numRounds = 18,
  initialSsthresh = 32,
  dropAtRound = 10,
  hasLoss = true,
  lossType = 'fast_retransmit', // 'fast_retransmit' (3 Dup ACKs -> ssthresh) or 'timeout' (RTO -> 1 MSS)
}) {
  const data = [];
  let cwnd = 1; // 1 MSS
  let ssthresh = initialSsthresh;
  let phase = 'Slow Start';

  for (let r = 1; r <= numRounds; r++) {
    // Check if loss event triggered at this round
    if (hasLoss && r === dropAtRound) {
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      if (lossType === 'timeout') {
        // RTO Timeout: severe loss or link severed during routing convergence -> cwnd drops to 1 MSS
        phase = 'RTO Timeout (Slow Start Restart)';
        cwnd = 1;
        data.push({
          round: r,
          cwnd: 1,
          ssthresh,
          phase,
          event: 'RTO Timeout (Link Flap/Unreachable): cwnd -> 1 MSS',
          throughput: Math.round(cwnd * 14.6),
        });
      } else {
        // Fast Retransmit / Fast Recovery: 3 Duplicate ACKs received
        phase = 'Fast Recovery / Retransmit';
        cwnd = ssthresh; // In Fast Recovery cwnd resumes at ssthresh
        data.push({
          round: r,
          cwnd: Math.round(cwnd * 10) / 10,
          ssthresh,
          phase,
          event: 'Packet Loss (3 Dup ACKs): Fast Retransmit (cwnd = ssthresh)',
          throughput: Math.round(cwnd * 14.6),
        });
      }
      continue;
    }

    // Normal progression
    if (cwnd < ssthresh) {
      phase = 'Slow Start';
      cwnd = cwnd * 2; // Exponential growth
    } else {
      phase = 'Congestion Avoidance';
      cwnd = cwnd + 1; // Linear additive increase (+1 MSS per RTT)
    }

    data.push({
      round: r,
      cwnd: Math.round(cwnd * 10) / 10,
      ssthresh,
      phase,
      event: r === 1 ? 'Connection Start' : null,
      throughput: Math.round(cwnd * 14.6),
    });
  }

  return data;
}

/**
 * Simulates UDP transmission statistics
 */
export function simulateUdpBurst({ packetCount = 20, lossRate = 5 }) {
  const packets = [];
  let delivered = 0;
  let dropped = 0;

  for (let i = 1; i <= packetCount; i++) {
    const isLost = Math.random() * 100 < lossRate;
    const latency = Math.floor(30 + Math.random() * 20);
    const jitter = Math.floor((Math.random() - 0.5) * 10);

    if (isLost) {
      dropped++;
      packets.push({
        seq: i,
        status: 'DROPPED',
        latency: 0,
        jitter: 0,
        note: 'UDP datagram lost (no retransmission)',
      });
    } else {
      delivered++;
      packets.push({
        seq: i,
        status: 'DELIVERED',
        latency,
        jitter,
        note: 'Received in order',
      });
    }
  }

  return {
    totalSent: packetCount,
    delivered,
    dropped,
    lossPercent: Math.round((dropped / packetCount) * 1000) / 10,
    packets,
  };
}

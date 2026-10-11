/**
 * RouteLab — Packet Simulation Engine
 * Simulates hop-by-hop IP packet traversal across BGP-selected inter-AS route.
 * Handles TTL decrement, link state checks, packet drops, and ICMP messaging.
 */

export function buildPacketTraceSteps({
  packetId = 1,
  sourceRouter = 'R1',
  destRouter = 'R6',
  initialTtl = 64,
  packetSize = 1200,
  activeRoute = null,
  routers = [],
}) {
  const routerMap = new Map(routers.map((r) => [r.id, r]));
  const steps = [];
  let currentTtl = initialTtl;
  let cumulativeDelay = 0;

  // Case 1: No usable route
  if (!activeRoute || !activeRoute.routerPath || activeRoute.routerPath.length === 0) {
    const src = routerMap.get(sourceRouter);
    return {
      status: 'DROPPED',
      reason: `No BGP Route from ${sourceRouter} to ${destRouter} (Network Unreachable)`,
      packetId,
      steps: [
        {
          hopIndex: 0,
          routerId: sourceRouter,
          asId: src?.asId || 'AS1',
          ip: src?.ip || '198.51.100.1',
          ttlRemaining: currentTtl,
          delayMs: 0,
          action: 'LOOKUP_FAILED',
          status: 'DROP',
          notes: `No viable BGP route to ${destRouter} in Loc-RIB. ICMP Type 3 Code 0 (Net Unreachable) generated.`,
        },
      ],
    };
  }

  const routerPath = activeRoute.routerPath;

  for (let i = 0; i < routerPath.length; i++) {
    const rId = routerPath[i];
    const router = routerMap.get(rId);
    const asId = router?.asId || 'AS1';

    // Ingress step
    if (i === 0) {
      steps.push({
        hopIndex: 1,
        routerId: rId,
        asId,
        ip: router?.ip || '198.51.100.1',
        ingressInterface: 'eth0 (Loopback)',
        egressInterface: `eth1 (to ${routerPath[1] || 'DEST'})`,
        ttlRemaining: currentTtl,
        delayMs: cumulativeDelay,
        action: 'ORIGINATED',
        status: 'FORWARDED',
        notes: `IP packet (${packetSize} Bytes) injected at origin router ${rId} in ${asId} targeted for ${destRouter} with TTL=${currentTtl}`,
      });
      continue;
    }

    // TTL check before forwarding
    currentTtl -= 1;
    const linkBetween = activeRoute.traversedLinks?.[i - 1];
    const linkDelay = linkBetween?.latencyMs || 10;
    cumulativeDelay += linkDelay;

    // Check if the link was marked failed mid-flight
    if (linkBetween && linkBetween.status === 'FAILED') {
      steps.push({
        hopIndex: i + 1,
        routerId: rId,
        asId,
        ip: router?.ip || '0.0.0.0',
        ingressInterface: `eth0 (from ${routerPath[i - 1]})`,
        egressInterface: 'DOWN',
        ttlRemaining: currentTtl,
        delayMs: cumulativeDelay,
        action: 'LINK_FAILURE_DROP',
        status: 'DROP',
        notes: `Next-hop interface link ${linkBetween.id} is down! Dropped with ICMP Type 3 Code 1 (Host Unreachable).`,
      });

      return {
        status: 'DROPPED',
        reason: `Physical link ${linkBetween.id} failed during transit`,
        packetId,
        totalDelayMs: cumulativeDelay,
        finalTtl: currentTtl,
        steps,
      };
    }

    // Check for TTL expiration (e.g. initial TTL was set low like 2 or 3)
    if (currentTtl <= 0) {
      steps.push({
        hopIndex: i + 1,
        routerId: rId,
        asId,
        ip: router?.ip || '0.0.0.0',
        ingressInterface: `eth0 (from ${routerPath[i - 1]})`,
        egressInterface: 'NULL0',
        ttlRemaining: 0,
        delayMs: cumulativeDelay,
        action: 'TTL_EXPIRED',
        status: 'DROP',
        notes: `TTL reached 0 at router ${rId}! Packet dropped. ICMP Type 11 Code 0 (Time to Live Exceeded in Transit) returned.`,
      });

      return {
        status: 'DROPPED',
        reason: 'TTL expired in transit (ICMP Time Exceeded)',
        packetId,
        totalDelayMs: cumulativeDelay,
        finalTtl: 0,
        steps,
      };
    }

    // Is this destination router?
    const isDestination = i === routerPath.length - 1;

    if (isDestination) {
      steps.push({
        hopIndex: i + 1,
        routerId: rId,
        asId,
        ip: router?.ip || '198.18.0.1',
        ingressInterface: `eth0 (from ${routerPath[i - 1]})`,
        egressInterface: 'LOCAL_DELIVERY',
        ttlRemaining: currentTtl,
        delayMs: cumulativeDelay,
        action: 'DELIVERED',
        status: 'SUCCESS',
        notes: `Packet successfully arrived at destination router ${rId} in ${asId} after ${i} hops!`,
      });

      return {
        status: 'DELIVERED',
        reason: 'Packet reached destination successfully',
        packetId,
        totalDelayMs: cumulativeDelay,
        finalTtl: currentTtl,
        steps,
      };
    } else {
      steps.push({
        hopIndex: i + 1,
        routerId: rId,
        asId,
        ip: router?.ip || '0.0.0.0',
        ingressInterface: `eth0 (from ${routerPath[i - 1]})`,
        egressInterface: `eth1 (to ${routerPath[i + 1]})`,
        ttlRemaining: currentTtl,
        delayMs: cumulativeDelay,
        action: 'HOP_FORWARD',
        status: 'FORWARDED',
        notes: `Forwarded by border gateway ${rId} across ${linkBetween ? linkBetween.label : 'link'} (Remaining TTL=${currentTtl})`,
      });
    }
  }

  return {
    status: 'DELIVERED',
    reason: 'Transmission complete',
    packetId,
    totalDelayMs: cumulativeDelay,
    finalTtl: currentTtl,
    steps,
  };
}

/**
 * RouteLab — BGP Path Vector Routing Engine
 * Implements:
 * 1. AS Path Exploration & Loop Detection (RFC 4271)
 * 2. Gao-Rexford Commercial Relationships (Customer > Peer > Provider)
 * 3. Valley-Free Export/Import policy validation
 * 4. Multi-Attribute Tie-Breaking (Local-Pref, AS-Path Length, IGP Cost)
 * 5. Link Status Verification (Dynamic failure handling)
 */

export function calculateBgpRoutes({
  ases,
  routers,
  links,
  sourceAsId = 'AS1',
  destAsId = 'AS4',
  policies = {},
}) {
  // Build adjacency graph of ASes and Routers
  const asAdj = new Map();
  ases.forEach((a) => asAdj.set(a.id, []));

  links.forEach((l) => {
    // Both directions
    if (!asAdj.has(l.fromAs)) asAdj.set(l.fromAs, []);
    if (!asAdj.has(l.toAs)) asAdj.set(l.toAs, []);

    asAdj.get(l.fromAs).push({
      neighborAs: l.toAs,
      fromRouter: l.fromRouter,
      toRouter: l.toRouter,
      link: l,
      relationship: l.relationship,
      isActive: l.status === 'ACTIVE',
    });

    if (l.fromAs !== l.toAs) {
      // Invert relationship for the reverse direction
      let reverseRel = l.relationship;
      if (l.relationship === 'customer-provider') reverseRel = 'provider-customer';
      else if (l.relationship === 'provider-customer') reverseRel = 'customer-provider';

      asAdj.get(l.toAs).push({
        neighborAs: l.fromAs,
        fromRouter: l.toRouter,
        toRouter: l.fromRouter,
        link: l,
        relationship: reverseRel,
        isActive: l.status === 'ACTIVE',
      });
    }
  });

  const allDiscoveredPaths = [];
  const rejectedRoutes = [];

  // DFS Path Exploration to discover all candidate AS-paths (limit depth to 8 to prevent runaways)
  function explorePaths(currentAs, currentRouter, visitedAses, currentPath) {
    if (currentAs === destAsId) {
      allDiscoveredPaths.push([...currentPath]);
      return;
    }

    if (visitedAses.length > 7) return;

    const neighbors = asAdj.get(currentAs) || [];
    for (const edge of neighbors) {
      // Check for AS Loop
      if (visitedAses.includes(edge.neighborAs)) {
        // Record as rejected loop route
        rejectedRoutes.push({
          asPath: [...visitedAses, edge.neighborAs],
          routerPath: [...currentPath.map((p) => p.router), edge.toRouter],
          reason: `BGP Loop Detected: ASN ${edge.neighborAs} already present in AS-PATH (${[...visitedAses, edge.neighborAs].join(' → ')})`,
          category: 'LOOP_DETECTION',
        });
        continue;
      }

      // Check if link is inactive/failed
      if (!edge.isActive) {
        rejectedRoutes.push({
          asPath: [...visitedAses, edge.neighborAs],
          routerPath: [...currentPath.map((p) => p.router), edge.toRouter],
          reason: `Link Down: Inter-domain link ${edge.link.id} (${currentAs} ↔ ${edge.neighborAs}) is administratively down`,
          category: 'LINK_FAILED',
        });
        continue;
      }

      explorePaths(
        edge.neighborAs,
        edge.toRouter,
        [...visitedAses, edge.neighborAs],
        [
          ...currentPath,
          {
            as: edge.neighborAs,
            router: edge.toRouter,
            link: edge.link,
            relationship: edge.relationship,
          },
        ]
      );
    }
  }

  // Find initial router for source AS
  const srcRouters = routers.filter((r) => r.asId === sourceAsId);
  const initialRouter = srcRouters[0]?.id || 'R1';

  explorePaths(sourceAsId, initialRouter, [sourceAsId], [
    { as: sourceAsId, router: initialRouter, link: null, relationship: 'originated' },
  ]);

  // Evaluate candidate valid paths
  const evaluatedRoutes = allDiscoveredPaths.map((pathSteps, index) => {
    const asPath = pathSteps.map((s) => s.as);
    const routerPath = pathSteps.map((s) => s.router);
    const traversedLinks = pathSteps.slice(1).map((s) => s.link);

    // Business relationship: determined by the next-hop AS that advertised this route to source
    // In Gao-Rexford: Customer-learned > Peer-learned > Provider-learned
    const firstHopStep = pathSteps[1];
    let learnedVia = 'unassigned';
    if (firstHopStep) {
      if (firstHopStep.relationship === 'customer-provider') {
        // First hop is our provider
        learnedVia = 'provider';
      } else if (firstHopStep.relationship === 'provider-customer') {
        // First hop is our customer
        learnedVia = 'customer';
      } else if (firstHopStep.relationship === 'peer-peer') {
        learnedVia = 'peer';
      } else if (firstHopStep.relationship === 'internal') {
        learnedVia = 'internal';
      } else {
        // If link relationship is unassigned, check if user-assigned AS roles inform it
        const srcAsObj = ases.find((a) => a.id === sourceAsId);
        const nextAsObj = ases.find((a) => a.id === firstHopStep.as);
        if (srcAsObj && nextAsObj) {
          if (srcAsObj.type === 'Customer' && (nextAsObj.type === 'Provider' || nextAsObj.type === 'Tier-1')) {
            learnedVia = 'provider';
          } else if ((srcAsObj.type === 'Provider' || srcAsObj.type === 'Tier-1') && nextAsObj.type === 'Customer') {
            learnedVia = 'customer';
          } else if (srcAsObj.type === 'Peer' && nextAsObj.type === 'Peer') {
            learnedVia = 'peer';
          } else {
            learnedVia = 'unassigned';
          }
        } else {
          learnedVia = 'unassigned';
        }
      }
    }

    // Configurable Local-Pref lookup (e.g. AS1->AS3 has 220, AS1->AS2 has 180)
    let localPref = 100;
    const prefKey = `${sourceAsId}->${pathSteps[1]?.as}`;
    if (policies.asLocalPrefs && policies.asLocalPrefs[prefKey]) {
      localPref = policies.asLocalPrefs[prefKey];
    } else {
      // Gao-Rexford baseline
      if (learnedVia === 'customer') localPref = 300;
      else if (learnedVia === 'peer') localPref = 200;
      else if (learnedVia === 'provider') localPref = 100;
      else if (learnedVia === 'internal') localPref = 150;
      else if (learnedVia === 'unassigned') localPref = 100;
    }

    // Valley-free rule check (RFC guidelines):
    // A path cannot have: (Provider/Peer step) followed later by (Customer-to-Provider/Peer step)
    // i.e., once traffic goes down to a customer, it cannot go back up to a provider.
    let isValleyFree = true;
    let seenDownhill = false;
    for (let i = 1; i < pathSteps.length; i++) {
      const rel = pathSteps[i].relationship;
      if (rel === 'provider-customer') {
        seenDownhill = true;
      } else if (seenDownhill && (rel === 'customer-provider' || rel === 'peer-peer')) {
        isValleyFree = false;
        break;
      }
    }

    // Compute latency, bandwidth, and cost
    let totalLatency = 0;
    let minBandwidth = 10000;
    let totalOspfCost = 0;

    traversedLinks.forEach((l) => {
      if (l) {
        totalLatency += l.latencyMs || 10;
        if ((l.bandwidthMbps || 1000) < minBandwidth) minBandwidth = l.bandwidthMbps;
        totalOspfCost += l.ospfCost || 10;
      }
    });

    return {
      id: `ROUTE-${index + 1}`,
      asPath,
      routerPath,
      traversedLinks,
      asPathLength: asPath.length,
      routerHopCount: routerPath.length,
      learnedVia,
      localPref,
      isValleyFree,
      totalLatencyMs: totalLatency,
      bottleneckBandwidthMbps: minBandwidth,
      totalOspfCost,
      nextHopAs: pathSteps[1]?.as || destAsId,
      nextHopRouter: pathSteps[1]?.router || initialRouter,
    };
  });

  // Separate routes that violate policy vs valid candidates
  const validRoutes = [];
  evaluatedRoutes.forEach((route) => {
    if (policies.enforceValleyFree && !route.isValleyFree) {
      rejectedRoutes.push({
        asPath: route.asPath,
        routerPath: route.routerPath,
        reason: 'Policy Violation (Valley-Free): Commercial transit rule violated (peer/provider cannot transit to another peer/provider)',
        category: 'VALLEY_FREE_VIOLATION',
      });
    } else {
      validRoutes.push(route);
    }
  });

  // Sort by BGP Decision Algorithm:
  // 1. Highest Local Preference
  // 2. Shortest AS-Path Length
  // 3. Lowest IGP / OSPF Cost to Next-Hop
  // 4. Lowest Router ID (deterministic tie-breaker)
  validRoutes.sort((a, b) => {
    if (b.localPref !== a.localPref) return b.localPref - a.localPref;
    if (a.asPathLength !== b.asPathLength) return a.asPathLength - b.asPathLength;
    if (a.totalOspfCost !== b.totalOspfCost) return a.totalOspfCost - b.totalOspfCost;
    return a.id.localeCompare(b.id);
  });

  if (validRoutes.length > 0) {
    validRoutes[0].isBest = true;
    for (let i = 1; i < validRoutes.length; i++) {
      validRoutes[i].isBest = false;
    }
  }

  const bestRoute = validRoutes[0] || null;

  // Build decision breakdown explaining why bestRoute was chosen over other candidates
  const decisionBreakdown = [];
  if (bestRoute) {
    decisionBreakdown.push({
      step: 1,
      rule: 'Next-Hop Reachability & Link Integrity',
      status: 'PASSED',
      explanation: `All physical links along AS-Path [${bestRoute.asPath.join(' → ')}] are verified ACTIVE with no failed interfaces.`,
    });

    decisionBreakdown.push({
      step: 2,
      rule: 'BGP AS-Path Loop Detection (RFC 4271)',
      status: 'PASSED',
      explanation: `Verified that receiver ASN does not appear in the AS-Path. Path vector contains unique ASNs.`,
    });

    decisionBreakdown.push({
      step: 3,
      rule: 'Local Preference (Policy / Gao-Rexford Model)',
      status: 'DETERMINANT',
      explanation: `Selected path via next-hop ${bestRoute.nextHopAs} holds Local-Pref = ${bestRoute.localPref} (${
        bestRoute.learnedVia === 'unassigned'
          ? 'Manual / Neutral link preference'
          : `Learned via ${bestRoute.learnedVia.toUpperCase()} relationship`
      }). Higher Local-Pref always takes precedence over AS-Path length.`,
    });

    if (validRoutes.length > 1) {
      const runnerUp = validRoutes[1];
      decisionBreakdown.push({
        step: 4,
        rule: 'Comparison Against Alternative Candidate',
        status: 'INFO',
        explanation: `Alternative candidate [${runnerUp.asPath.join(' → ')}] has Local-Pref = ${runnerUp.localPref} and AS-Path length = ${runnerUp.asPathLength}. Winner prevailed on ${
          bestRoute.localPref > runnerUp.localPref
            ? `Local-Pref (${bestRoute.localPref} vs ${runnerUp.localPref})`
            : `AS-Path Length (${bestRoute.asPathLength} vs ${runnerUp.asPathLength})`
        }.`,
      });
    }

    decisionBreakdown.push({
      step: 5,
      rule: 'Tie-Breaker: AS-Path & Interior Gateway Metric',
      status: 'CONFIRMED',
      explanation: `AS-Path length is ${bestRoute.asPathLength} hops. Intra-AS OSPF cost to border gateway: ${bestRoute.totalOspfCost}. Installed into Loc-RIB.`,
    });
  }

  return {
    sourceAsId,
    destAsId,
    bestRoute,
    validRoutes,
    rejectedRoutes,
    decisionBreakdown,
    totalDiscovered: allDiscoveredPaths.length,
    timestamp: new Date().toISOString(),
  };
}

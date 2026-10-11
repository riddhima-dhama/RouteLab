/**
 * RouteLab — BGP Policy Engine
 * Models export rules, import policies, route filters, and BGP UPDATE generation
 * (Announcements & Withdrawals)
 */

export const EXPORT_RULES = [
  {
    relationType: 'provider-customer',
    ruleName: 'Provider to Customer Export',
    behavior: 'Advertise all available routes (own prefixes, peer routes, provider routes, and other customer routes).',
    rationale: 'Customer pays provider for full global Internet transit.',
    scope: 'ALL_ROUTES',
  },
  {
    relationType: 'customer-provider',
    ruleName: 'Customer to Provider Export',
    behavior: 'Advertise only the customer AS own prefixes and customer-learned routes.',
    rationale: 'Customer must never provide free transit between competing upstream providers.',
    scope: 'OWN_AND_CUSTOMERS_ONLY',
  },
  {
    relationType: 'peer-peer',
    ruleName: 'Peer to Peer Export',
    behavior: 'Advertise only own prefixes and direct customer-learned routes.',
    rationale: 'Peering agreements are settlement-free and strictly prohibit third-party transit.',
    scope: 'OWN_AND_CUSTOMERS_ONLY',
  },
];

/**
 * Validates whether an advertised route is legally exportable according to Gao-Rexford rules.
 */
export function checkRouteExportable(learnedRelationship, neighborRelationship) {
  // If we are advertising to a customer, we can export everything!
  if (neighborRelationship === 'provider-customer') {
    return {
      allowed: true,
      reason: 'Allowed: Providers export full global routing table to customers.',
    };
  }

  // If we are advertising to a provider or peer:
  // We can ONLY export our own prefixes or routes learned from customers!
  if (learnedRelationship === 'customer' || learnedRelationship === 'originated') {
    return {
      allowed: true,
      reason: 'Allowed: Customer routes and local prefixes are exportable to peers and providers.',
    };
  }

  return {
    allowed: false,
    reason: `Export Denied: Commercial Valley-Free violation. Route learned from a ${learnedRelationship.toUpperCase()} cannot be advertised to another ${neighborRelationship === 'peer-peer' ? 'PEER' : 'PROVIDER'}.`,
  };
}

/**
 * Checks for AS-Path Loops (RFC 4271 Section 9.1.2)
 */
export function verifyAsPathLoop(asPath, receivingAsn) {
  const containsLoop = asPath.includes(receivingAsn);
  return {
    hasLoop: containsLoop,
    receivingAsn,
    asPath,
    message: containsLoop
      ? `LOOP DETECTED: AS-PATH contains receiving ASN (${receivingAsn}). BGP UPDATE immediately discarded to avoid persistent forwarding loops.`
      : `CLEAN: AS-PATH does not contain receiving ASN (${receivingAsn}). Route accepted into Adj-RIB-In.`,
  };
}

/**
 * Generates synthetic BGP UPDATE message (Announcement or Withdrawal)
 */
export function generateBgpMessage({
  type = 'ANNOUNCE', // 'ANNOUNCE' | 'WITHDRAW'
  prefix = '198.18.0.0/24',
  originAsn = 65004,
  asPath = [65005, 65004],
  nextHop = '100.64.0.1',
  localPref = 100,
  med = 0,
}) {
  const timestamp = new Date().toLocaleTimeString();

  if (type === 'WITHDRAW') {
    return {
      id: `WITHDRAW-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      type: 'WITHDRAW',
      withdrawnRoutes: [prefix],
      description: `BGP UPDATE (Withdrawal): Route to ${prefix} has been withdrawn due to link state change.`,
      rawPayload: {
        messageType: 'UPDATE',
        withdrawnPrefixes: [prefix],
        pathAttributesLength: 0,
      },
    };
  }

  return {
    id: `ANNOUNCE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    type: 'ANNOUNCE',
    prefix,
    asPath: [originAsn, ...asPath],
    nextHop,
    localPref,
    med,
    origin: 'IGP',
    description: `BGP UPDATE (Announcement): NLRI ${prefix} via AS-PATH [${[originAsn, ...asPath].join(' ')}], Next-Hop ${nextHop}`,
    rawPayload: {
      messageType: 'UPDATE',
      nlri: prefix,
      attributes: {
        ORIGIN: 'IGP (0)',
        AS_PATH: asPath,
        NEXT_HOP: nextHop,
        LOCAL_PREF: localPref,
        MULTI_EXIT_DISC: med,
      },
    },
  };
}

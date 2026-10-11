import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  DEFAULT_ASES,
  DEFAULT_ROUTERS,
  DEFAULT_LINKS,
  DEFAULT_POLICIES,
} from '../data/defaultTopology.js';
import {
  INITIAL_METRICS,
  MOCK_ALERTS,
  MOCK_ROUTING_EVENTS,
} from '../data/mockMetrics.js';
import { calculateBgpRoutes } from '../engine/bgpEngine.js';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [ases, setAses] = useState(DEFAULT_ASES);
  const [routers, setRouters] = useState(DEFAULT_ROUTERS);
  const [links, setLinks] = useState(DEFAULT_LINKS);
  const [policies, setPolicies] = useState(DEFAULT_POLICIES);

  const [sourceAs, setSourceAs] = useState('AS1');
  const [destAs, setDestAs] = useState('AS4');
  const [selectedElement, setSelectedElement] = useState(null); // Node or Link or AS

  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [logs, setLogs] = useState(MOCK_ROUTING_EVENTS);
  const [packetHistory, setPacketHistory] = useState([]);
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info'|'warning', message: string }

  // Show temporary toast notification
  const notify = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Append to event log
  const addLog = useCallback((type, description, asPair = 'SYSTEM', severity = 'info') => {
    const newLog = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      time: new Date().toLocaleTimeString(),
      type,
      severity,
      asPair,
      description,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, []);

  // Compute active BGP routing state whenever topology, links, or endpoints change
  const bgpResult = useMemo(() => {
    return calculateBgpRoutes({
      ases,
      routers,
      links,
      sourceAsId: sourceAs,
      destAsId: destAs,
      policies,
    });
  }, [ases, routers, links, sourceAs, destAs, policies]);

  // Toggle link status (ACTIVE <-> FAILED)
  const toggleLinkStatus = useCallback((linkId) => {
    setLinks((prevLinks) => {
      const target = prevLinks.find((l) => l.id === linkId);
      if (!target) return prevLinks;

      const newStatus = target.status === 'ACTIVE' ? 'FAILED' : 'ACTIVE';
      const updated = prevLinks.map((l) =>
        l.id === linkId ? { ...l, status: newStatus } : l
      );

      if (newStatus === 'FAILED') {
        notify(`Link ${linkId} (${target.fromAs} ↔ ${target.toAs}) went DOWN! BGP WITHDRAWAL sent.`, 'error');
        addLog(
          'BGP_WITHDRAW',
          `Interface failure on link ${linkId}. BGP withdrawal announced by ${target.fromAs} and ${target.toAs}`,
          `${target.fromAs} ↔ ${target.toAs}`,
          'error'
        );
      } else {
        notify(`Link ${linkId} (${target.fromAs} ↔ ${target.toAs}) RESTORED to active service!`, 'success');
        addLog(
          'BGP_UPDATE',
          `Link ${linkId} restored. BGP Keepalive and NLRI re-advertised.`,
          `${target.fromAs} ↔ ${target.toAs}`,
          'success'
        );
      }

      return updated;
    });
  }, [notify, addLog]);

  // Set link status explicitly
  const setLinkStatus = useCallback((linkId, status) => {
    setLinks((prevLinks) =>
      prevLinks.map((l) => (l.id === linkId ? { ...l, status } : l))
    );
  }, []);

  // Update link relationship (customer-provider, peer-peer, provider-customer)
  const updateLinkRelationship = useCallback((linkId, newRelationship) => {
    setLinks((prevLinks) =>
      prevLinks.map((l) =>
        l.id === linkId
          ? {
              ...l,
              relationship: newRelationship,
              label: `${l.fromAs} ↔ ${l.toAs} (${newRelationship})`,
            }
          : l
      )
    );
    notify(`Updated link ${linkId} commercial policy to ${newRelationship}`, 'info');
    addLog('POLICY_CHANGE', `Link ${linkId} relationship modified to ${newRelationship}`, 'POLICY', 'info');
  }, [notify, addLog]);

  // Update Autonomous System business role (Customer, Peer, Provider)
  const updateAsRole = useCallback((asId, newRole) => {
    setAses((prev) =>
      prev.map((a) => (a.id === asId ? { ...a, type: newRole } : a))
    );
    notify(`Updated ${asId} role to ${newRole}`, 'info');
    addLog('POLICY_CHANGE', `${asId} tier role set to ${newRole}`, asId, 'info');
  }, [notify, addLog]);

  // Update local-pref policy for an AS pair
  const setAsLocalPref = useCallback((pairKey, val) => {
    setPolicies((prev) => ({
      ...prev,
      asLocalPrefs: {
        ...prev.asLocalPrefs,
        [pairKey]: Number(val),
      },
    }));
    notify(`Updated Local-Pref for ${pairKey} to ${val}`, 'info');
    addLog('POLICY_CHANGE', `Local Preference for ${pairKey} set to ${val}`, pairKey, 'info');
  }, [notify, addLog]);

  // Add new router
  const addRouter = useCallback((newRouter) => {
    setRouters((prev) => [...prev, newRouter]);
    notify(`Added router ${newRouter.id} to ${newRouter.asId}`, 'success');
    addLog('ROUTER_ADD', `Router ${newRouter.id} created with IP ${newRouter.ip}`, newRouter.asId, 'info');
  }, [notify, addLog]);

  // Delete router
  const deleteRouter = useCallback((routerId) => {
    setRouters((prev) => prev.filter((r) => r.id !== routerId));
    setLinks((prev) => prev.filter((l) => l.fromRouter !== routerId && l.toRouter !== routerId));
    notify(`Deleted router ${routerId}`, 'warning');
    addLog('ROUTER_DELETE', `Router ${routerId} decommissioned`, 'TOPOLOGY', 'warning');
  }, [notify, addLog]);

  // Add new link
  const addLink = useCallback((newLink) => {
    setLinks((prev) => [...prev, newLink]);
    notify(`Created link ${newLink.id} between ${newLink.fromRouter} and ${newLink.toRouter}`, 'success');
    addLog('LINK_ADD', `New inter-domain link ${newLink.id} established`, `${newLink.fromAs} ↔ ${newLink.toAs}`, 'info');
  }, [notify, addLog]);

  // Delete link
  const deleteLink = useCallback((linkId) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    notify(`Deleted link ${linkId}`, 'warning');
    addLog('LINK_DELETE', `Link ${linkId} removed from topology`, 'TOPOLOGY', 'warning');
  }, [notify, addLog]);

  // Reset entire network state to defaults
  const resetNetworkToDefault = useCallback(() => {
    setAses(DEFAULT_ASES);
    setRouters(DEFAULT_ROUTERS);
    setLinks(DEFAULT_LINKS);
    setPolicies(DEFAULT_POLICIES);
    setSourceAs('AS1');
    setDestAs('AS4');
    setSelectedElement(null);
    setAlerts(MOCK_ALERTS);
    notify('Network topology and policies reset to default presentation scenario', 'info');
    addLog('SYSTEM_RESET', 'Network state restored to factory baseline topology', 'CORE', 'info');
  }, [notify, addLog]);

  // Clear all roles and link relationships so nothing is assigned automatically
  const clearAllAssignments = useCallback(() => {
    setAses((prev) =>
      prev.map((a) => ({
        ...a,
        type: 'Unassigned',
      }))
    );
    setLinks((prev) =>
      prev.map((l) =>
        l.relationship === 'internal'
          ? l
          : { ...l, relationship: 'unassigned', label: `${l.fromAs} ↔ ${l.toAs} (Unassigned)` }
      )
    );
    setPolicies((prev) => ({
      ...prev,
      asLocalPrefs: {},
    }));
    notify('Cleared all assignments. You can now define Customer, Peer, and Provider manually.', 'info');
    addLog('POLICY_CLEAR', 'All AS roles and link relationships cleared for manual setup', 'POLICY', 'info');
  }, [notify, addLog]);

  // Derive link customer/provider directions directly from configured AS roles
  const applyRolesToLinks = useCallback(() => {
    setLinks((prevLinks) => {
      const asMap = new Map(ases.map((a) => [a.id, a.type]));
      let changesCount = 0;

      const updated = prevLinks.map((l) => {
        if (l.relationship === 'internal') return l;
        const fromRole = asMap.get(l.fromAs) || 'Unassigned';
        const toRole = asMap.get(l.toAs) || 'Unassigned';

        let newRel = l.relationship;
        if (fromRole === 'Customer' && (toRole === 'Provider' || toRole === 'Tier-1')) {
          newRel = 'customer-provider';
        } else if ((fromRole === 'Provider' || fromRole === 'Tier-1') && toRole === 'Customer') {
          newRel = 'provider-customer';
        } else if (fromRole === 'Peer' && toRole === 'Peer') {
          newRel = 'peer-peer';
        } else if ((fromRole === 'Provider' || fromRole === 'Tier-1') && (toRole === 'Provider' || toRole === 'Tier-1')) {
          newRel = 'peer-peer';
        }

        if (newRel !== l.relationship) changesCount++;
        return {
          ...l,
          relationship: newRel,
          label: `${l.fromAs} ↔ ${l.toAs} (${newRel})`,
        };
      });

      notify(`Synchronized ${changesCount} links based on AS roles`, 'info');
      addLog('POLICY_SYNC', `Derived ${changesCount} link relationships from AS roles`, 'POLICY', 'info');
      return updated;
    });
  }, [ases, notify, addLog]);

  // Check if current network is in manual / custom mode
  const isManualMode = ases.some((a) => a.type === 'Unassigned') || links.some((l) => l.relationship === 'unassigned');

  // Compute live overview metrics
  const activeLinksCount = links.filter((l) => l.status === 'ACTIVE').length;
  const healthPercent = Math.round((activeLinksCount / Math.max(1, links.length)) * 100);

  const value = {
    ases,
    routers,
    links,
    policies,
    sourceAs,
    destAs,
    setSourceAs,
    setDestAs,
    selectedElement,
    setSelectedElement,
    bgpResult,
    alerts,
    logs,
    packetHistory,
    setPacketHistory,
    toast,
    notify,
    addLog,
    toggleLinkStatus,
    setLinkStatus,
    updateLinkRelationship,
    updateAsRole,
    setAsLocalPref,
    addRouter,
    deleteRouter,
    addLink,
    deleteLink,
    resetNetworkToDefault,
    clearAllAssignments,
    applyRolesToLinks,
    isManualMode,
    activeLinksCount,
    healthPercent,
    initialMetrics: INITIAL_METRICS,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import {
  ShieldCheck,
  AlertTriangle,
  Send,
  Radio,
  FileCode,
  Sliders,
  Layers,
} from 'lucide-react';
import { EXPORT_RULES, verifyAsPathLoop, generateBgpMessage } from '../engine/policyEngine.js';

export default function PolicyManager() {
  const {
    links,
    policies,
    updateLinkRelationship,
    setAsLocalPref,
    notify,
    bgpResult,
  } = useNetwork();

  // Loop tester interactive state
  const [testAsPathInput, setTestAsPathInput] = useState('65001, 65003, 65005, 65001');
  const [testReceivingAsn, setTestReceivingAsn] = useState('65001');
  const [loopCheckResult, setLoopCheckResult] = useState(null);

  // Synthetic BGP message generator state
  const [bgpMessageType, setBgpMessageType] = useState('ANNOUNCE');
  const [bgpPrefix, setBgpPrefix] = useState('198.18.0.0/24');
  const [generatedMessage, setGeneratedMessage] = useState(null);

  const handleTestLoop = () => {
    const asPathArray = testAsPathInput
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));
    const result = verifyAsPathLoop(asPathArray, Number(testReceivingAsn));
    setLoopCheckResult(result);
  };

  const handleGenerateBgpMessage = () => {
    const msg = generateBgpMessage({
      type: bgpMessageType,
      prefix: bgpPrefix,
      originAsn: 65004,
      asPath: [65005, 65004],
      nextHop: '100.64.0.1',
      localPref: 200,
    });
    setGeneratedMessage(msg);
    notify(`Generated synthetic BGP ${bgpMessageType} UPDATE message`, 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={22} color="var(--accent-cyan)" />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              BGP Policy Configuration & Commercial Relationship Matrix
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Configure Gao-Rexford commercial peering relationships, Local-Pref policy metrics, and valley-free export rules.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Peering Relationships & Local-Pref Tuning */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Link Peering Policy Editor */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sliders size={18} color="var(--accent-cyan)" />
              <span>Inter-Domain Peering Relationships</span>
            </div>
            <span className="badge badge-cyan">CONFIGURABLE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {links
              .filter((l) => l.relationship !== 'internal')
              .map((link) => (
                <div
                  key={link.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
                      {link.fromAs} ↔ {link.toAs}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {link.fromRouter} to {link.toRouter} ({link.id})
                    </div>
                  </div>

                  <select
                    value={link.relationship}
                    onChange={(e) => updateLinkRelationship(link.id, e.target.value)}
                    className="select-field"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    <option value="customer-provider">Customer → Provider</option>
                    <option value="provider-customer">Provider → Customer</option>
                    <option value="peer-peer">Peer ↔ Peer</option>
                  </select>
                </div>
              ))}
          </div>
        </div>

        {/* Local Preference Policy Tuner */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Radio size={18} color="var(--accent-cyan)" />
              <span>Inbound BGP Local Preference (AS1 Outbound Policy)</span>
            </div>
            <span className="badge badge-purple">LOCAL-PREF</span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Set custom BGP Local Preference on AS1 border routers for specific upstream providers. Higher values take priority over shorter AS paths.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
              <div>
                <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
                  Routes Learned via AS3 (Primary Link)
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Default: 220</div>
              </div>
              <input
                type="number"
                value={policies.asLocalPrefs['AS1->AS3'] || 220}
                onChange={(e) => setAsLocalPref('AS1->AS3', e.target.value)}
                className="input-field"
                style={{ width: '80px', textAlign: 'center', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
              <div>
                <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
                  Routes Learned via AS2 (Secondary Link)
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Default: 180</div>
              </div>
              <input
                type="number"
                value={policies.asLocalPrefs['AS1->AS2'] || 180}
                onChange={(e) => setAsLocalPref('AS1->AS2', e.target.value)}
                className="input-field"
                style={{ width: '80px', textAlign: 'center', fontWeight: 700 }}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'rgba(56, 189, 248, 0.05)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              💡 If you set AS1→AS2 Local-Pref to 250 (higher than AS3), AS1 will dynamically switch its outbound traffic to AS2 immediately!
            </div>
          </div>
        </div>
      </div>

      {/* Export Rules Reference Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileCode size={18} color="var(--accent-cyan)" />
            <span>Gao-Rexford Commercial Export Rules & Valley-Free Routing</span>
          </div>
          <span className="badge badge-green">STANDARD RULES</span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Peering Relationship</th>
                <th>Export Rule Name</th>
                <th>Export Behavior</th>
                <th>Commercial Rationale</th>
              </tr>
            </thead>
            <tbody>
              {EXPORT_RULES.map((rule, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="badge badge-cyan">{rule.relationType}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>{rule.ruleName}</td>
                  <td style={{ fontSize: '0.82rem' }}>{rule.behavior}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {rule.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route States Ledger (Accepted, Rejected, Selected, Withdrawn) */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="var(--accent-cyan)" />
            <span>BGP Route States & Decision Ledger</span>
          </div>
          <span className="badge badge-cyan">4 ROUTE LIFECYCLE STATES</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {/* 1. Selected Routes */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>LOC-RIB (FORWARDING)</span>
              <span className="badge badge-cyan">SELECTED</span>
            </div>
            {bgpResult?.bestRoute ? (
              <div>
                <div className="text-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.85rem' }}>
                  {bgpResult.bestRoute.asPath.join(' → ')}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Installed into forwarding table via next-hop {bgpResult.bestRoute.nextHopAs} (Local-Pref {bgpResult.bestRoute.localPref}).
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No path currently selected.</div>
            )}
          </div>

          {/* 2. Accepted Routes */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>ADJ-RIB-IN (ELIGIBLE)</span>
              <span className="badge badge-green">ACCEPTED</span>
            </div>
            {bgpResult?.validRoutes && bgpResult.validRoutes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bgpResult.validRoutes.map((r) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="text-mono" style={{ fontSize: '0.78rem', color: '#f1f5f9' }}>
                      {r.asPath.join(' → ')}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pref {r.localPref}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No candidate routes accepted.</div>
            )}
          </div>

          {/* 3. Rejected Routes */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>POLICY / LOOP VIOLATION</span>
              <span className="badge badge-red">REJECTED</span>
            </div>
            {bgpResult?.rejectedRoutes && bgpResult.rejectedRoutes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bgpResult.rejectedRoutes.slice(0, 3).map((r, i) => (
                  <div key={i}>
                    <span className="text-mono" style={{ fontSize: '0.76rem', color: '#fca5a5' }}>
                      {r.asPath.join(' → ')}
                    </span>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {r.reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>0 rejected routes.</div>
            )}
          </div>

          {/* 4. Withdrawn Routes */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>BGP WITHDRAWAL</span>
              <span className="badge badge-amber">WITHDRAWN</span>
            </div>
            {links.some((l) => l.status === 'FAILED') ? (
              <div>
                <div style={{ fontSize: '0.78rem', color: '#fcd34d', fontWeight: 600 }}>
                  Link {links.find((l) => l.status === 'FAILED')?.id} severed
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  All routes traversing failed interface withdrawn via BGP UPDATE (NLRI removed).
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                No active withdrawals. All peering links healthy.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Loop Detection & UPDATE Message Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* AS Loop Prevention Tester */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={18} color="var(--accent-amber)" />
              <span>AS-Path Loop Prevention Tester (RFC 4271)</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Enter a received AS-PATH sequence and receiver ASN to test whether BGP loop prevention detects and rejects the route:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Received AS-PATH Sequence</label>
              <input
                type="text"
                value={testAsPathInput}
                onChange={(e) => setTestAsPathInput(e.target.value)}
                placeholder="65001, 65003, 65005, 65001"
                className="input-field"
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receiving Router ASN</label>
              <input
                type="text"
                value={testReceivingAsn}
                onChange={(e) => setTestReceivingAsn(e.target.value)}
                placeholder="65001"
                className="input-field"
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            <button onClick={handleTestLoop} className="btn btn-sm btn-primary" style={{ marginTop: '4px' }}>
              Verify Loop Condition
            </button>

            {loopCheckResult && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: loopCheckResult.hasLoop ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${loopCheckResult.hasLoop ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ fontWeight: 700, color: loopCheckResult.hasLoop ? '#fca5a5' : '#86efac', marginBottom: '6px' }}>
                  {loopCheckResult.hasLoop ? '⚠️ ROUTE REJECTED (AS LOOP DETECTED)' : '✓ ROUTE ACCEPTED (LOOP-FREE)'}
                </div>
                {/* Visual AS Path representation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {loopCheckResult.asPath.map((asn, idx) => {
                    const isOffending = Number(asn) === Number(loopCheckResult.receivingAsn);
                    return (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          backgroundColor: isOffending ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.15)',
                          border: `1px solid ${isOffending ? '#ef4444' : 'rgba(56, 189, 248, 0.4)'}`,
                          color: isOffending ? '#fca5a5' : '#e0f2fe',
                        }}
                      >
                        AS{asn} {isOffending ? '(MATCH!)' : ''}
                      </span>
                    );
                  })}
                </div>
                <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{loopCheckResult.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Synthetic BGP UPDATE Inspector */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Send size={18} color="var(--accent-cyan)" />
              <span>BGP UPDATE Message Generator</span>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NLRI Prefix</label>
            <input
              type="text"
              value={bgpPrefix}
              onChange={(e) => setBgpPrefix(e.target.value)}
              placeholder="198.18.0.0/24"
              className="input-field"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => {
                setBgpMessageType('ANNOUNCE');
                handleGenerateBgpMessage();
              }}
              className={`btn btn-sm ${bgpMessageType === 'ANNOUNCE' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Generate Announcement
            </button>
            <button
              onClick={() => {
                setBgpMessageType('WITHDRAW');
                handleGenerateBgpMessage();
              }}
              className={`btn btn-sm ${bgpMessageType === 'WITHDRAW' ? 'btn-danger' : 'btn-secondary'}`}
            >
              Generate Withdrawal
            </button>
          </div>

          {generatedMessage && (
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#f8fafc',
                overflowX: 'auto',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '6px' }}>
                BGP-4 PROTOCOL PACKET (RFC 4271)
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(generatedMessage.rawPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

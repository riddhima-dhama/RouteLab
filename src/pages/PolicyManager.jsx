import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import {
  ShieldCheck,
  AlertTriangle,
  Send,
  Radio,
  FileCode,
  Sliders,
} from 'lucide-react';
import { EXPORT_RULES, verifyAsPathLoop, generateBgpMessage } from '../engine/policyEngine.js';

export default function PolicyManager() {
  const {
    links,
    policies,
    updateLinkRelationship,
    setAsLocalPref,
    notify,
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
            Enter an AS-PATH sequence and receiver ASN to test whether BGP loop prevention detects and rejects the route:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulated AS-PATH Sequence</label>
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
                <div style={{ fontWeight: 700, color: loopCheckResult.hasLoop ? '#fca5a5' : '#86efac', marginBottom: '4px' }}>
                  {loopCheckResult.hasLoop ? '⚠️ ROUTE REJECTED (LOOP DETECTED)' : '✓ ROUTE ACCEPTED (LOOP-FREE)'}
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{loopCheckResult.message}</div>
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

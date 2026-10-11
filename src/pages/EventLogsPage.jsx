import React from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import EventLog from '../components/EventLog.jsx';
import { FileText, Download, RotateCcw } from 'lucide-react';
import { exportToCSV } from '../utils/exportCSV.js';

export default function EventLogsPage() {
  const { logs, bgpResult, resetNetworkToDefault, notify } = useNetwork();

  const handleExportFullTable = () => {
    if (!bgpResult?.validRoutes || bgpResult.validRoutes.length === 0) {
      notify('No routing tables available for export', 'warning');
      return;
    }

    const exportRows = bgpResult.validRoutes.map((r) => ({
      RouteID: r.id,
      IsBest: r.isBest ? 'YES' : 'NO',
      AS_Path: r.asPath.join(' - '),
      Router_Path: r.routerPath.join(' - '),
      Learned_Via: r.learnedVia,
      Local_Preference: r.localPref,
      AS_Path_Length: r.asPathLength,
      Latency_ms: r.totalLatencyMs,
      Bottleneck_BW_Mbps: r.bottleneckBandwidthMbps,
    }));

    exportToCSV(`bgp_loc_rib_table_${Date.now()}`, exportRows);
    notify('Exported BGP Routing Table to CSV', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={22} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                BGP System Event Logs & Telemetry Export
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Search protocol announcements, link state changes, route withdrawals, and export logs to CSV.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportFullTable} className="btn btn-sm btn-primary">
              <Download size={14} /> Export Loc-RIB CSV
            </button>
            <button onClick={resetNetworkToDefault} className="btn btn-sm btn-outline">
              <RotateCcw size={14} /> Reset State
            </button>
          </div>
        </div>
      </div>

      {/* Main Event Log Stream */}
      <EventLog logs={logs} />
    </div>
  );
}

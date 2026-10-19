import React, { useState } from 'react';
import { NetworkProvider, useNetwork } from './context/NetworkContext.jsx';
import Topbar from './components/Topbar.jsx';

import TopologyPage from './pages/TopologyPage.jsx';
import RouteAnalysis from './pages/RouteAnalysis.jsx';
import PacketSimulatorPage from './pages/PacketSimulatorPage.jsx';
import PerformanceFailuresPage from './pages/PerformanceFailuresPage.jsx';

import { CheckCircle2, AlertOctagon, Info, AlertTriangle } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('topology');
  const { toast } = useNetwork();

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'topology':
        return <TopologyPage />;
      case 'bgp-routing':
      case 'routing':
        return <RouteAnalysis />;
      case 'simulator':
        return <PacketSimulatorPage />;
      case 'performance-failures':
      case 'performance':
      case 'failure':
      case 'dynamic-routing':
        return <PerformanceFailuresPage />;
      default:
        return <TopologyPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar with 4 Core Sections */}
      <Topbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="main-content">
        <main className="page-scroll-area">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div className={`toast-banner ${toast.type || 'info'}`}>
          {toast.type === 'success' && <CheckCircle2 size={16} />}
          {toast.type === 'error' && <AlertOctagon size={16} />}
          {toast.type === 'warning' && <AlertTriangle size={16} />}
          {(!toast.type || toast.type === 'info') && <Info size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <AppContent />
    </NetworkProvider>
  );
}

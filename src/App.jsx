import React, { useState } from 'react';
import { NetworkProvider, useNetwork } from './context/NetworkContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';

import Dashboard from './pages/Dashboard.jsx';
import TopologyPage from './pages/TopologyPage.jsx';
import PacketSimulatorPage from './pages/PacketSimulatorPage.jsx';
import FailureSimulation from './pages/FailureSimulation.jsx';
import PerformanceAnalyzerPage from './pages/PerformanceAnalyzerPage.jsx';
import TransportAnalysis from './pages/TransportAnalysis.jsx';
import { CheckCircle2, AlertOctagon, Info, AlertTriangle } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useNetwork();

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'topology':
        return <TopologyPage />;
      case 'simulator':
        return <PacketSimulatorPage />;
      case 'failure':
        return <FailureSimulation />;
      case 'performance':
        return <PerformanceAnalyzerPage />;
      case 'transport':
        return <TransportAnalysis />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main App Layout */}
      <div className="main-content">
        <Topbar activeTab={activeTab} />

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

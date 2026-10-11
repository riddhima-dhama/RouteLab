# RouteLab — BGP Route Analyzer
### Interdomain Routing, Packet Tracing and Performance Analysis

RouteLab is a clean, modern, minimalist network analysis and routing simulation dashboard designed for Computer Networks coursework and laboratory demonstrations.

---

## 🚀 Running the Project (Windows)

```powershell
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in your browser:
# http://localhost:5173
```

---

## 🧭 Application Structure

The interface has been streamlined into a minimalist, focused layout:

1. **Dashboard** (`src/pages/Dashboard.jsx`):
   - 4 essential metric cards: Autonomous Systems, Active Routers, Active Route, and Path Latency.
   - Clean 2-column view with the network topology canvas preview and live traffic trends.

2. **Topology** (`src/pages/TopologyPage.jsx`):
   - Interactive SVG canvas showing Autonomous Systems (AS1 to AS5) and Routers (R1 to R6).
   - Click any router or link to inspect properties in the side drawer.
   - Zoom in/out, pan, and reset controls.

3. **Packet Simulator** (`src/pages/PacketSimulatorPage.jsx`):
   - Hop-by-hop packet forwarding simulation along the active path.
   - Configurable source/destination routers and IPv4 TTL.
   - Real-time TTL decrement at each border gateway with packet drop detection.
   - Trace table with CSV export.

4. **Failure & Reroute** (`src/pages/FailureSimulation.jsx`):
   - Simulate cable cuts (e.g. severing link AS3–AS5) to observe dynamic BGP failover.
   - Side-by-side comparison:
     - **Before Failure**: Primary path `AS1 → AS3 → AS5 → AS4`
     - **After Failure**: Failover path `AS1 → AS2 → AS4`
   - Convergence timeline.

5. **Performance** (`src/pages/PerformanceAnalyzerPage.jsx`):
   - Latency, throughput, packet delivery ratio, and bottleneck capacity.
   - Route comparison charts and telemetry benchmarks with CSV export.

6. **TCP / UDP** (`src/pages/TransportAnalysis.jsx`):
   - TCP Congestion Window (AIMD) simulation comparing Slow Start, Congestion Avoidance, and Fast Retransmit against connectionless UDP.

---

## 🛠️ Tech Stack

- **React 19** with **Vite 8**
- **Vanilla CSS** with clean, minimalist dark theme tokens
- **Lucide React** for minimal icons
- **Recharts** for performance telemetry

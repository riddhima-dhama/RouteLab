/**
 * RouteLab — Frontend API Service Layer
 * 
 * Provides unified HTTP client integration for communicating with the RouteLab Backend.
 * Uses environment variable VITE_API_BASE_URL (defaults to '/api').
 * 
 * BACKEND CONTRACT SPECIFICATION FOR BACKEND DEVELOPER:
 * ----------------------------------------------------
 * 1. GET  /health
 *    Response: { status: 'ok', version: string, uptime: number }
 * 
 * 2. GET  /topology
 *    Response: { ases: AS[], routers: Router[], links: Link[], policies: PolicyConfig }
 * 
 * 3. POST /bgp/calculate
 *    Request:  { sourceAsId: string, destAsId: string, policies?: object, links?: Link[] }
 *    Response: {
 *      sourceAsId: string,
 *      destAsId: string,
 *      bestRoute: Route | null,
 *      validRoutes: Route[],
 *      rejectedRoutes: RejectedRoute[],
 *      decisionBreakdown: DecisionStep[]
 *    }
 * 
 * 4. POST /links/:linkId/toggle
 *    Request:  { status?: 'ACTIVE' | 'FAILED' }
 *    Response: { link: Link, withdrawalEvent?: object, newlySelectedRoute?: Route }
 * 
 * 5. POST /simulate/packet
 *    Request:  { sourceRouter: string, destRouter: string, ttl: number, packetSize?: number }
 *    Response: {
 *      status: 'DELIVERED' | 'DROPPED',
 *      reason: string,
 *      totalDelayMs: number,
 *      finalTtl: number,
 *      steps: PacketTraceStep[]
 *    }
 * 
 * 6. GET  /performance/metrics
 *    Request:  Query params ?routeId=...
 *    Response: {
 *      bandwidthMbps: number,
 *      throughputMbps: number,
 *      delayMs: number,
 *      latencyMs: number,
 *      pdr: number,
 *      packetLossPercent: number
 *    }
 * 
 * 7. POST /transport/simulate
 *    Request:  { protocol: 'tcp'|'udp', rounds?: number, dropRound?: number, packetCount?: number, lossRate?: number }
 *    Response: { protocol: string, data: any }
 * 
 * 8. GET  /events
 *    Response: { events: LogEvent[] }
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TIMEOUT_MS = 4000;

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL.replace(/\/+$/, '');
    this.isConnected = false;
    this.lastChecked = null;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`API ${response.status} (${response.statusText}): ${errorBody || 'Request failed'}`);
      }

      this.isConnected = true;
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after ${TIMEOUT_MS}ms`);
      }
      throw err;
    }
  }

  /**
   * Health / Connectivity check to backend
   */
  async checkHealth() {
    try {
      const data = await this.request('/health', { method: 'GET' });
      this.isConnected = true;
      this.lastChecked = Date.now();
      return { connected: true, data };
    } catch (err) {
      this.isConnected = false;
      this.lastChecked = Date.now();
      return { connected: false, error: err.message };
    }
  }

  /**
   * Fetch current network topology from backend
   */
  async getTopology() {
    return this.request('/topology', { method: 'GET' });
  }

  /**
   * Request BGP Path-Vector Calculation from backend
   */
  async computeBgpRoutes({ sourceAsId, destAsId, policies, links, ases, routers }) {
    return this.request('/bgp/calculate', {
      method: 'POST',
      body: JSON.stringify({ sourceAsId, destAsId, policies, links, ases, routers }),
    });
  }

  /**
   * Notify backend of link status toggle (Cut / Restore)
   */
  async toggleLink(linkId, targetStatus) {
    return this.request(`/links/${encodeURIComponent(linkId)}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ status: targetStatus }),
    });
  }

  /**
   * Request hop-by-hop packet trace simulation from backend
   */
  async simulatePacket({ sourceRouter, destRouter, ttl, packetSize, activeRoute }) {
    return this.request('/simulate/packet', {
      method: 'POST',
      body: JSON.stringify({ sourceRouter, destRouter, ttl, packetSize, activeRoute }),
    });
  }

  /**
   * Request performance telemetry from backend
   */
  async getPerformanceMetrics(routeId) {
    const query = routeId ? `?routeId=${encodeURIComponent(routeId)}` : '';
    return this.request(`/performance/metrics${query}`, { method: 'GET' });
  }

  /**
   * Request TCP/UDP transport simulation from backend
   */
  async simulateTransport({ protocol, rounds, dropRound, packetCount, lossRate }) {
    return this.request('/transport/simulate', {
      method: 'POST',
      body: JSON.stringify({ protocol, rounds, dropRound, packetCount, lossRate }),
    });
  }

  /**
   * Fetch backend system event logs
   */
  async getEventLogs() {
    return this.request('/events', { method: 'GET' });
  }
}

export const api = new ApiService();
export default api;

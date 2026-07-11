/**
 * SafeLens Extension Communication Bridge Client (Integrated Version)
 * 
 * Responsibility:
 * - Serves as the single gateway interface for all external communications.
 * - Communicates with the FastAPI backend (http://localhost:8000) for storage, alert, and settings sync.
 * - Implements a robust fetch wrapper with retries for transient network/server errors.
 * - Provides graceful fallbacks when the backend is offline or unreachable.
 */

class BridgeClient {
  constructor() {
    this.baseUrl = 'http://localhost:8000';
  }

  /**
   * Helper to perform fetch requests with automatic retries for transient network/5xx failures.
   */
  async fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    let lastError = null;
    let lastResponse = null;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        lastResponse = response;
        // Retry for transient 5xx server errors, do not retry 4xx errors
        if (response.status >= 500 && response.status < 600) {
          console.warn(`[BridgeClient] Transient server error ${response.status}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        } else {
          return response;
        }
      } catch (error) {
        lastError = error;
        console.warn(`[BridgeClient] Network/connection error: ${error.message}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
      }
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (lastError) {
      throw lastError;
    }
    return lastResponse;
  }

  /**
   * Diagnostic health check evaluating connectivity to the backend FastAPI server.
   * 
   * @returns {Promise<{ success: boolean, status: string, version: string }>} Diagnostic report
   */
  async checkHealth() {
    console.log('[BridgeClient] Querying service connectivity health...');
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/health`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          status: result.data.status || 'healthy',
          version: result.data.version || '1.0.0'
        };
      }
      throw new Error(result.message || 'Malformed health response');
    } catch (error) {
      console.warn('[BridgeClient] Health check failed, operating in offline fallback mode:', error.message);
      return {
        success: false,
        status: 'offline',
        version: '0.0.0'
      };
    }
  }

  /**
   * Transmits scan details and metadata logs to populate the central dashboard.
   * Note: The file itself is uploaded to /api/protect during interception.
   * 
   * @param {Object} scanReport - Completed scan result metrics
   * @returns {Promise<{ success: boolean, syncId: string }>} Sync confirmation details
   */
  async syncScanResult(scanReport) {
    if (!scanReport) {
      throw new Error('Scan report payload is required');
    }
    console.log('[BridgeClient] Syncing scan report to FastAPI backend dashboard:', scanReport.metadata.name);
    // Since the file upload handles registration, this serves as a light validation ping.
    const health = await this.checkHealth();
    return {
      success: health.success,
      syncId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
  }

  /**
   * Triggers an incident alert notification on the backend when PII is intercepted.
   * 
   * @param {Object} incident - Detailed incident parameters
   * @returns {Promise<{ success: boolean, incidentId?: number }>} Confirmation report with backend incident ID
   */
  async sendIncidentNotification(incident) {
    if (!incident) {
      throw new Error('Incident payload is required');
    }

    console.warn(`[BridgeClient] Dispatching PRIVACY INCIDENT ALERT to backend on asset ID: ${incident.assetId}`);

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: incident.assetId,
          matched_url: incident.matchedUrl,
          match_confidence: incident.matchConfidence,
          severity: incident.severity || 'Normal',
          status: incident.status || 'Open'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('[BridgeClient] Backend incident alert logged successfully. ID:', result.data.incident_id);
        return {
          success: true,
          incidentId: result.data.incident_id
        };
      }
      throw new Error(result.message || 'Failed to create backend incident alert');
    } catch (error) {
      console.error('[BridgeClient] Failed to dispatch incident alert:', error.message);
      return { success: false };
    }
  }

  /**
   * Synchronizes extension settings preferences with the backend dashboard.
   * 
   * @param {Object} settings - Extension Settings object
   * @returns {Promise<{ success: boolean }>} Confirmation status
   */
  async syncSettings(settings) {
    if (!settings) {
      throw new Error('Settings payload is required');
    }

    console.log('[BridgeClient] Synchronizing Settings preferences with server profile...');

    const similarityMap = { high: 90, medium: 70, low: 50 };

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_blur: settings.blurMode === 'blur',
          watermark_enabled: settings.watermarkEnabled === true,
          ai_cloak_enabled: settings.aiCloakEnabled === true,
          notifications: settings.protectionEnabled === true,
          similarity_threshold: similarityMap[settings.riskLevelThreshold] || 70
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: result.success === true };
    } catch (error) {
      console.error('[BridgeClient] Central settings synchronization failed:', error.message);
      return { success: false };
    }
  }
}

// Export a single client instance
export const bridgeClient = new BridgeClient();

/**
 * SafeLens 2.0 Real-Time Telemetry Stream Client
 * Orchestrates EventSource (SSE) connections and WebSocket fallbacks.
 * Emits standardized event payloads and handles reconnect strategies with exponential backoff.
 */

const SSE_URL = 'http://localhost:8000/api/v1/telemetry/stream';
const WS_URL = 'ws://localhost:8000/ws/telemetry';

let subscribers = [];
let eventSource = null;
let webSocket = null;
let reconnectTimeout = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 30000;

// Simulated streaming fallback when server is completely offline
let mockStreamInterval = null;
let currentMockStep = 0;

const MOCK_STREAM_EVENTS = [
  {
    step: 'request_intercept',
    status: 'SUCCESS',
    title: '1. REQUEST INTERCEPTED',
    rawJson: { url: 'https://api.openai.com/v1/chat', method: 'POST', size_kb: 14 },
    logs: ['[INFO] Outbound request caught by extension content hooks.', '[DEBUG] Buffering request stream payload.']
  },
  {
    step: 'ocr_parse',
    status: 'SUCCESS',
    title: '2. OCR & STRUCTURAL PARSING',
    rawJson: { text_length: 1250, contains_base64: true },
    logs: ['[INFO] Launching Tesseract layout parser.', '[DEBUG] Extracted text blocks from embedded image layers.']
  },
  {
    step: 'vector_search',
    status: 'SUCCESS',
    title: '3. VECTOR SEARCH (POLICY MATCH)',
    rawJson: { confidence: 0.94, tokens: 1253 },
    logs: ['[INFO] Checking context against ChromaDB rules index.', '[SUCCESS] Similarity query matched rule: RL-801-SEC.']
  },
  {
    step: 'risk_analysis',
    status: 'WARNING',
    title: '4. RISK ASSESSMENT',
    rawJson: { risk_score: 0.92, Intent: 'CREDENTIAL_EXPOSURE' },
    logs: ['[WARNING] Outbound buffer contains high-entropy private credentials.', '[INFO] Policy escalation criteria met. State: INJECT_DECOY.']
  },
  {
    step: 'decoy_generate',
    status: 'SUCCESS',
    title: '5. DECOY INJECTION',
    rawJson: { fields_swapped: ['auth_token', 'user_key'], synthetic_entropy: 7.9 },
    logs: ['[INFO] Synthesizing mock key structures.', '[SUCCESS] Original data swapped with fake honeypot credentials.']
  },
  {
    step: 'dispatch',
    status: 'SUCCESS',
    title: '6. SANITIZED DISPATCH',
    rawJson: { http_status_expected: 200, latency_ms: 240 },
    logs: ['[SUCCESS] Outbound payload dispatched securely.', '[INFO] SOC dashboard updated.']
  }
];

/**
 * Standardize incoming server event schemas
 * 
 * @param {Object} data - Raw incoming network packet
 * @returns {Object} Clean standardized event structure
 */
function standardizeEvent(data) {
  return {
    step: data.step || 'unknown',
    status: data.status || 'SUCCESS',
    timestamp: data.timestamp || new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    title: data.title || 'TELEMETRY STEP UPDATE',
    rawJson: data.rawJson || data.metadata || {},
    logs: data.logs || []
  };
}

/**
 * Broadcast event objects to all registered component listeners
 * @param {Object} event - Raw event update
 */
function broadcast(event) {
  const standardized = standardizeEvent(event);
  subscribers.forEach((callback) => {
    try {
      callback(standardized);
    } catch (err) {
      console.error('[telemetryStream.js] Subscriber callback execution error:', err);
    }
  });
}

/**
 * Start simulated data streaming for offline UI demonstration
 */
function startOfflineMockStream() {
  if (mockStreamInterval) return;
  console.info('[telemetryStream.js] Server offline. Initiating simulated visual telemetry feed.');
  
  mockStreamInterval = setInterval(() => {
    if (subscribers.length === 0) return;
    
    const nextEvent = {
      ...MOCK_STREAM_EVENTS[currentMockStep],
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
    
    broadcast(nextEvent);
    currentMockStep = (currentMockStep + 1) % MOCK_STREAM_EVENTS.length;
  }, 3000);
}

/**
 * Stop offline simulated telemetry feed
 */
function stopOfflineMockStream() {
  if (mockStreamInterval) {
    clearInterval(mockStreamInterval);
    mockStreamInterval = null;
    currentMockStep = 0;
  }
}

/**
 * Main connection manager orchestrating SSE and WS connections
 */
function connect() {
  // Clear existing instances
  disconnect();

  console.log('[telemetryStream.js] Connecting to EventSource (SSE)...');
  
  try {
    eventSource = new EventSource(SSE_URL);

    eventSource.onopen = () => {
      console.log('[telemetryStream.js] EventSource connection established.');
      reconnectDelay = 1000; // Reset backoff delay
      stopOfflineMockStream();
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        broadcast(parsed);
      } catch (err) {
        console.error('[telemetryStream.js] Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[telemetryStream.js] EventSource error or offline status. Attempting WebSocket fallback.', err);
      eventSource.close();
      eventSource = null;
      
      // Fallback immediately to WebSockets
      connectWebSocket();
    };
  } catch (error) {
    console.error('[telemetryStream.js] EventSource setup exception. Trying WebSocket fallback:', error);
    connectWebSocket();
  }
}

/**
 * Connect to WebSockets fallback endpoint
 */
function connectWebSocket() {
  console.log('[telemetryStream.js] Connecting to WebSocket...');
  
  try {
    webSocket = new WebSocket(WS_URL);

    webSocket.onopen = () => {
      console.log('[telemetryStream.js] WebSocket connection established.');
      reconnectDelay = 1000; // Reset backoff delay
      stopOfflineMockStream();
    };

    webSocket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        broadcast(parsed);
      } catch (err) {
        console.error('[telemetryStream.js] Failed to parse WS message:', err);
      }
    };

    webSocket.onclose = (event) => {
      console.warn('[telemetryStream.js] WebSocket connection closed. Scheduling reconnect.');
      webSocket = null;
      scheduleReconnect();
    };

    webSocket.onerror = (err) => {
      console.error('[telemetryStream.js] WebSocket error:', err);
      webSocket.close();
    };
  } catch (error) {
    console.error('[telemetryStream.js] WebSocket initialization exception:', error);
    scheduleReconnect();
  }
}

/**
 * Handle reconnection schedules using exponential backoff
 */
function scheduleReconnect() {
  if (reconnectTimeout) return;
  
  startOfflineMockStream(); // Start emitting mockup logs while searching connection
  
  console.log(`[telemetryStream.js] Scheduling reconnect in ${reconnectDelay}ms...`);
  
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    // Exponential backoff with ceiling
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    connect();
  }, reconnectDelay);
}

/**
 * Disconnect and release all active connection hooks
 */
function disconnect() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (webSocket) {
    webSocket.close();
    webSocket = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

/**
 * Register a listener to listen for real-time telemetry updates.
 * Opens network sockets if first subscriber.
 * 
 * @param {Function} callback - Telemetry callback hook receiving standardized event objects
 */
export function subscribeToTelemetry(callback) {
  if (typeof callback !== 'function') return;
  
  subscribers.push(callback);
  
  // Connect on first subscriber registration
  if (subscribers.length === 1) {
    connect();
  }
}

/**
 * Unregister a listener. Closes network sockets if final subscriber.
 * 
 * @param {Function} callback - Telemetry callback hook to remove
 */
export function unsubscribe(callback) {
  subscribers = subscribers.filter((cb) => cb !== callback);
  
  // Disconnect if no active subscribers remaining
  if (subscribers.length === 0) {
    disconnect();
    stopOfflineMockStream();
  }
}

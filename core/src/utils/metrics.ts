import client from 'prom-client';

/**
 * 📊 PROMETHEUS METRICS REGISTRY
 * 
 * Centralized metrics collection for the Esparex backend.
 * Provides standard HTTP, DB, and system metrics for Grafana/Prometheus.
 */

// Enable default metrics (CPU, Memory, Event Loop, etc.)
client.collectDefaultMetrics({ prefix: 'esparex_backend_' });

/**
 * HTTP Request Duration Histogram
 * Tracks latency per method, route, and status code.
 */
export const httpRequestDuration = new client.Histogram({
    name: 'esparex_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5] // Optimized for API latency
});

/**
 * Database Query Duration Histogram
 * Tracks MongoDB performance.
 */
export const dbQueryDuration = new client.Histogram({
    name: 'esparex_db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['collection', 'operation'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

/**
 * External API Latency Histogram
 * Tracks 3rd party services (Msg91, Razorpay, etc.)
 */
export const externalApiDuration = new client.Histogram({
    name: 'esparex_external_api_duration_seconds',
    help: 'Duration of external API calls in seconds',
    labelNames: ['service', 'endpoint', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
});

/**
 * WebSocket Connection Gauge
 */
export const activeWebSocketConnections = new client.Gauge({
    name: 'esparex_socket_connections_total',
    help: 'Total number of active WebSocket connections'
});

/**
 * Listing Creation Counter
 * Tracks total listings created, segmented by type and actor.
 * Looked up by AdOrchestrator after each successful createAd call.
 */
export const listingCreationTotal = new client.Counter({
    name: 'esparex_listing_creation_total',
    help: 'Total number of listings created',
    labelNames: ['listingType', 'actor'] as const,
});

export const register = client.register;
export default client;

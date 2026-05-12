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

/**
 * Listing Status Transition Counter
 * Tracks all status mutations across the platform.
 */
export const listingStatusTransitionsTotal = new client.Counter({
    name: 'esparex_listing_status_transitions_total',
    help: 'Total number of listing status transitions',
    labelNames: ['fromStatus', 'toStatus', 'actorType', 'listingType'] as const,
});

/**
 * API Error Counter
 * Tracks error responses by method/route/status.
 */
export const httpErrorsTotal = new client.Counter({
    name: 'esparex_http_errors_total',
    help: 'Total number of HTTP error responses',
    labelNames: ['method', 'route', 'status'],
});

/**
 * API Error Rate Gauge
 * Sliding-window error rate (ratio 0-1).
 */
export const httpErrorRate = new client.Gauge({
    name: 'esparex_http_error_rate_ratio',
    help: 'Sliding-window HTTP error rate ratio (0-1)',
});

/**
 * Queue Job Processing Duration
 * Tracks worker processing time by queue/job/status.
 */
export const queueJobDuration = new client.Histogram({
    name: 'esparex_queue_job_duration_seconds',
    help: 'Duration of queue job processing in seconds',
    labelNames: ['queue', 'job', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 3, 5, 10, 30, 60],
});

/**
 * Queue Job Failures Counter
 * Tracks worker and queue failure events.
 */
export const queueJobFailuresTotal = new client.Counter({
    name: 'esparex_queue_job_failures_total',
    help: 'Total failed queue jobs',
    labelNames: ['queue', 'job', 'reason'],
});

/**
 * Queue Job Processed Counter
 */
export const queueJobsProcessedTotal = new client.Counter({
    name: 'esparex_queue_jobs_processed_total',
    help: 'Total processed queue jobs',
    labelNames: ['queue', 'job', 'status'],
});

/**
 * Dependency Health Gauges
 */
export const dbConnectionStatus = new client.Gauge({
    name: 'esparex_db_connection_status',
    help: 'Database connection status (1=up, 0=down)',
    labelNames: ['database'],
});

export const redisConnectionStatus = new client.Gauge({
    name: 'esparex_redis_connection_status',
    help: 'Redis connection status (1=up, 0=down)',
});

export const queueStatusGauge = new client.Gauge({
    name: 'esparex_queue_status',
    help: 'Queue status (1=up, 0.5=degraded, 0=down)',
    labelNames: ['queue'],
});

export const workerStatusGauge = new client.Gauge({
    name: 'esparex_worker_status',
    help: 'Worker status (1=up, 0=down)',
    labelNames: ['worker'],
});

/**
 * Reliability Alert Counter
 */
export const reliabilityAlertsTotal = new client.Counter({
    name: 'esparex_reliability_alerts_total',
    help: 'Total emitted reliability alerts',
    labelNames: ['type', 'severity'],
});

export const register = client.register;
export default client;

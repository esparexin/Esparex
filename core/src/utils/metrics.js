"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.listingCreationTotal = exports.activeWebSocketConnections = exports.externalApiDuration = exports.dbQueryDuration = exports.httpRequestDuration = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
/**
 * 📊 PROMETHEUS METRICS REGISTRY
 *
 * Centralized metrics collection for the Esparex backend.
 * Provides standard HTTP, DB, and system metrics for Grafana/Prometheus.
 */
// Enable default metrics (CPU, Memory, Event Loop, etc.)
prom_client_1.default.collectDefaultMetrics({ prefix: 'esparex_backend_' });
/**
 * HTTP Request Duration Histogram
 * Tracks latency per method, route, and status code.
 */
exports.httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'esparex_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5] // Optimized for API latency
});
/**
 * Database Query Duration Histogram
 * Tracks MongoDB performance.
 */
exports.dbQueryDuration = new prom_client_1.default.Histogram({
    name: 'esparex_db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['collection', 'operation'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1]
});
/**
 * External API Latency Histogram
 * Tracks 3rd party services (Msg91, Razorpay, etc.)
 */
exports.externalApiDuration = new prom_client_1.default.Histogram({
    name: 'esparex_external_api_duration_seconds',
    help: 'Duration of external API calls in seconds',
    labelNames: ['service', 'endpoint', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
});
/**
 * WebSocket Connection Gauge
 */
exports.activeWebSocketConnections = new prom_client_1.default.Gauge({
    name: 'esparex_socket_connections_total',
    help: 'Total number of active WebSocket connections'
});
/**
 * Listing Creation Counter
 * Tracks total listings created, segmented by type and actor.
 * Looked up by AdOrchestrator after each successful createAd call.
 */
exports.listingCreationTotal = new prom_client_1.default.Counter({
    name: 'esparex_listing_creation_total',
    help: 'Total number of listings created',
    labelNames: ['listingType', 'actor'],
});
exports.register = prom_client_1.default.register;
exports.default = prom_client_1.default;
//# sourceMappingURL=metrics.js.map
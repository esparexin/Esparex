export interface NotificationEvent {
  timestamp: number;
  type: "error" | "warning" | "info" | "success" | "confirm";
  code?: string;
  message: string;
  endpoint?: string;
  source?: string;
  count?: number;
}

export interface NotificationMetrics {
  totalEvents: number;
  byType: Record<string, number>;
  byErrorCode: Record<string, number>;
  byEndpoint: Record<string, number>;
}

const metrics: NotificationMetrics = {
  totalEvents: 0,
  byType: {},
  byErrorCode: {},
  byEndpoint: {},
};



function increment(record: Record<string, number>, key: string | undefined, amount: number) {
  if (!key) return;
  record[key] = (record[key] ?? 0) + amount;
}

function maybeLogDevSummary() {
  // Disabled as per user request to clean up console noise.
}

export function recordNotificationEvent(event: NotificationEvent) {
  const incrementBy = Math.max(1, event.count ?? 1);
  metrics.totalEvents += incrementBy;
  increment(metrics.byType, event.type, incrementBy);
  increment(metrics.byErrorCode, event.code, incrementBy);
  increment(metrics.byEndpoint, event.endpoint, incrementBy);
  maybeLogDevSummary();
}

export function getNotificationMetrics(): NotificationMetrics {
  return {
    totalEvents: metrics.totalEvents,
    byType: { ...metrics.byType },
    byErrorCode: { ...metrics.byErrorCode },
    byEndpoint: { ...metrics.byEndpoint },
  };
}

export function getTopErrors(limit = 5) {
  return Object.entries(metrics.byErrorCode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function getTopFailingEndpoints(limit = 5) {
  return Object.entries(metrics.byEndpoint)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function resetNotificationMetrics() {
  metrics.totalEvents = 0;
  metrics.byType = {};
  metrics.byErrorCode = {};
  metrics.byEndpoint = {};
}

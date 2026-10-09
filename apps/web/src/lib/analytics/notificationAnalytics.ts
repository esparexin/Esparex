export interface NotificationEvent {
  timestamp: number;
  type: "error" | "warning" | "info" | "success" | "confirm";
  code?: string;
  message: string;
  endpoint?: string;
  source?: string;
  count?: number;
}

interface NotificationMetrics {
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





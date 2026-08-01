import axios, { AxiosError, AxiosRequestConfig } from 'axios';

type QueuedRequest = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  config: AxiosRequestConfig;
};

export type RefreshExecutor = () => Promise<string | null>;

let refreshExecutor: RefreshExecutor | null = null;
let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

/**
 * Sets the injectable refresh executor to decouple authentication 
 * logic from the API infrastructure.
 */
export const setRefreshExecutor = (executor: RefreshExecutor) => {
  refreshExecutor = executor;
};

/**
 * Processes the queue of failed requests.
 * @param error - If present, rejects all queued requests with this error.
 * @param token - If present, resolves all queued requests.
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Enqueues a failed request or initiates a refresh if one isn't already in progress.
 */
export const handleRefresh = async (failedRequestConfig: AxiosRequestConfig): Promise<unknown> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject, config: failedRequestConfig });
    });
  }

  isRefreshing = true;

  return new Promise((resolve, reject) => {
    // Add the original request to the queue to be retried
    failedQueue.push({ resolve, reject, config: failedRequestConfig });

    if (!refreshExecutor) {
      const err = new Error('Refresh executor is not configured.');
      processQueue(err, null);
      isRefreshing = false;
      return;
    }

    refreshExecutor()
      .then((token) => {
        processQueue(null, token);
      })
      .catch((err) => {
        processQueue(err, null);
      })
      .finally(() => {
        isRefreshing = false;
      });
  });
};

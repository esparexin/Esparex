type LogMethod = (...args: unknown[]) => void;

const isTestEnv = process.env.NODE_ENV === "test";

const passthrough = (method: LogMethod): LogMethod => {
  if (isTestEnv) {
    return () => {
      // Intentionally no-op in test to keep output deterministic.
    };
  }

  return (...args: unknown[]) => method(...args);
};

const logger = {
  debug: passthrough(console.debug),
  info: passthrough(console.info),
  warn: passthrough(console.warn),
  error: passthrough(console.error),
};

export default logger;

export const checkOnlineStatus = (): boolean => navigator.onLine;

export const requireOnline = (operation: string): void => {
  if (!checkOnlineStatus()) { const { createNetworkError } = require("./factories"); const err = createNetworkError(operation); if (err) throw err; }
};

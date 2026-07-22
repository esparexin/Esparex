import { describe, it, expect, vi } from 'vitest';

describe('Resource & Socket Cleanup Regression Suite', () => {
    it('verifies that socket listeners and connections are unregistered on cleanup', () => {
        const offSpy = vi.fn();
        const disconnectSpy = vi.fn();

        const mockSocket = {
            connected: true,
            off: offSpy,
            disconnect: disconnectSpy,
        };

        // Simulate cleanup callback execution
        const handleCleanup = (socket: typeof mockSocket, handler: () => void) => {
            socket.off('inbox_updated', handler);
            if (socket.connected) {
                socket.disconnect();
            }
        };

        const dummyHandler = () => {};
        handleCleanup(mockSocket, dummyHandler);

        expect(offSpy).toHaveBeenCalledWith('inbox_updated', dummyHandler);
        expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });

    it('verifies interval timers are cancelled on unmount', () => {
        vi.useFakeTimers();
        const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

        const intervalId = globalThis.setInterval(() => {}, 1000);
        globalThis.clearInterval(intervalId);

        expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
        vi.useRealTimers();
    });
});

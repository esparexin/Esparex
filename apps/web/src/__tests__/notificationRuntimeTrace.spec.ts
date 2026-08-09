import { popupBus, subscribePopupEvents } from "@/lib/popup";
import { notify } from "@/lib/feedback";
import { popupQueueReducer, initialPopupQueueState } from "@esparex/shared";
import { vi } from "vitest";

describe("Notification Pipeline Runtime Instrumentation", () => {
    beforeAll(() => {
        // Mock window object for node environment testing of feedback.ts
        if (typeof window === "undefined") {
            (global as any).window = {};
        }
    });

    afterAll(() => {
        delete (global as any).window;
    });

    it("1. Singleton Identity Verification — notify and popupEvents use exact same popupBus instance", () => {
        expect(popupBus).toBeDefined();
        const listenerMock = vi.fn();
        const unsubscribe = subscribePopupEvents(listenerMock);

        notify.success("Runtime Identity Test");

        expect(listenerMock).toHaveBeenCalledTimes(1);
        const emittedPayload = listenerMock.mock.calls[0]?.[0];
        expect(emittedPayload).toMatchObject({
            type: "success",
            title: "Success",
            message: "Runtime Identity Test",
            open: true,
        });

        unsubscribe();
    });

    it("2. Reducer State Transition Verification — null activePopup transitions to non-null DTO", () => {
        const initialState = initialPopupQueueState;
        expect(initialState.activePopup).toBeNull();
        expect(initialState.queue).toHaveLength(0);

        const samplePopup = {
            id: "web-test-123",
            open: true,
            type: "success" as const,
            title: "Success",
            message: "State Transition Verified",
        };

        const nextState = popupQueueReducer(initialState, {
            type: "RECEIVE_POPUP",
            popup: samplePopup,
        });

        expect(nextState.activePopup).not.toBeNull();
        expect(nextState.activePopup).toMatchObject({
            id: "web-test-123",
            open: true,
            type: "success",
            title: "Success",
            message: "State Transition Verified",
            count: 1,
        });
    });

    it("3. Deduplication Window Verification — rejects identical emission within 2000ms", () => {
        const listenerMock = vi.fn();
        const unsubscribe = subscribePopupEvents(listenerMock);

        // First emission
        popupBus.show({
            type: "info",
            title: "Dedupe Test",
            message: "Duplicate Message",
        });

        expect(listenerMock).toHaveBeenCalledTimes(1);

        // Second emission within 2000ms with identical key
        const id2 = popupBus.show({
            type: "info",
            title: "Dedupe Test",
            message: "Duplicate Message",
        });

        // listenerMock should NOT have been called a second time
        expect(listenerMock).toHaveBeenCalledTimes(1);
        expect(id2).toBe("info::Dedupe Test::Duplicate Message");

        unsubscribe();
    });

    it("4. Dismissal State Transition Verification — HIDE_POPUP clears activePopup and promotes queue", () => {
        const activeState = {
            queue: [],
            activePopup: {
                id: "web-test-456",
                open: true,
                type: "info" as const,
                title: "Info",
                message: "To be closed",
            },
        };

        const closedState = popupQueueReducer(activeState, {
            type: "HIDE_POPUP",
            id: "web-test-456",
        });

        expect(closedState.activePopup).toBeNull();
    });

    it("5. Queue Priority Verification — Error popups (priority 3) promote ahead of Info popups (priority 1)", () => {
        const initialState = initialPopupQueueState;
        
        // Receive lower priority popup first
        const state1 = popupQueueReducer(initialState, {
            type: "RECEIVE_POPUP",
            popup: { id: "p1", open: true, type: "info", title: "Info", message: "Low priority" },
        });

        expect(state1.activePopup?.id).toBe("p1");

        // Receive higher priority popup while p1 is active
        const state2 = popupQueueReducer(state1, {
            type: "RECEIVE_POPUP",
            popup: { id: "p2", open: true, type: "error", title: "Error", message: "High priority" },
        });

        // High priority enters queue at position 0
        expect(state2.queue[0]?.id).toBe("p2");

        // Dismiss active p1 -> p2 is promoted immediately
        const state3 = popupQueueReducer(state2, {
            type: "HIDE_POPUP",
            id: "p1",
        });

        expect(state3.activePopup?.id).toBe("p2");
    });
});

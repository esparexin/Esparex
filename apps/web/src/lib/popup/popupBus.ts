import { createUnifiedPopupBus } from "@esparex/shared";

const popupBus = createUnifiedPopupBus("web");

export const subscribePopupEvents = popupBus.subscribe;
export const emitPopupEvent = popupBus.show;
export const hidePopupEvent = popupBus.hide;
export { popupBus };

declare global {
  interface Window {
    __esparex_emitPopup?: typeof popupBus.show;
  }
}

if (typeof window !== "undefined") {
  window.__esparex_emitPopup = popupBus.show;
}


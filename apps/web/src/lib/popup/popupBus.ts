import { createUnifiedPopupBus } from "@esparex/shared";

const popupBus = createUnifiedPopupBus("web");

export const subscribePopupEvents = popupBus.subscribe;
export const emitPopupEvent = popupBus.show;
export const hidePopupEvent = popupBus.hide;
export { popupBus };

if (typeof window !== "undefined") {
  (window as any).__esparex_emitPopup = popupBus.show;
}


import { createUnifiedPopupBus } from "@shared";

const popupBus = createUnifiedPopupBus("web");

export const subscribePopupEvents = popupBus.subscribe;
export const emitPopupEvent = popupBus.show;
export const hidePopupEvent = popupBus.hide;
export { popupBus };

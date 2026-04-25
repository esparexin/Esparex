export declare const MOBILE_VISIBILITY: {
    readonly SHOW: "show";
    readonly HIDE: "hide";
    readonly ON_REQUEST: "on-request";
};
export declare const MOBILE_VISIBILITY_VALUES: ("show" | "hide" | "on-request")[];
export type MobileVisibilityValue = (typeof MOBILE_VISIBILITY_VALUES)[number];
export declare function normalizeMobileVisibility(value: unknown, fallback?: MobileVisibilityValue): MobileVisibilityValue;

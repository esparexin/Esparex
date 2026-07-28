import type { ZodTypeAny } from "zod";
import type { LISTING_TYPE } from "@esparex/contracts";
import type { AccountListingSection } from "@/lib/accountListingRoutes";
import type { LucideIcon } from "@/icons/IconRegistry";

export interface ListingFormConfig {
    /** Target listing type: SERVICE or SPARE_PART */
    listingType: typeof LISTING_TYPE.SERVICE | typeof LISTING_TYPE.SPARE_PART;

    /** Zod validation schema */
    schema: ZodTypeAny;

    /** Display name of entity (e.g. "Service", "Spare Part") */
    entityLabel: string;

    /** Section key for pending listings route ("services" | "spare-parts") */
    pendingSection: AccountListingSection;

    /** Form HTML ID */
    formId: string;

    /** Primary icon component */
    icon: LucideIcon;

    /** RHF field name for catalog selection ("serviceTypeIds" or "sparePartTypeId") */
    catalogFieldName: "serviceTypeIds" | "sparePartTypeId";

    /** Catalog section label */
    catalogLabel: string;

    /** Selection mode: multi-select (Service) vs single-select (Spare Part) */
    catalogMultiSelect: boolean;

    /** Grid layout class (e.g. "grid-cols-2", "grid-cols-3") */
    catalogGridCols: string;

    /** Empty category error message when no catalog items exist */
    catalogEmptyErrorMessage: string;

    /** Title field configuration */
    titleProps: {
        label: string;
        placeholder: string;
        maxLength: number;
    };

    /** Description field configuration */
    descriptionProps: {
        label?: string;
        placeholder: string;
        maxLength: number;
    };

    /** Initial default values for form initialization */
    defaultValues: Record<string, unknown>;
}

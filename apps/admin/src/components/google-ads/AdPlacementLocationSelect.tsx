import { AD_PLACEMENT_LOCATION, type AdPlacementLocationValue } from "@esparex/contracts";

interface AdPlacementLocationSelectProps {
    value: AdPlacementLocationValue;
    isCreating: boolean;
    onChange: (nextLoc: AdPlacementLocationValue) => void;
}

export function AdPlacementLocationSelect({ value, isCreating: _isCreating, onChange }: AdPlacementLocationSelectProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as AdPlacementLocationValue)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            aria-label="Ad Placement Location"
        >
            <optgroup label="Homepage">
                <option value={AD_PLACEMENT_LOCATION.HOMEPAGE_HERO}>Homepage — Hero Top Leaderboard</option>
                <option value={AD_PLACEMENT_LOCATION.HOMEPAGE_FEED}>Homepage — Feed Inline Native</option>
            </optgroup>
            <optgroup label="Search & Catalog">
                <option value={AD_PLACEMENT_LOCATION.SEARCH_RESULTS_HEADER}>Search Results — Header Top Banner</option>
                <option value={AD_PLACEMENT_LOCATION.SEARCH_RESULTS_INLINE}>Search Results — Grid Inline Card</option>
            </optgroup>
            <optgroup label="Category Pages">
                <option value={AD_PLACEMENT_LOCATION.CATEGORY_HEADER}>Category Page — Top Leaderboard</option>
                <option value={AD_PLACEMENT_LOCATION.CATEGORY_INLINE}>Category Page — Feed Inline Card</option>
            </optgroup>
            <optgroup label="Listing Details">
                <option value={AD_PLACEMENT_LOCATION.LISTING_DETAILS_SIDEBAR}>Listing Detail — Sidebar Right Rail</option>
                <option value={AD_PLACEMENT_LOCATION.LISTING_DETAILS_INCONTENT}>Listing Detail — In-Content Bottom Banner</option>
            </optgroup>
            <optgroup label="Services & Spare Parts">
                <option value={AD_PLACEMENT_LOCATION.SERVICES_HEADER}>Browse Services — Header Top Banner</option>
                <option value={AD_PLACEMENT_LOCATION.SPARE_PARTS_HEADER}>Spare Parts — Header Top Banner</option>
            </optgroup>
            <optgroup label="Business Profiles">
                <option value={AD_PLACEMENT_LOCATION.BUSINESS_PROFILE_SIDEBAR}>Business Profile — Right Rail Sidebar</option>
            </optgroup>
            <optgroup label="User Account (Private)">
                <option value={AD_PLACEMENT_LOCATION.USER_DASHBOARD_TOP}>User Dashboard — Top Banner</option>
                <option value={AD_PLACEMENT_LOCATION.USER_MY_LISTINGS_INLINE}>My Listings — In-Feed Native Card</option>
            </optgroup>
            <optgroup label="Business Dashboard (Private)">
                <option value={AD_PLACEMENT_LOCATION.BUSINESS_DASHBOARD_TOP}>Business Dashboard — Top Banner</option>
            </optgroup>
            <optgroup label="Footer & Mobile">
                <option value={AD_PLACEMENT_LOCATION.STATIC_PAGES_FOOTER}>Static Pages (About/FAQ) — Bottom Leaderboard</option>
                <option value={AD_PLACEMENT_LOCATION.FOOTER_LEADERBOARD}>Global Footer — Leaderboard Banner</option>
                <option value={AD_PLACEMENT_LOCATION.MOBILE_STICKY_BOTTOM}>Mobile Viewport — Sticky Bottom Banner</option>
            </optgroup>
        </select>
    );
}


/**
 * NominatimGeocode.ts — Free OpenStreetMap reverse geocode integration.
 *
 * Calls Nominatim to resolve GPS coordinates to the correct city/mandal/taluk
 * name, then matches the result back to the internal Location DB.
 *
 * Why: The Location DB has ~38k settlements ALL classified as level "city",
 * including tiny hamlets. MongoDB $near returns the closest hamlet by point
 * distance, which is often NOT the city/mandal users expect.
 * Nominatim returns the correct administrative hierarchy (like Google Maps).
 */

import {
    https,
    logger,
    locationRepository,
    escapeRegExp,
    normalizeLocationNameForSearch,
    withPublicCanonicalLocationFilter,
} from './_shared/locationServiceBase';
import type { LocationInputObject } from './_shared/locationServiceBase';

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface NominatimAddress {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
    postcode?: string;
}

export interface NominatimResult {
    /** Best city/town/mandal name from Nominatim */
    cityName: string;
    /** The county/mandal name (administrative unit above village) */
    countyName: string | null;
    state: string;
    country: string;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const NOMINATIM_TIMEOUT_MS = 4000;
const SETTLEMENT_SELECT_FIELDS =
    'name country level coordinates isPopular isActive verificationStatus parentId path pincode';

/* -------------------------------------------------------------------------- */
/* NOMINATIM HTTP CALL                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Calls Nominatim reverse geocode API at zoom=10 (city/county level).
 * Returns the resolved city/county name or null on failure/timeout.
 */
export const reverseGeocodeViaNominatim = (
    lat: number,
    lng: number,
): Promise<NominatimResult | null> => {
    return new Promise((resolve) => {
        const url =
            `https://nominatim.openstreetmap.org/reverse?format=json` +
            `&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

        const req = https.get(
            url,
            {
                headers: { 'User-Agent': 'Esparex/1.0 (reverse-geocode)' },
                timeout: NOMINATIM_TIMEOUT_MS,
            },
            (res) => {
                let data = '';
                res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data) as {
                            name?: string;
                            address?: NominatimAddress;
                            display_name?: string;
                        };

                        if (!result?.address) return resolve(null);

                        const addr = result.address;
                        const cityName =
                            addr.city || addr.town || addr.county || addr.village || result.name || '';
                        const countyName = addr.county || null;
                        const state = addr.state || '';

                        if (!cityName || !state) return resolve(null);

                        logger.info('Nominatim reverse geocode result.', {
                            lat, lng, cityName, countyName, state,
                            displayName: result.display_name,
                        });

                        resolve({ cityName, countyName, state, country: addr.country || 'India' });
                    } catch {
                        resolve(null);
                    }
                });
            },
        );

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
};

/* -------------------------------------------------------------------------- */
/* DB LOCATION MATCHING BY NAME                                               */
/* -------------------------------------------------------------------------- */

/**
 * Try to find a DB location matching a name string.
 * Searches by normalized name, optionally constrained to nearby coordinates.
 */
const findDbLocationByName = async (
    name: string,
    lat: number,
    lng: number,
    maxDistanceMeters: number,
): Promise<LocationInputObject | null> => {
    const normalizedName = normalizeLocationNameForSearch(name);
    const nameRegex = new RegExp(`^${escapeRegExp(name)}$`, 'i');

    // First: exact name match + nearby coordinates
    const byNameAndProximity = await locationRepository
        .findOne(withPublicCanonicalLocationFilter({
            $or: [{ normalizedName }, { name: nameRegex }],
            coordinates: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: maxDistanceMeters,
                },
            },
        }))
        .select(SETTLEMENT_SELECT_FIELDS)
        .lean<LocationInputObject | null>();

    if (byNameAndProximity) return byNameAndProximity;

    // Fallback: name match without proximity constraint
    return locationRepository
        .findOne(withPublicCanonicalLocationFilter({
            $or: [{ normalizedName }, { name: nameRegex }],
        }))
        .select(SETTLEMENT_SELECT_FIELDS)
        .sort({ isPopular: -1, priority: -1 })
        .lean<LocationInputObject | null>();
};

/* -------------------------------------------------------------------------- */
/* PUBLIC: RESOLVE SETTLEMENT WITH NOMINATIM                                  */
/* -------------------------------------------------------------------------- */

/**
 * Uses Nominatim to identify the correct city/mandal for coordinates,
 * then matches the name back to the internal Location DB for proper
 * IDs, hierarchy, and canonical display formatting.
 *
 * Returns the matched DB location or null if Nominatim is unavailable
 * or no DB match is found.
 */
export const resolveSettlementWithNominatim = async (
    lat: number,
    lng: number,
    maxDistanceMeters: number,
): Promise<LocationInputObject | null> => {
    const nominatim = await reverseGeocodeViaNominatim(lat, lng);
    if (!nominatim) return null;

    // Try city/town name first (e.g. "Macherla")
    const byCity = await findDbLocationByName(
        nominatim.cityName, lat, lng, maxDistanceMeters,
    );
    if (byCity) {
        logger.info('Nominatim-enhanced: matched DB location by city name.', {
            nominatimCity: nominatim.cityName, dbName: byCity.name, dbLevel: byCity.level,
        });
        return byCity;
    }

    // Try county/mandal name if different from city
    if (nominatim.countyName && nominatim.countyName !== nominatim.cityName) {
        const byCounty = await findDbLocationByName(
            nominatim.countyName, lat, lng, maxDistanceMeters,
        );
        if (byCounty) {
            logger.info('Nominatim-enhanced: matched DB location by county name.', {
                nominatimCounty: nominatim.countyName, dbName: byCounty.name, dbLevel: byCounty.level,
            });
            return byCounty;
        }
    }

    logger.warn('Nominatim returned city but no DB match found.', {
        nominatimCity: nominatim.cityName,
        nominatimCounty: nominatim.countyName,
        lat, lng,
    });
    return null;
};

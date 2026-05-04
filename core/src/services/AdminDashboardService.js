"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetLocationAnalyticsData = exports.getAnalyticsLocations = exports.getHotZoneLocations = exports.getLocationAnalyticsRawData = exports.updateContactSubmissionById = exports.getContactSubmissionsPaginated = exports.getRecentAdminLogs = exports.getDashboardCardStats = exports.getDashboardOverviewStats = void 0;
const User_1 = __importDefault(require("@core/models/User"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const Model_1 = __importDefault(require("@core/models/Model"));
const Report_1 = __importDefault(require("@core/models/Report"));
const Business_1 = __importDefault(require("@core/models/Business"));
const RevenueAnalytics_1 = __importDefault(require("@core/models/RevenueAnalytics"));
const ContactSubmission_1 = __importDefault(require("@core/models/ContactSubmission"));
const Location_1 = __importDefault(require("@core/models/Location"));
const LocationAnalytics_1 = __importDefault(require("@core/models/LocationAnalytics"));
const AdminLog_1 = __importDefault(require("@core/models/AdminLog"));
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const listingType_1 = require("@core/constants/enums/listingType");
const businessStatus_1 = require("@core/constants/enums/businessStatus");
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const reportStatus_1 = require("@core/constants/enums/reportStatus");
const userStatus_1 = require("@core/constants/enums/userStatus");
const stringUtils_1 = require("@core/utils/stringUtils");
const locationHierarchy_1 = require("@core/utils/locationHierarchy");
const getDashboardOverviewStats = async (publicAdFilter) => {
    const [totalUsers, unifiedStats, pendingModels, openReports, pendingBusinesses, totalRevenueAgg] = await Promise.all([
        User_1.default.countDocuments(),
        Ad_1.default.aggregate([
            {
                $facet: {
                    totalAds: [{ $match: { listingType: listingType_1.LISTING_TYPE.AD } }, { $count: "count" }],
                    activeAds: [{ $match: { listingType: listingType_1.LISTING_TYPE.AD, ...publicAdFilter } }, { $count: "count" }],
                    pendingAds: [{ $match: { listingType: listingType_1.LISTING_TYPE.AD, status: listingStatus_1.LISTING_STATUS.PENDING } }, { $count: "count" }],
                    totalServices: [{ $match: { listingType: listingType_1.LISTING_TYPE.SERVICE } }, { $count: "count" }],
                    activeServices: [{ $match: { listingType: listingType_1.LISTING_TYPE.SERVICE, ...publicAdFilter } }, { $count: "count" }],
                    pendingServices: [{ $match: { listingType: listingType_1.LISTING_TYPE.SERVICE, status: listingStatus_1.LISTING_STATUS.PENDING } }, { $count: "count" }],
                    rejectedServices: [{ $match: { listingType: listingType_1.LISTING_TYPE.SERVICE, status: listingStatus_1.LISTING_STATUS.REJECTED } }, { $count: "count" }],
                    totalSpareParts: [{ $match: { listingType: listingType_1.LISTING_TYPE.SPARE_PART } }, { $count: "count" }],
                    activeSpareParts: [{ $match: { listingType: listingType_1.LISTING_TYPE.SPARE_PART, ...publicAdFilter } }, { $count: "count" }],
                    pendingSpareParts: [{ $match: { listingType: listingType_1.LISTING_TYPE.SPARE_PART, status: listingStatus_1.LISTING_STATUS.PENDING } }, { $count: "count" }]
                }
            }
        ]),
        Model_1.default.countDocuments({ status: catalogStatus_1.CATALOG_STATUS.PENDING }),
        Report_1.default.countDocuments({ status: reportStatus_1.REPORT_STATUS.OPEN }),
        Business_1.default.countDocuments({ status: businessStatus_1.BUSINESS_STATUS.PENDING }),
        RevenueAnalytics_1.default.aggregate([{ $group: { _id: null, total: { $sum: "$totalRevenue" } } }])
    ]);
    return { totalUsers, unifiedStats, pendingModels, openReports, pendingBusinesses, totalRevenueAgg };
};
exports.getDashboardOverviewStats = getDashboardOverviewStats;
const getDashboardCardStats = async (publicAdFilter) => {
    const [totalUsers, adStats, totalReports, totalBusinesses, totalRevenueAgg] = await Promise.all([
        User_1.default.countDocuments(),
        Ad_1.default.aggregate([
            {
                $facet: {
                    live: [{ $match: { listingType: listingType_1.LISTING_TYPE.AD, ...publicAdFilter } }, { $count: "count" }],
                    pending: [{ $match: { listingType: listingType_1.LISTING_TYPE.AD, status: listingStatus_1.LISTING_STATUS.PENDING } }, { $count: "count" }]
                }
            }
        ]),
        Report_1.default.countDocuments({ status: { $in: [reportStatus_1.REPORT_STATUS.OPEN, reportStatus_1.REPORT_STATUS.PENDING] } }),
        Business_1.default.countDocuments({ isDeleted: { $ne: true } }),
        RevenueAnalytics_1.default.aggregate([{ $group: { _id: null, total: { $sum: "$totalRevenue" } } }])
    ]);
    return { totalUsers, adStats, totalReports, totalBusinesses, totalRevenueAgg };
};
exports.getDashboardCardStats = getDashboardCardStats;
const getRecentAdminLogs = async (limit) => {
    return AdminLog_1.default.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('adminId', 'firstName lastName email');
};
exports.getRecentAdminLogs = getRecentAdminLogs;
const getContactSubmissionsPaginated = async (query, skip, limit) => {
    return Promise.all([
        ContactSubmission_1.default.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        ContactSubmission_1.default.countDocuments(query),
    ]);
};
exports.getContactSubmissionsPaginated = getContactSubmissionsPaginated;
const updateContactSubmissionById = async (id, status) => {
    // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
    return ContactSubmission_1.default.findByIdAndUpdate(id, { status }, { new: true });
};
exports.updateContactSubmissionById = updateContactSubmissionById;
const getLocationAnalyticsRawData = async (params) => {
    const { sixMonthsAgo, buildScopedLocationQuery, buildScopedAdQuery, buildScopedUserQuery, hotZoneQuery, } = params;
    const [totalLocations, totalAds, totalUsers, adsByLocationAgg, monthlyAds, monthlyUsers, monthlyLocs, topHotZonesRaw] = await Promise.all([
        Location_1.default.countDocuments(buildScopedLocationQuery()),
        Ad_1.default.countDocuments(buildScopedAdQuery({ status: listingStatus_1.LISTING_STATUS.LIVE })),
        User_1.default.countDocuments(buildScopedUserQuery({ status: userStatus_1.USER_STATUS.LIVE })),
        Ad_1.default.aggregate([
            {
                $match: {
                    ...buildScopedAdQuery({ status: listingStatus_1.LISTING_STATUS.LIVE }),
                    'location.locationId': { $exists: true, $ne: null },
                }
            },
            { $group: { _id: '$location.locationId', adsCount: { $sum: 1 } } },
            { $sort: { adsCount: -1 } },
            { $limit: 250 }
        ]),
        Ad_1.default.aggregate([
            { $match: buildScopedAdQuery({ createdAt: { $gte: sixMonthsAgo } }) },
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } }
        ]),
        User_1.default.aggregate([
            { $match: buildScopedUserQuery({ createdAt: { $gte: sixMonthsAgo } }) },
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } }
        ]),
        Location_1.default.aggregate([
            { $match: buildScopedLocationQuery({ createdAt: { $gte: sixMonthsAgo } }) },
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } }
        ]),
        LocationAnalytics_1.default.find(hotZoneQuery)
            .select('locationId popularityScore searchCount adsCount')
            .sort({ popularityScore: -1, searchCount: -1 })
            .limit(10)
            .lean()
    ]);
    return { totalLocations, totalAds, totalUsers, adsByLocationAgg, monthlyAds, monthlyUsers, monthlyLocs, topHotZonesRaw };
};
exports.getLocationAnalyticsRawData = getLocationAnalyticsRawData;
const getHotZoneLocations = async (locationIds) => {
    if (locationIds.length === 0)
        return [];
    return Location_1.default.find({ _id: { $in: locationIds } })
        .select('_id name country level parentId path')
        .lean();
};
exports.getHotZoneLocations = getHotZoneLocations;
const getAnalyticsLocations = async (locationIds) => {
    if (locationIds.length === 0)
        return [];
    return Location_1.default.find({ _id: { $in: locationIds } })
        .select('_id name country level parentId path')
        .lean();
};
exports.getAnalyticsLocations = getAnalyticsLocations;
const adminGetLocationAnalyticsData = async (reqQuery) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cityFilter = typeof reqQuery.city === 'string' ? reqQuery.city.trim() : '';
    const districtFilter = typeof reqQuery.district === 'string' ? reqQuery.district.trim() : '';
    const stateFilter = typeof reqQuery.state === 'string' ? reqQuery.state.trim() : '';
    const countryFilter = typeof reqQuery.country === 'string' ? reqQuery.country.trim() : '';
    const scope = await (0, locationHierarchy_1.resolveLocationScope)({
        city: cityFilter || undefined,
        district: districtFilter || undefined,
        state: stateFilter && stateFilter !== 'all' ? stateFilter : undefined,
        country: countryFilter && countryFilter !== 'all' ? countryFilter : undefined,
    });
    const locationScopeIds = scope.locationIds;
    const buildScopedLocationQuery = (extra = {}) => {
        if (locationScopeIds === null) {
            return { isActive: true, ...extra };
        }
        if (locationScopeIds.length === 0) {
            return { _id: { $in: [] }, ...extra };
        }
        return {
            isActive: true,
            ...extra,
            $or: [
                { _id: { $in: locationScopeIds } },
                { path: { $in: locationScopeIds } },
            ],
        };
    };
    const buildScopedAdQuery = (extra = {}) => {
        if (locationScopeIds === null) {
            return extra;
        }
        if (locationScopeIds.length === 0) {
            return { _id: { $in: [] }, ...extra };
        }
        return {
            ...extra,
            $or: [
                { 'location.locationId': { $in: locationScopeIds } },
                { locationPath: { $in: locationScopeIds } },
            ],
        };
    };
    const buildScopedUserQuery = (extra = {}) => {
        if (locationScopeIds === null) {
            return extra;
        }
        if (locationScopeIds.length === 0) {
            return { _id: { $in: [] }, ...extra };
        }
        const orQuery = [
            { locationId: { $in: locationScopeIds } },
            { 'location.locationId': { $in: locationScopeIds } },
        ];
        if (cityFilter) {
            orQuery.push({ 'location.city': new RegExp(`^${(0, stringUtils_1.escapeRegExp)(cityFilter)}$`, 'i') });
        }
        if (stateFilter && stateFilter !== 'all') {
            orQuery.push({ 'location.state': new RegExp(`^${(0, stringUtils_1.escapeRegExp)(stateFilter)}$`, 'i') });
        }
        return {
            ...extra,
            $or: orQuery,
        };
    };
    if (Array.isArray(locationScopeIds) && locationScopeIds.length === 0) {
        return {
            totalLocations: 0,
            totalAds: 0,
            totalUsers: 0,
            topCities: [],
            adsByState: [],
            hotZones: [],
            monthlyTrends: [],
        };
    }
    const hotZoneQuery = {
        isHotZone: true,
        ...(Array.isArray(locationScopeIds) ? { locationId: { $in: locationScopeIds } } : {}),
    };
    const { totalLocations, totalAds, totalUsers, adsByLocationAgg, monthlyAds, monthlyUsers, monthlyLocs, topHotZonesRaw, } = await (0, exports.getLocationAnalyticsRawData)({
        sixMonthsAgo,
        buildScopedLocationQuery,
        buildScopedAdQuery,
        buildScopedUserQuery,
        hotZoneQuery,
    });
    const hotZoneLocationIds = topHotZonesRaw.map((zone) => zone.locationId);
    const hotZoneLocations = await (0, exports.getHotZoneLocations)(hotZoneLocationIds.map(String));
    const hotZoneHierarchyMap = await (0, locationHierarchy_1.loadHierarchyMapForLocations)(hotZoneLocations);
    const hotZoneLocationMap = new Map(hotZoneLocations.map((location) => [String(location._id), location]));
    const hotZones = topHotZonesRaw.map((zone) => {
        const location = hotZoneLocationMap.get(String(zone.locationId));
        const summary = location ? (0, locationHierarchy_1.buildLocationSummary)(location, hotZoneHierarchyMap) : undefined;
        return {
            _id: String(zone._id),
            city: summary?.city ?? '',
            state: summary?.state ?? '',
            popularityScore: zone.popularityScore ?? 0,
            isHotZone: true,
        };
    });
    // Format Monthly Trends
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trends = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const ads = monthlyAds.find(a => a._id.month === m && a._id.year === y)?.count || 0;
        const users = monthlyUsers.find(u => u._id.month === m && u._id.year === y)?.count || 0;
        const locs = monthlyLocs.find(l => l._id.month === m && l._id.year === y)?.count || 0;
        trends.push({
            month: monthNames[m - 1],
            adsPosted: ads,
            activeUsers: users,
            newLocations: locs
        });
    }
    const adsByLocationIds = adsByLocationAgg
        .map((entry) => entry?._id)
        .filter((value) => Boolean(value))
        .map((value) => String(value));
    const analyticsLocations = await (0, exports.getAnalyticsLocations)(adsByLocationIds);
    const analyticsHierarchyMap = await (0, locationHierarchy_1.loadHierarchyMapForLocations)(analyticsLocations);
    const analyticsLocationMap = new Map(analyticsLocations.map((location) => [String(location._id), location]));
    const topCityMap = new Map();
    const adsByStateMap = new Map();
    for (const entry of adsByLocationAgg) {
        const location = analyticsLocationMap.get(String(entry._id));
        if (!location)
            continue;
        const summary = (0, locationHierarchy_1.buildLocationSummary)(location, analyticsHierarchyMap);
        const count = typeof entry?.adsCount === 'number' ? entry.adsCount : Number(entry?.adsCount || 0);
        if (summary.city && summary.state && summary.level !== 'state' && summary.level !== 'country') {
            const cityKey = `${summary.city.toLowerCase()}::${summary.state.toLowerCase()}`;
            const existingCity = topCityMap.get(cityKey);
            if (existingCity) {
                existingCity.adsCount += count;
            }
            else {
                topCityMap.set(cityKey, {
                    _id: cityKey,
                    city: summary.city,
                    state: summary.state,
                    adsCount: count,
                });
            }
        }
        const stateLabel = (0, locationHierarchy_1.normalizeStateLabel)(summary.state);
        const stateKey = stateLabel.toLowerCase();
        const existing = adsByStateMap.get(stateKey);
        if (existing) {
            existing.count += count;
            continue;
        }
        adsByStateMap.set(stateKey, { _id: stateLabel, count });
    }
    const topCities = Array.from(topCityMap.values())
        .sort((a, b) => b.adsCount - a.adsCount)
        .slice(0, 10);
    const adsByState = Array.from(adsByStateMap.values()).sort((a, b) => b.count - a.count);
    return {
        totalLocations,
        totalAds,
        totalUsers,
        topCities,
        adsByState,
        hotZones,
        monthlyTrends: trends.map(t => ({
            month: t.month,
            ads: t.adsPosted,
            users: t.activeUsers,
        })),
    };
};
exports.adminGetLocationAnalyticsData = adminGetLocationAnalyticsData;
//# sourceMappingURL=AdminDashboardService.js.map
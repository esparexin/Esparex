type UnknownRecord = Record<string, unknown>;

type AdLike = {
    id?: string;
    _id?: string;
    images?: unknown;
};

type BrokenImage = {
    url: string;
    source: 'ads-list' | 'ad-detail';
    adId?: string;
    status?: number;
    reason?: string;
};

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5001/api/v1').replace(/\/+$/, '');
const LIST_LIMIT = Number(process.env.S3_IMAGE_LIST_LIMIT || 50);
const DETAIL_LIMIT = Number(process.env.S3_IMAGE_DETAIL_LIMIT || 25);

const extractArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const extractAdsFromPayload = (payload: UnknownRecord): AdLike[] => {
    const data = payload.data as unknown;

    if (Array.isArray(data)) return data as AdLike[];
    if (!data || typeof data !== 'object') return [];

    const wrapped = data as UnknownRecord;
    if (Array.isArray(wrapped.items)) return wrapped.items as AdLike[];
    if (Array.isArray(wrapped.data)) return wrapped.data as AdLike[];
    return [];
};

const extractImages = (ad: AdLike): string[] =>
    extractArray(ad.images).filter((img): img is string => typeof img === 'string' && img.trim().length > 0);

const fetchJson = async (path: string): Promise<UnknownRecord> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`GET ${path} failed with status ${response.status}`);
    }

    const json = (await response.json()) as UnknownRecord;
    return json;
};

const checkUrl = async (url: string): Promise<{ ok: boolean; status?: number; reason?: string }> => {
    try {
        let response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        if (response.status === 405 || response.status === 403) {
            response = await fetch(url, { method: 'GET', redirect: 'follow' });
        }
        if (response.ok) return { ok: true, status: response.status };
        return { ok: false, status: response.status, reason: `HTTP_${response.status}` };
    } catch (error) {
        return {
            ok: false,
            reason: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        };
    }
};

async function main() {
    console.log(`[check-s3-images] API base: ${API_BASE_URL}`);
    console.log(`[check-s3-images] Fetching /ads?status=active&limit=${LIST_LIMIT}`);

    const adsListPayload = await fetchJson(`/ads?status=active&limit=${LIST_LIMIT}`);
    const ads = extractAdsFromPayload(adsListPayload);
    const adsToInspect = ads.slice(0, LIST_LIMIT);

    const broken: BrokenImage[] = [];
    let totalUrlsChecked = 0;

    for (const ad of adsToInspect) {
        const adId = ad.id || ad._id;
        const listImages = extractImages(ad);
        for (const url of listImages) {
            totalUrlsChecked += 1;
            const result = await checkUrl(url);
            if (!result.ok) {
                broken.push({
                    url,
                    source: 'ads-list',
                    adId,
                    status: result.status,
                    reason: result.reason,
                });
            }
        }
    }

    const detailIds = adsToInspect
        .map((ad) => ad.id || ad._id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .slice(0, DETAIL_LIMIT);

    console.log(`[check-s3-images] Fetching /ads/:id for ${detailIds.length} ads`);

    for (const adId of detailIds) {
        try {
            const detailPayload = await fetchJson(`/ads/${encodeURIComponent(adId)}`);
            const detailData = detailPayload.data as UnknownRecord | undefined;
            const images = extractImages((detailData || {}) as AdLike);

            for (const url of images) {
                totalUrlsChecked += 1;
                const result = await checkUrl(url);
                if (!result.ok) {
                    broken.push({
                        url,
                        source: 'ad-detail',
                        adId,
                        status: result.status,
                        reason: result.reason,
                    });
                }
            }
        } catch (error) {
            broken.push({
                url: '',
                source: 'ad-detail',
                adId,
                reason: error instanceof Error ? error.message : 'DETAIL_FETCH_FAILED',
            });
        }
    }

    console.log(`[check-s3-images] Checked URLs: ${totalUrlsChecked}`);
    console.log(`[check-s3-images] Broken entries: ${broken.length}`);

    if (broken.length > 0) {
        console.log(JSON.stringify({ broken }, null, 2));
        process.exitCode = 1;
        return;
    }

    console.log('[check-s3-images] All checked image URLs are reachable.');
}

main().catch((error) => {
    console.error('[check-s3-images] Fatal error:', error);
    process.exitCode = 1;
});

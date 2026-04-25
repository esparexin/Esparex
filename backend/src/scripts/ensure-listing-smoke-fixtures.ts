/**
 * ensure-listing-smoke-fixtures.ts
 *
 * CI Smoke Fixture Provisioner — Listing Contact & Reveal Policy Matrix
 *
 * Purpose: Upsert a stable smoke user and a smoke ad into the CI MongoDB,
 * then write the fixture path JSON to SMOKE_FIXTURE_OUTPUT_PATH so that
 * the Playwright listing-chat-smoke tests can resolve the listing URL.
 *
 * Invoked by:
 *   npm run smoke:fixtures -w backend
 *
 * Environment inputs:
 *   MONGODB_URI                  — CI Mongo connection string
 *   SMOKE_FIXTURE_OUTPUT_PATH    — where to write fixtures JSON (optional)
 *   SMOKE_FIXTURE_REVEAL_EXPECT  — reveal expectation: mobile | masked | request_only | hidden
 *
 * Output JSON shape (ListingSmokeFixtures contract):
 *   {
 *     "chat": { "ad": { "path": "/ads/<slug>-<id>" } },
 *     "reveal": { "path": "/ads/<slug>-<id>", "expect": "mobile" }
 *   }
 */

import mongoose from "mongoose";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Inline env load (no dotenv dep required in CI — env is injected by workflow) ──
// Path aliases are resolved by tsconfig-paths (see smoke:fixtures script)
import { AD_STATUS } from "@core/constants/enums/adStatus";
import { LISTING_TYPE } from "@core/constants/enums/listingType";
import { USER_STATUS } from "@core/constants/enums/userStatus";
import { MOBILE_VISIBILITY } from "@shared/constants/mobileVisibility";
import { connectDB } from "@core/config/db";
import Ad from "@core/models/Ad";
import User from "@core/models/User";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type RevealExpectation = "mobile" | "masked" | "request_only" | "hidden";

interface FixtureOutput {
    chat: Partial<Record<"ad" | "service" | "spare_part", { path: string }>>;
    reveal: { path: string; expect: RevealExpectation } | null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function resolveRevealExpect(raw: string | undefined): RevealExpectation {
    const supported: RevealExpectation[] = ["mobile", "masked", "request_only", "hidden"];
    const trimmed = (raw ?? "mobile").trim().toLowerCase();
    // Tolerate the older phone_request_required label used in some CI runs
    const normalized = trimmed === "phone_request_required" ? "request_only" : trimmed;
    if (supported.includes(normalized as RevealExpectation)) return normalized as RevealExpectation;
    console.warn(`[smoke-fixtures] Unknown SMOKE_FIXTURE_REVEAL_EXPECT "${raw}". Defaulting to "mobile".`);
    return "mobile";
}

/**
 * Map reveal expectation → User.mobileVisibility value.
 * "masked" uses SHOW but the seller has no phone number, so the API
 * returns a masked placeholder — the test expects the masked UI.
 */
function revealExpectToMobileVisibility(expect: RevealExpectation): string {
    switch (expect) {
        case "mobile":   return MOBILE_VISIBILITY.SHOW;
        case "masked":   return MOBILE_VISIBILITY.SHOW;   // no phone → masked UI
        case "request_only": return MOBILE_VISIBILITY.ON_REQUEST;
        case "hidden":   return MOBILE_VISIBILITY.HIDE;
    }
}

/** Simple slug from title — matches the frontend generateAdSlug pattern. */
function toSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

async function run(): Promise<void> {
    const revealExpect = resolveRevealExpect(process.env.SMOKE_FIXTURE_REVEAL_EXPECT);
    const outputPath = process.env.SMOKE_FIXTURE_OUTPUT_PATH;
    const mobileVisibility = revealExpectToMobileVisibility(revealExpect);

    console.log(`[smoke-fixtures] Connecting to MongoDB…`);
    await connectDB();
    console.log(`[smoke-fixtures] Connected.`);

    /* ── 1. Upsert smoke seller ─────────────────────────────────────────── */
    const sellerMobile = "9000000001";
    const sellerPhone  = revealExpect === "masked" ? undefined : "+919000000001";

    const seller = await User.findOneAndUpdate(
        { mobile: sellerMobile },
        {
            $setOnInsert: { mobile: sellerMobile, createdAt: new Date() },
            $set: {
                name: "Smoke Seller",
                status: USER_STATUS.LIVE,
                mobileVisibility,
                ...(sellerPhone ? { phone: sellerPhone } : {}),
            },
        },
        { upsert: true, new: true }
    );
    console.log(`[smoke-fixtures] Smoke seller: ${String(seller._id)}`);

    /* ── 2. Upsert smoke ad ─────────────────────────────────────────────── */
    const smokeTitle    = "CI Smoke Fixture — Mobile Battery";
    const smokeSlug     = toSlug(smokeTitle);
    const expiresAt     = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const ad = await Ad.findOneAndUpdate(
        {
            sellerId: seller._id,
            listingType: LISTING_TYPE.AD,
            title: smokeTitle,
            isDeleted: false,
        },
        {
            $set: {
                title: smokeTitle,
                description: "CI smoke fixture ad — do not index.",
                price: 499,
                status: AD_STATUS.LIVE,
                listingType: LISTING_TYPE.AD,
                sellerId: seller._id,
                seoSlug: smokeSlug,
                isDeleted: false,
                expiresAt,
                location: {
                    city: "Hyderabad",
                    state: "Telangana",
                    country: "India",
                },
            },
        },
        { upsert: true, new: true }
    );
    console.log(`[smoke-fixtures] Smoke ad: ${String(ad._id)}`);

    /* ── 3. Build fixture paths ─────────────────────────────────────────── */
    const adPath = `/ads/${smokeSlug}-${String(ad._id)}`;

    const fixture: FixtureOutput = {
        chat: {
            ad: { path: adPath },
        },
        reveal: {
            path: adPath,
            expect: revealExpect,
        },
    };

    const fixtureJson = JSON.stringify(fixture, null, 2);
    console.log(`[smoke-fixtures] Fixture payload:\n${fixtureJson}`);

    /* ── 4. Write output file ───────────────────────────────────────────── */
    if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, fixtureJson, "utf8");
        console.log(`[smoke-fixtures] Written to ${outputPath}`);
    } else {
        console.log("[smoke-fixtures] SMOKE_FIXTURE_OUTPUT_PATH not set — skipping file write.");
    }

    await mongoose.disconnect();
    console.log(`[smoke-fixtures] Done.`);
    process.exit(0);
}

run().catch((err: unknown) => {
    console.error("[smoke-fixtures] FATAL:", err);
    process.exit(1);
});

import { LIFECYCLE_STATUS } from '../../../shared/enums/lifecycle';
import { MAPS } from '../services/LifecycleGuard';

let hasErrors = false;

function verifyTransitions(domain: string, map: Record<string, string[]>) {
    console.log(`\nVerifying ${domain.toUpperCase()} transitions...`);

    // Ensure all defined statuses exist in LIFECYCLE_STATUS
    const allDefinedStatuses = new Set<string>();
    
    for (const [from, tos] of Object.entries(map)) {
        allDefinedStatuses.add(from);
        tos.forEach(to => allDefinedStatuses.add(to));
    }

    for (const status of allDefinedStatuses) {
        if (!Object.values(LIFECYCLE_STATUS).includes(status as any)) {
            console.error(`❌ ERROR in ${domain}: Status '${status}' is not a valid LIFECYCLE_STATUS.`);
            hasErrors = true;
        }
    }

    // Check for reachability (basic heuristic: every state should be reachable from SOME other state except PENDING)
    for (const status of allDefinedStatuses) {
        if (status === LIFECYCLE_STATUS.PENDING) continue; // Starting state

        let isReachable = false;
        for (const [from, tos] of Object.entries(map)) {
            if (from !== status && tos.includes(status)) {
                isReachable = true;
                break;
            }
        }

        if (!isReachable) {
            console.warn(`⚠️ WARNING in ${domain}: Status '${status}' seems unreachable from any other state.`);
        }
    }
    
    // Check for basic completeness of deleted states (Optional but good practice)
    for (const [from, tos] of Object.entries(map)) {
        if (from !== LIFECYCLE_STATUS.DELETED && !tos.includes(LIFECYCLE_STATUS.DELETED)) {
            // Not strictly an error in some domains, but log it
            // console.warn(`ℹ️ INFO in ${domain}: Status '${from}' cannot transition directly to DELETED.`);
        }
    }
    
    console.log(`✅ ${domain.toUpperCase()} basic verification complete.`);
}


console.log("=== LIFECYCLE STATE MACHINE VERIFICATION ===");
for (const [domain, map] of Object.entries(MAPS)) {
    verifyTransitions(domain, map);
}

if (hasErrors) {
    console.error("\n❌ Verification failed with errors.");
    process.exit(1);
} else {
    console.log("\n✅ All domains verified successfully.");
}

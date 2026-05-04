"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOpsArgs = void 0;
const parseOpsArgs = (argv) => {
    const flags = {
        apply: false,
        dryRun: true,
        verbose: false,
        yes: false,
    };
    let commandName = null;
    const passthrough = [];
    for (const token of argv) {
        if (token === '--apply') {
            flags.apply = true;
            flags.dryRun = false;
            continue;
        }
        if (token === '--dry-run') {
            flags.dryRun = true;
            flags.apply = false;
            continue;
        }
        if (token === '--verbose') {
            flags.verbose = true;
            continue;
        }
        if (token === '--yes') {
            flags.yes = true;
            continue;
        }
        if (!commandName && !token.startsWith('--')) {
            commandName = token;
            continue;
        }
        passthrough.push(token);
    }
    return {
        commandName,
        passthrough,
        flags,
    };
};
exports.parseOpsArgs = parseOpsArgs;
//# sourceMappingURL=context.js.map
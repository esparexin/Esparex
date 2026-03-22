module.exports = {
    apps: [
        {
            name: "esparex-frontend",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                // Suppress DEP0169: url.parse() is called in Next.js 16 internals
                // (router-server.js, resolve-routes.js). Not in application code.
                // Remove when Next.js replaces url.parse() with the WHATWG URL API.
                NODE_OPTIONS: "--disable-warning=DEP0169",
            },
        },
    ],
};

const namespaces = [
    '@esparex/core',
    '@esparex/core/models',
    '@esparex/core/services',
    '@esparex/core/events',
    '@esparex/core/utils',
    '@esparex/core/config',
    '@esparex/core/infrastructure',
    '@esparex/core/tooling',
    '@esparex/core/types',
    '@esparex/core/validators',
    '@esparex/core/jobs',
    '@esparex/core/queues',
    '@esparex/core/workers',
    '@esparex/core/domain'
];

let failed = false;

namespaces.forEach(ns => {
    try {
        require(ns);
        console.log(`✅ Loaded: ${ns}`);
    } catch (e) {
        console.error(`❌ Failed to load: ${ns}`);
        console.error(e);
        failed = true;
    }
});

if (failed) {
    process.exit(1);
} else {
    console.log('🎉 All 14 namespaces loaded successfully!');
}

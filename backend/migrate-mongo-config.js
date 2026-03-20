// Accepted lint exception: migrate-mongo loads this file as CommonJS sync config.
// `dotenv` must be required at module evaluation time to resolve env-backed config values.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv');
dotenv.config();

const config = {
  mongodb: {
    // Prefer ADMIN_MONGODB_URI (Atlas admin DB); fall back to legacy MONGO_URI or local default.
    url: process.env.ADMIN_MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/esparex_admin_db",

    // Defaults to admin DB for backward compatibility; override in CI/local via MONGO_DB_NAME.
    databaseName: process.env.MONGO_DB_NAME || "esparex_admin",

    options: {
      // useNewUrlParser: true, // (not needed anymore in mongodb driver 4.x+)
      // useUnifiedTopology: true, // (not needed anymore in mongodb driver 4.x+)
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The mongodb collection where the lock will be created.
  lockCollectionName: "changelog_lock",

  // The value in seconds for the TTL index that will be used for the lock. Value of 0 will disable the feature.
  lockTtl: 0,

  // The file extension to create migrations and search for in migration dir 
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: 'commonjs',
};

module.exports = config;

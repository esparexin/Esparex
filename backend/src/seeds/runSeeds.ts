import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db";
import { seedSpareParts } from "./spareParts.seed";
import { seedDevices } from "./devices.seed";
import { seedServiceTypes } from "./serviceTypes.seed";
import { seedScreenSizes } from "./screenSizes.seed";
import logger from "../utils/logger";

// Load env vars
dotenv.config({ quiet: true });

async function run() {
    logger.info("Connecting to MongoDB...");
    await connectDB();
    logger.info("Connected.");

    await seedDevices();
    await seedScreenSizes();
    await seedSpareParts();
    await seedServiceTypes();

    await mongoose.disconnect();
    logger.info("Disconnected.");
    process.exit(0);
}

run().catch(err => {
    logger.error(err);
    process.exit(1);
});

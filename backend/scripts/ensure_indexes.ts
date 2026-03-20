import dotenv from 'dotenv';
import path from 'path';
import Location from '../src/models/Location';
import User from '../src/models/User';
import Business from '../src/models/Business';
import Ad from '../src/models/Ad';

import { connectDB, getUserConnection } from '../src/config/db';

dotenv.config({ path: path.join(__dirname, '../.env') });

const ensureIndexes = async () => {
    try {
        console.log("Connecting to Database...");
        await connectDB();

        console.log("Ensuring indexes on Location model...");
        try {
            await Location.collection.dropIndexes();
            console.log("Dropped existing Location indexes.");
        } catch (e) {
            console.log("No existing Location indexes to drop.");
        }
        await Location.ensureIndexes();

        console.log("Ensuring indexes on User model...");
        await User.ensureIndexes();

        console.log("Ensuring indexes on Business model...");
        try {
            await Business.collection.dropIndexes();
            console.log("Dropped existing Business indexes.");
        } catch (e) {
            console.log("No existing Business indexes to drop.");
        }
        await Business.ensureIndexes();

        console.log("Ensuring indexes on Ad model...");
        try {
            await Ad.collection.dropIndexes();
            console.log("Dropped existing Ad indexes.");
        } catch (e) {
            console.log("No existing Ad indexes to drop.");
        }
        await Ad.ensureIndexes();

        console.log("Indexes rebuilt successfully.");

        const indexes = await Location.collection.indexes();
        console.log("Current Indexes:", JSON.stringify(indexes, null, 2));

        await getUserConnection().close();
        if (process.env.NODE_ENV !== 'test') {
            const { getAdminConnection } = require('../src/config/db');
            await getAdminConnection().close();
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

ensureIndexes();

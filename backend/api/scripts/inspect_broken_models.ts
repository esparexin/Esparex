import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const ModelSchema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.model('Model', ModelSchema);

async function run() {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    console.log("Removing broken models...");
    
    const result = await Model.deleteMany({
        _id: { $in: ['69e5dd82fc6ba3dc9cd7a254', '69e65fa47bf0b788740b369e'] }
    });
    
    console.log("Deleted count:", result.deletedCount);
    
    await mongoose.disconnect();
}

run().catch(console.error);

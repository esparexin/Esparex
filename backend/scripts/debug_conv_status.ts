import { connectDB } from '../src/config/db';
import ConversationModel from '../src/models/Conversation';
import { CONVERSATION_STATUS } from '../../shared/enums/conversationStatus';

async function debug() {
    await connectDB();
    const nonCanonical = await (ConversationModel as any).find({
        status: { $nin: Object.values(CONVERSATION_STATUS) }
    }).limit(1);

    if (nonCanonical.length > 0) {
        console.log('Sample Non-Canonical Conversation:', JSON.stringify(nonCanonical[0], null, 2));
    } else {
        console.log('No non-canonical conversations found with find(). Check the count logic.');
    }
    process.exit(0);
}

debug().catch(err => {
    console.error(err);
    process.exit(1);
});

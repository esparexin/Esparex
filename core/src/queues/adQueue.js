"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationMatchQueue = exports.notificationDeliveryQueue = exports.adQueue = void 0;
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("./redisConnection");
const sharedJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000 // 2s → 4s → 8s
    },
    removeOnComplete: 200,
    removeOnFail: 500
};
exports.adQueue = new bullmq_1.Queue('ad-events', {
    connection: redisConnection_1.redisConnection,
    defaultJobOptions: sharedJobOptions
});
exports.notificationDeliveryQueue = new bullmq_1.Queue('notification.delivery.queue', {
    connection: redisConnection_1.redisConnection,
    defaultJobOptions: sharedJobOptions
});
exports.notificationMatchQueue = new bullmq_1.Queue('notification.match.queue', {
    connection: redisConnection_1.redisConnection,
    defaultJobOptions: sharedJobOptions
});
//# sourceMappingURL=adQueue.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorkers = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const adWorker_1 = require("./adWorker");
const notificationDeliveryWorker_1 = require("./notificationDeliveryWorker");
const notificationMatchWorker_1 = require("./notificationMatchWorker");
const paymentWorker_1 = require("./paymentWorker");
const imageWorker_1 = require("./imageWorker");
const mongoose_1 = __importDefault(require("mongoose"));
const redisCache_1 = __importDefault(require("@core/utils/redisCache"));
const shutdownHandler_1 = require("@core/utils/shutdownHandler");
const startWorkers = () => {
    logger_1.default.info('Starting background workers...');
    adWorker_1.adWorker.on('ready', () => {
        logger_1.default.info("AdWorker is fully running and listening to 'ad-events' queue.");
    });
    notificationDeliveryWorker_1.notificationDeliveryWorker.on('ready', () => {
        logger_1.default.info("NotificationDeliveryWorker is fully running and listening to 'notification.delivery.queue' queue.");
    });
    paymentWorker_1.paymentWorker.on('ready', () => {
        logger_1.default.info("PaymentWorker is fully running and listening to 'payment-events' queue.");
    });
    notificationMatchWorker_1.notificationMatchWorker.on('ready', () => {
        logger_1.default.info("NotificationMatchWorker is fully running and listening to 'notification.match.queue'.");
    });
    imageWorker_1.imageOptimizationWorker.on('ready', () => {
        logger_1.default.info("ImageOptimizationWorker is fully running and listening to 'image-optimization-events'.");
    });
    const handleShutdown = async () => {
        await (0, shutdownHandler_1.gracefulShutdown)({
            workers: [adWorker_1.adWorker, notificationDeliveryWorker_1.notificationDeliveryWorker, notificationMatchWorker_1.notificationMatchWorker, paymentWorker_1.paymentWorker, imageWorker_1.imageOptimizationWorker],
            redisClient: redisCache_1.default,
            mongooseConnection: mongoose_1.default.connection
        });
    };
    process.on('SIGTERM', () => void handleShutdown());
    process.on('SIGINT', () => void handleShutdown());
};
exports.startWorkers = startWorkers;
//# sourceMappingURL=index.js.map
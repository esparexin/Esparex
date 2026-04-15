import logger from '../utils/logger';
import { adWorker, notificationDeliveryWorker } from './adWorker';
import { notificationMatchWorker } from './notificationMatchWorker';
import { paymentWorker } from './paymentWorker';
import { imageOptimizationWorker } from './imageWorker';
import mongoose from 'mongoose';
import redisClient from '../utils/redisCache';
import { gracefulShutdown } from '../utils/shutdownHandler';

export const startWorkers = () => {
    logger.info('Starting background workers...');

    adWorker.on('ready', () => {
        logger.info("AdWorker is fully running and listening to 'ad-events' queue.");
    });

    notificationDeliveryWorker.on('ready', () => {
        logger.info("NotificationDeliveryWorker is fully running and listening to 'notification.delivery.queue' queue.");
    });

    paymentWorker.on('ready', () => {
        logger.info("PaymentWorker is fully running and listening to 'payment-events' queue.");
    });
    notificationMatchWorker.on('ready', () => {
        logger.info("NotificationMatchWorker is fully running and listening to 'notification.match.queue'.");
    });
    
    imageOptimizationWorker.on('ready', () => {
        logger.info("ImageOptimizationWorker is fully running and listening to 'image-optimization-events'.");
    });

    const handleShutdown = async () => {
        await gracefulShutdown({
            workers: [adWorker, notificationDeliveryWorker, notificationMatchWorker, paymentWorker, imageOptimizationWorker] as import('bullmq').Worker[],
            redisClient,
            mongooseConnection: mongoose.connection
        });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
};

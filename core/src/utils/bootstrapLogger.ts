import winston from 'winston';

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

const bootstrapLogger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            silent: isTest
        })
    ],
    exitOnError: false
});

export default bootstrapLogger;

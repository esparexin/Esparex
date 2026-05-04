"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupQueueDashboard = void 0;
const express_1 = require("@bull-board/express");
const api_1 = require("@bull-board/api");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
const adQueue_1 = require("./adQueue");
const setupQueueDashboard = () => {
    const serverAdapter = new express_1.ExpressAdapter();
    serverAdapter.setBasePath('/api/v1/admin/queues');
    (0, api_1.createBullBoard)({
        queues: [new bullMQAdapter_1.BullMQAdapter(adQueue_1.adQueue)],
        serverAdapter,
    });
    return serverAdapter.getRouter();
};
exports.setupQueueDashboard = setupQueueDashboard;
//# sourceMappingURL=queueDashboard.js.map
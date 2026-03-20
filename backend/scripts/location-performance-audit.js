#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { performance } = require('perf_hooks');

const uri = process.env.MONGODB_URI || process.env.ADMIN_MONGODB_URI;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async (maxAttempts = 5) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) await sleep(1200);
    }
  }
  throw lastError;
};

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const findStage = (plan) => {
  if (!plan || typeof plan !== 'object') return null;
  if (typeof plan.stage === 'string') return plan.stage;

  const keys = [
    'inputStage',
    'outerStage',
    'innerStage',
    'queryPlan',
    'winningPlan',
    'leftChild',
    'rightChild'
  ];

  for (const key of keys) {
    if (plan[key]) {
      const stage = findStage(plan[key]);
      if (stage) return stage;
    }
  }

  if (Array.isArray(plan.shards)) {
    for (const shard of plan.shards) {
      const stage = findStage(shard.winningPlan || shard.executionStages || shard);
      if (stage) return stage;
    }
  }

  if (Array.isArray(plan.inputStages)) {
    for (const item of plan.inputStages) {
      const stage = findStage(item);
      if (stage) return stage;
    }
  }

  return null;
};

const collectStages = (plan, acc = new Set()) => {
  if (!plan || typeof plan !== 'object') return acc;
  if (typeof plan.stage === 'string') acc.add(plan.stage);

  const keys = [
    'inputStage',
    'outerStage',
    'innerStage',
    'queryPlan',
    'winningPlan',
    'leftChild',
    'rightChild',
    'executionStages'
  ];
  for (const key of keys) {
    if (plan[key]) collectStages(plan[key], acc);
  }

  if (Array.isArray(plan.inputStages)) {
    for (const item of plan.inputStages) collectStages(item, acc);
  }
  if (Array.isArray(plan.shards)) {
    for (const shard of plan.shards) collectStages(shard, acc);
  }

  return acc;
};

const runBenchmark = async (collection) => {
  const page = 1;
  const limit = 20;
  const query = { isDeleted: { $ne: true } };
  const legacyDurations = [];
  const optimizedDurations = [];
  const legacyHeap = [];
  const optimizedHeap = [];

  for (let i = 0; i < 8; i += 1) {
    global.gc && global.gc();
    const legacyHeapBefore = process.memoryUsage().heapUsed;
    const t1 = performance.now();
    const totalLegacy = await collection.countDocuments(query);
    const itemsLegacy = await collection
      .find(query)
      .sort({ isPopular: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    const legacyMs = performance.now() - t1;
    const legacyHeapAfter = process.memoryUsage().heapUsed;

    legacyDurations.push(legacyMs);
    legacyHeap.push((legacyHeapAfter - legacyHeapBefore) / (1024 * 1024));

    global.gc && global.gc();
    const optimizedHeapBefore = process.memoryUsage().heapUsed;
    const t2 = performance.now();
    const totalOptimized = await collection.estimatedDocumentCount();
    const optimizedCursor = collection
      .find(query, {
        projection: {
          _id: 1,
          name: 1,
          city: 1,
          district: 1,
          state: 1,
          country: 1,
          level: 1,
          coordinates: 1,
          isActive: 1,
          isPopular: 1,
          verificationStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          slug: 1
        }
      })
      .sort({ isPopular: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const itemsOptimized = await optimizedCursor.toArray();
    const optimizedMs = performance.now() - t2;
    const optimizedHeapAfter = process.memoryUsage().heapUsed;

    optimizedDurations.push(optimizedMs);
    optimizedHeap.push((optimizedHeapAfter - optimizedHeapBefore) / (1024 * 1024));

    if (i === 0) {
      console.log(
        JSON.stringify(
          {
            sampleTotals: { legacy: totalLegacy, optimized: totalOptimized },
            sampleItems: { legacy: itemsLegacy.length, optimized: itemsOptimized.length }
          },
          null,
          2
        )
      );
    }
  }

  return {
    legacyAvgMs: Number(average(legacyDurations).toFixed(2)),
    optimizedAvgMs: Number(average(optimizedDurations).toFixed(2)),
    legacyHeapDeltaMB: Number(average(legacyHeap).toFixed(2)),
    optimizedHeapDeltaMB: Number(average(optimizedHeap).toFixed(2))
  };
};

(async () => {
  if (!uri) {
    throw new Error('MONGODB_URI/ADMIN_MONGODB_URI not configured');
  }

  await connectWithRetry();

  const db = mongoose.connection.db;
  const collection = db.collection('locations');

  const indexes = await collection.indexes();
  const explain = await collection.find({ level: 'state' }).explain('executionStats');
  const executionRoot = explain.executionStats?.executionStages || explain.queryPlanner?.winningPlan;
  const winningRoot = explain.queryPlanner?.winningPlan || explain.executionStats?.executionStages;
  const benchmark = await runBenchmark(collection);

  const output = {
    connectedDb: mongoose.connection.name,
    indexCount: indexes.length,
    indexes: indexes.map((idx) => ({ name: idx.name, key: idx.key })),
    explain: {
      rootStage: findStage(executionRoot),
      winningPlanStage: findStage(winningRoot),
      stages: Array.from(collectStages(explain.queryPlanner?.winningPlan)).sort(),
      totalDocsExamined: explain.executionStats?.totalDocsExamined,
      totalKeysExamined: explain.executionStats?.totalKeysExamined,
      executionTimeMillis: explain.executionStats?.executionTimeMillis
    },
    benchmark
  };

  console.log(JSON.stringify(output, null, 2));

  await mongoose.disconnect();
})().catch(async (error) => {
  console.error('[location-performance-audit] failed:', error instanceof Error ? error.message : String(error));
  try {
    await mongoose.disconnect();
  } catch (_) {
    // no-op
  }
  process.exit(1);
});

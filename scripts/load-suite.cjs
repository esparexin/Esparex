#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.LOAD_BASE_URL || 'http://127.0.0.1:5001/api/v1').replace(/\/$/, '');
const DEFAULT_CONCURRENCY = Number(process.env.LOAD_CONCURRENCY || 20);
const DEFAULT_REQUESTS = Number(process.env.LOAD_REQUESTS_PER_SCENARIO || 200);
const LOAD_PROFILE = (process.env.LOAD_PROFILE || 'default').trim().toLowerCase();
const REPORT_PATH = process.env.LOAD_REPORT_PATH || '/tmp/esparex_load_report.json';
const SCENARIO_FILTER = (process.env.LOAD_SCENARIOS || '').split(',').map((s) => s.trim()).filter(Boolean);
const ENABLE_MUTATIONS = process.env.LOAD_ENABLE_MUTATIONS === 'true';

const nowIso = () => new Date().toISOString();
const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const percentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

const loadPostAdPayload = () => {
  const payloadPath = process.env.LOAD_POST_AD_PAYLOAD_PATH;
  if (!payloadPath) return null;
  const absPath = path.isAbsolute(payloadPath) ? payloadPath : path.join(process.cwd(), payloadPath);
  if (!fs.existsSync(absPath)) return null;
  try {
    const raw = fs.readFileSync(absPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const bearerHeader = (token) => token ? { Authorization: `Bearer ${token}` } : {};

const PROFILE_PRESETS = {
  default: {
    home: { requests: DEFAULT_REQUESTS, concurrency: DEFAULT_CONCURRENCY },
    search: { requests: DEFAULT_REQUESTS, concurrency: DEFAULT_CONCURRENCY },
    chat: { requests: DEFAULT_REQUESTS, concurrency: DEFAULT_CONCURRENCY },
    post_ad: { requests: DEFAULT_REQUESTS, concurrency: DEFAULT_CONCURRENCY }
  },
  prelaunch: {
    home: { requests: 4000, concurrency: 300 },
    search: { requests: 10000, concurrency: 1000 },
    chat: { requests: 3000, concurrency: 300 },
    post_ad: { requests: 500, concurrency: 120 }
  }
};

const normalizeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const getScenarioLoadConfig = (scenarioName) => {
  const preset = PROFILE_PRESETS[LOAD_PROFILE] || PROFILE_PRESETS.default;
  const base = preset[scenarioName] || { requests: DEFAULT_REQUESTS, concurrency: DEFAULT_CONCURRENCY };
  const envPrefix = scenarioName.toUpperCase();
  const requests = normalizeNumber(process.env[`LOAD_${envPrefix}_REQUESTS`], base.requests);
  const concurrency = normalizeNumber(process.env[`LOAD_${envPrefix}_CONCURRENCY`], base.concurrency);
  return { requests, concurrency };
};

const scenarioFactories = {
  home: () => ({
    name: 'home',
    method: 'GET',
    url: `${BASE_URL}/ads/public/home?limit=20`,
    headers: {}
  }),
  search: () => ({
    name: 'search',
    method: 'GET',
    url: `${BASE_URL}/ads?q=iphone&page=1&limit=20&sortBy=newest`,
    headers: {}
  }),
  chat: () => {
    const token = process.env.LOAD_USER_TOKEN || '';
    const conversationId = process.env.LOAD_CHAT_CONVERSATION_ID || '';
    if (!ENABLE_MUTATIONS || !token || !conversationId) {
      return { name: 'chat', skip: 'requires LOAD_ENABLE_MUTATIONS=true, LOAD_USER_TOKEN, LOAD_CHAT_CONVERSATION_ID' };
    }
    return {
      name: 'chat',
      method: 'POST',
      url: `${BASE_URL}/chat/messages`,
      headers: {
        'Content-Type': 'application/json',
        ...bearerHeader(token),
        'Idempotency-Key': `load-chat-${Date.now()}`
      },
      body: { content: `load-test-${Date.now()}` }
    };
  },
  post_ad: () => {
    const token = process.env.LOAD_USER_TOKEN || '';
    const payload = loadPostAdPayload();
    if (!ENABLE_MUTATIONS || !token || !payload) {
      return { name: 'post_ad', skip: 'requires LOAD_ENABLE_MUTATIONS=true, LOAD_USER_TOKEN, LOAD_POST_AD_PAYLOAD_PATH' };
    }
    return {
      name: 'post_ad',
      method: 'POST',
      url: `${BASE_URL}/ads`,
      headers: {
        'Content-Type': 'application/json',
        ...bearerHeader(token),
        'Idempotency-Key': `load-postad-${Date.now()}`
      },
      body: payload
    };
  }
};

const resolveScenarios = () => {
  const names = SCENARIO_FILTER.length > 0
    ? SCENARIO_FILTER
    : ['home', 'search', 'chat', 'post_ad'];
  return names
    .filter((name) => scenarioFactories[name])
    .map((name) => scenarioFactories[name]());
};

const runScenario = async (scenario, requests, concurrency) => {
  if (scenario.skip) {
    return {
      name: scenario.name,
      skipped: true,
      reason: scenario.skip
    };
  }

  let cursor = 0;
  let success = 0;
  let failure = 0;
  const durations = [];
  const statuses = {};

  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= requests) return;
      const started = Date.now();
      try {
        const response = await fetch(scenario.url, {
          method: scenario.method,
          headers: scenario.headers,
          body: scenario.body ? JSON.stringify(scenario.body) : undefined
        });
        const ms = Date.now() - started;
        durations.push(ms);
        statuses[response.status] = (statuses[response.status] || 0) + 1;
        if (response.ok) success += 1;
        else failure += 1;
      } catch {
        const ms = Date.now() - started;
        durations.push(ms);
        statuses.NETWORK_ERROR = (statuses.NETWORK_ERROR || 0) + 1;
        failure += 1;
      }
    }
  };

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  const startedAt = Date.now();
  await Promise.all(workers);
  const elapsedMs = Date.now() - startedAt;
  const rps = elapsedMs > 0 ? (requests / elapsedMs) * 1000 : 0;

  return {
    name: scenario.name,
    skipped: false,
    requests,
    concurrency,
    success,
    failure,
    successRate: Number(((success / requests) * 100).toFixed(2)),
    elapsedMs,
    throughputRps: Number(rps.toFixed(2)),
    latencyMs: {
      min: durations.length ? Math.min(...durations) : 0,
      avg: Number(mean(durations).toFixed(2)),
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      p99: percentile(durations, 99),
      max: durations.length ? Math.max(...durations) : 0
    },
    statuses
  };
};

const main = async () => {
  const scenarios = resolveScenarios();
  if (scenarios.length === 0) {
    console.error('No scenarios selected.');
    process.exit(1);
  }

  const results = [];
  for (const scenario of scenarios) {
    const scenarioLoad = getScenarioLoadConfig(scenario.name);
    const result = await runScenario(scenario, scenarioLoad.requests, scenarioLoad.concurrency);
    results.push(result);
    if (result.skipped) {
      console.log(`[SKIP] ${result.name}: ${result.reason}`);
      continue;
    }
    console.log(
      `[DONE] ${result.name} requests=${result.requests} success=${result.success} failure=${result.failure} p95=${result.latencyMs.p95}ms rps=${result.throughputRps}`
    );
  }

  const summary = {
    generatedAt: nowIso(),
    baseUrl: BASE_URL,
    profile: LOAD_PROFILE,
    concurrency: DEFAULT_CONCURRENCY,
    requestsPerScenario: DEFAULT_REQUESTS,
    scenarioConfigs: Object.fromEntries(
      scenarios.map((scenario) => [scenario.name, getScenarioLoadConfig(scenario.name)])
    ),
    results
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(`Load report written to ${REPORT_PATH}`);
};

main().catch((error) => {
  console.error('Load suite failed:', error);
  process.exit(1);
});

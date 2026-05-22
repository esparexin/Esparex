#!/usr/bin/env node
import http from "node:http";

const port = Number(process.env.E2E_MOCK_API_PORT || 5001);

const category = {
  id: "64b000000000000000000001",
  _id: "64b000000000000000000001",
  name: "Smartphones",
  slug: "smartphones",
  icon: "smartphone",
  status: "live",
  isActive: true,
};

const ok = (data) => ({ success: true, data });

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,x-csrf-token",
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `127.0.0.1:${port}`}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (req.method === "OPTIONS") {
    sendJson(res, 200, { success: true });
    return;
  }

  if (path === "/api/v1/health") {
    sendJson(res, 200, { success: true, status: "ok", mode: "e2e-mock" });
    return;
  }

  if (path === "/api/v1/csrf-token" || path === "/api/v1/auth/csrf") {
    sendJson(res, 200, { csrfToken: "mock-csrf-token-for-e2e" });
    return;
  }

  if (path === "/api/v1/catalog/categories") {
    sendJson(res, 200, ok([category]));
    return;
  }

  if (/^\/api\/v1\/catalog\/categories\/[^/]+\/schema$/.test(path)) {
    sendJson(res, 200, ok({ categoryId: category.id, categoryName: category.name, filters: [] }));
    return;
  }

  if (path === "/api/v1/listings/home") {
    sendJson(res, 200, ok({ featured: [], recent: [], promoted: [] }));
    return;
  }

  if (path === "/api/v1/listings") {
    sendJson(res, 200, ok({ items: [], total: 0 }));
    return;
  }

  if (path === "/api/v1/users/me/posting-balance") {
    sendJson(res, 200, ok({ totalRemaining: 3, freeRemaining: 1, paidCredits: 2 }));
    return;
  }

  if (path === "/api/v1/notifications") {
    sendJson(res, 200, ok({ items: [], total: 0 }));
    return;
  }

  if (path === "/api/v1/chat/list") {
    sendJson(res, 200, ok({ conversations: [], total: 0 }));
    return;
  }

  sendJson(res, 200, ok({}));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[e2e-mock-api] listening on http://127.0.0.1:${port}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(130)));

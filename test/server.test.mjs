// Automated API tests for Hermes Config Studio backend.
// Runs against a throwaway HERMES_HOME (temp dir) — never touches real ~/.hermes.
//
//   node test/server.test.mjs
//
// Exits non-zero on any failure. No external deps (uses node:test + fetch).
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = 38765;
const BASE = `http://127.0.0.1:${PORT}`;

// ── throwaway HERMES_HOME ─────────────────────────────────────
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'hcs-test-'));
const CFG = path.join(HOME, 'config.yaml');
const ENV = path.join(HOME, '.env');

const seedConfig = {
  model: { default: 'glm-5.3', provider: 'custom:z-ai' },
  providers: {
    'z-ai': {
      name: 'z-ai',
      base_url: 'https://api.z.ai/api/coding/paas/v4',
      key_env: 'ZAI_KEY',
      default_model: 'glm-5.3',
    },
    'test-bearer': {
      name: 'test-bearer',
      base_url: 'http://127.0.0.1:38766/v1',
      key_env: 'TEST_BEARER_KEY',
      default_model: 'm1',
    },
    'test-bifrost': {
      name: 'test-bifrost',
      base_url: 'http://127.0.0.1:38766/v1',
      key_env: 'TEST_BIFROST_KEY',
      default_model: 'm2',
      key_header: 'x-bf-vk',
    },
  },
  custom_providers: [
    { name: 'legacy-one', base_url: 'http://127.0.0.1:38766/v1', api_key: 'sk-legacy-abc123', model: 'm3' },
  ],
  fallback_providers: [
    { provider: 'zai', model: 'glm-5.3' },
  ],
};
fs.writeFileSync(CFG, yaml.dump(seedConfig), 'utf8');
fs.writeFileSync(ENV, 'ZAI_KEY=sk-zai-test-key-000000\nTEST_BEARER_KEY=sk-bearer-test\nTEST_BIFROST_KEY=vk-bifrost-test\n', 'utf8');

// ── mock upstream LLM server (records auth headers) ──────────
const RECORDED = [];
const mockUpstream = (await import('http')).createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    RECORDED.push({ url: req.url, headers: req.headers, body });
    if (req.url.endsWith('/chat/completions')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        model: JSON.parse(body).model,
        choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'OK' } }],
      }));
      return;
    }
    res.writeHead(404); res.end('{}');
  });
});
await new Promise((r) => mockUpstream.listen(38766, '127.0.0.1', r));

// ── start the app under test ──────────────────────────────────
const server = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
  env: { ...process.env, PORT: String(PORT), HERMES_HOME: HOME },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

// wait for readiness
async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try { await fetch(`${BASE}/api/providers`); return; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  throw new Error(`server did not start. log:\n${serverLog}`);
}

async function api(method, p, body) {
  const r = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}

let events;
before(async () => { await waitReady(); });
after(async () => {
  server.kill();
  mockUpstream.close();
  fs.rmSync(HOME, { recursive: true, force: true });
});

describe('GET /api/providers', () => {
  test('lists v12 + legacy providers with masked keys', async () => {
    const { status, body } = await api('GET', '/api/providers');
    assert.equal(status, 200);
    assert.equal(body.providers.length, 4);
    const zai = body.providers.find((p) => p.name === 'z-ai');
    assert.equal(zai.has_key, true);
    assert.match(zai.key_masked, /^sk-zai…/);
    assert.ok(!zai.key_masked.includes('test-key-000000'), 'full key must never be exposed');
    const legacy = body.providers.find((p) => p.name === 'legacy-one');
    assert.equal(legacy.section, 'custom_providers');
    assert.equal(legacy.key_source, 'inline (config.yaml)');
    assert.equal(body.active.provider, 'custom:z-ai');
  });
});

describe('POST /api/providers (create)', () => {
  test('env mode writes config + .env', async () => {
    const { status, body } = await api('POST', '/api/providers', {
      name: 'new-env', base_url: 'http://127.0.0.1:38766/v1',
      default_model: 'nx', key_mode: 'env', key_env: 'NEW_ENV_KEY', api_key: 'sk-new-12345678',
    });
    assert.equal(status, 200);
    assert.ok(fs.readFileSync(ENV, 'utf8').includes('NEW_ENV_KEY=sk-new-12345678'));
  });

  test('rejects URL pasted into api_key (the original clobbering bug)', async () => {
    const { status, body } = await api('POST', '/api/providers', {
      name: 'bad', base_url: 'http://x/v1', key_mode: 'env', key_env: 'BAD_KEY', api_key: 'https://evil.example.com/',
    });
    assert.equal(status, 400);
    assert.match(body.error, /URL/);
    assert.ok(!fs.readFileSync(ENV, 'utf8').includes('BAD_KEY='), 'must NOT write .env on validation failure');
  });

  test('rejects non-UPPERCASE env var names', async () => {
    const { status } = await api('POST', '/api/providers', {
      name: 'bad2', base_url: 'http://x/v1', key_mode: 'env', key_env: 'bad name', api_key: 'sk-x',
    });
    assert.equal(status, 400);
  });

  test('rejects duplicate name', async () => {
    const { status } = await api('POST', '/api/providers', {
      name: 'z-ai', base_url: 'http://x/v1', key_mode: 'env', key_env: 'X_KEY', api_key: 'sk-x',
    });
    assert.equal(status, 409);
  });

  test('inline mode stores key in config only', async () => {
    const { status } = await api('POST', '/api/providers', {
      name: 'new-inline', base_url: 'http://127.0.0.1:38766/v1', key_mode: 'inline', api_key: 'sk-inline-999',
    });
    assert.equal(status, 200);
    const cfg = yaml.load(fs.readFileSync(CFG, 'utf8'));
    const entry = cfg.custom_providers.find((p) => p.name === 'new-inline');
    assert.equal(entry.api_key, 'sk-inline-999');
  });
});

describe('PUT /api/providers/:pid (update)', () => {
  test('updates fields and preserves untouched key', async () => {
    const { status } = await api('PUT', '/api/providers/z-ai', {
      name: 'z-ai', base_url: 'https://api.z.ai/api/coding/paas/v4',
      default_model: 'glm-5.4', key_mode: 'env', key_env: 'ZAI_KEY',
    });
    assert.equal(status, 200);
    const env = fs.readFileSync(ENV, 'utf8');
    assert.ok(env.includes('ZAI_KEY=sk-zai-test-key-000000'), 'key must survive update without rewrite');
    const cfg = yaml.load(fs.readFileSync(CFG, 'utf8'));
    assert.equal(cfg.providers['z-ai'].default_model, 'glm-5.4');
  });

  test('new key overwrites .env entry', async () => {
    await api('PUT', '/api/providers/z-ai', {
      name: 'z-ai', base_url: 'https://api.z.ai/api/coding/paas/v4',
      key_mode: 'env', key_env: 'ZAI_KEY', api_key: 'sk-zai-rotated-999',
    });
    assert.ok(fs.readFileSync(ENV, 'utf8').includes('ZAI_KEY=sk-zai-rotated-999'));
  });
});

describe('POST /api/providers/:pid/test (connection test)', () => {
  test('bearer: sends Authorization header with the env key', async () => {
    RECORDED.length = 0;
    const { status, body } = await api('POST', '/api/providers/test-bearer/test', { model: 'm1' });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.http, '200');
    const rec = RECORDED.find((r) => r.url.includes('/chat/completions'));
    assert.ok(rec, 'upstream received request');
    assert.equal(rec.headers['authorization'], 'Bearer sk-bearer-test');
  });

  test('key_header: sends custom header (x-bf-vk) — the bifrost case', async () => {
    RECORDED.length = 0;
    const { status, body } = await api('POST', '/api/providers/test-bifrost/test', { model: 'm2' });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    const rec = RECORDED.find((r) => r.url.includes('/chat/completions'));
    assert.equal(rec.headers['x-bf-vk'], 'vk-bifrost-test');
    assert.ok(!rec.headers['authorization'], 'must not send bearer when key_header is set');
  });

  test('legacy inline key works too', async () => {
    RECORDED.length = 0;
    const legacyId = (await api('GET', '/api/providers')).body.providers.find((p) => p.name === 'legacy-one').id;
    const { body } = await api('POST', `/api/providers/${encodeURIComponent(legacyId)}/test`, { model: 'm3' });
    assert.equal(body.ok, true);
    const rec = RECORDED.find((r) => r.url.includes('/chat/completions'));
    assert.equal(rec.headers['authorization'], 'Bearer sk-legacy-abc123');
  });

  test('404 for unknown provider', async () => {
    const { status } = await api('POST', '/api/providers/nope/test', { model: 'x' });
    assert.equal(status, 404);
  });
});

describe('PUT /api/active (switch)', () => {
  test('switches model.provider/default', async () => {
    const { status } = await api('PUT', '/api/active', { name: 'test-bearer', model: 'm1' });
    assert.equal(status, 200);
    const cfg = yaml.load(fs.readFileSync(CFG, 'utf8'));
    assert.equal(cfg.model.provider, 'custom:test-bearer');
    assert.equal(cfg.model.default, 'm1');
  });

  test('rejects unknown provider', async () => {
    const { status } = await api('PUT', '/api/active', { name: 'ghost', model: 'x' });
    assert.equal(status, 404);
  });
});

describe('DELETE /api/providers/:pid', () => {
  test('removes entry + cleans fallback references', async () => {
    // ensure a fallback references z-ai so cleanup logic is exercised
    const cfg = yaml.load(fs.readFileSync(CFG, 'utf8'));
    cfg.fallback_providers = [{ provider: 'zai', model: 'glm-5.3' }, { provider: 'custom:z-ai', model: 'glm-5.3' }];
    fs.writeFileSync(CFG, yaml.dump(cfg), 'utf8');

    const { status, body } = await api('DELETE', '/api/providers/z-ai?force=true');
    assert.equal(status, 200);
    const after = yaml.load(fs.readFileSync(CFG, 'utf8'));
    assert.ok(!after.providers['z-ai']);
    assert.equal(after.fallback_providers.length, 0, 'fallback refs must be cleaned');
  });

  test('404 unknown', async () => {
    const { status } = await api('DELETE', '/api/providers/ghost?force=true');
    assert.equal(status, 404);
  });
});

describe('backup safety', () => {
  test('every mutation creates a timestamped backup', async () => {
    const dir = path.join(HOME, 'provider-backups');
    assert.ok(fs.existsSync(dir), 'backup dir created');
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('config-'));
    assert.ok(files.length >= 3, `expected >=3 backups, got ${files.length}`);
  });
});

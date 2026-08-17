import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';

const app = express();
const PORT = process.env.PORT || 3001;

// Local-only hardening: this tool manages API keys, so lock the attack
// surface down to the same origin that serves the UI.
// - CORS: deny cross-origin API calls (a page you happen to have open must
//   not be able to write to your Hermes config via simple requests).
// - Host allowlist: blocks DNS-rebinding sites reaching 127.0.0.1 directly.
app.use(cors({ origin: false }));
app.use((req, res, next) => {
  const host = (req.headers.host || '').split(':')[0];
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) {
    return res.status(403).json({ error: 'local access only' });
  }
  next();
});
app.use(express.json({ limit: '10mb' }));

// HERMES_HOME override: lets tests run against a throwaway home, and lets
// users with a custom Hermes install point this tool at it.
const HERMES_DIR = process.env.HERMES_HOME || path.join(os.homedir(), '.hermes');
const CONFIG_PATH = path.join(HERMES_DIR, 'config.yaml');

// Helper to get file stats
function getConfigStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      sizeBytes: stats.size,
      mtime: stats.mtime.toISOString(),
    };
  } catch (err) {
    return { exists: false, sizeBytes: 0, mtime: null };
  }
}

// 1. GET /api/config
app.get('/api/config', (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return res.status(404).json({ error: `Config file not found at ${CONFIG_PATH}` });
    }

    const rawYaml = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsedConfig = yaml.load(rawYaml) || {};
    const stats = getConfigStats(CONFIG_PATH);

    res.json({
      filePath: CONFIG_PATH,
      stats,
      rawYaml,
      parsedConfig,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read config file', details: err.message });
  }
});

// 2. POST /api/config/validate
app.post('/api/config/validate', (req, res) => {
  const { rawYaml } = req.body;
  if (typeof rawYaml !== 'string') {
    return res.status(400).json({ valid: false, error: 'rawYaml must be a string' });
  }

  try {
    const parsed = yaml.load(rawYaml);
    res.json({ valid: true, parsed });
  } catch (err) {
    res.json({
      valid: false,
      error: err.message,
      mark: err.mark ? { line: err.mark.line + 1, column: err.mark.column + 1 } : null,
    });
  }
});

// 3. POST /api/config
app.post('/api/config', (req, res) => {
  const { rawYaml, parsedConfig } = req.body;

  let contentToWrite = '';
  if (typeof rawYaml === 'string' && rawYaml.trim().length > 0) {
    try {
      yaml.load(rawYaml);
      contentToWrite = rawYaml;
    } catch (err) {
      return res.status(400).json({ error: 'Invalid YAML syntax', details: err.message });
    }
  } else if (parsedConfig && typeof parsedConfig === 'object') {
    try {
      contentToWrite = yaml.dump(parsedConfig, { indent: 2, lineWidth: -1, noRefs: true });
    } catch (err) {
      return res.status(400).json({ error: 'Failed to dump JSON to YAML', details: err.message });
    }
  } else {
    return res.status(400).json({ error: 'Either rawYaml or parsedConfig must be provided' });
  }

  try {
    // Create automatic backup before writing
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const backupPath = path.join(HERMES_DIR, `config.yaml.bak.${timestamp}`);

    if (fs.existsSync(CONFIG_PATH)) {
      fs.copyFileSync(CONFIG_PATH, backupPath);
      fs.copyFileSync(CONFIG_PATH, path.join(HERMES_DIR, 'config.yaml.bak'));
    }

    // Write new config
    fs.writeFileSync(CONFIG_PATH, contentToWrite, 'utf8');

    const stats = getConfigStats(CONFIG_PATH);
    const updatedParsed = yaml.load(contentToWrite);

    res.json({
      success: true,
      message: 'Configuration saved successfully',
      backupPath,
      stats,
      rawYaml: contentToWrite,
      parsedConfig: updatedParsed,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config file', details: err.message });
  }
});

// 4. GET /api/backups
app.get('/api/backups', (req, res) => {
  try {
    if (!fs.existsSync(HERMES_DIR)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(HERMES_DIR);
    const backupFiles = files
      .filter((f) => f.startsWith('config.yaml.bak'))
      .map((f) => {
        const fullPath = path.join(HERMES_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          filename: f,
          path: fullPath,
          sizeBytes: stats.size,
          mtime: stats.mtime.toISOString(),
          isLatest: f === 'config.yaml.bak',
        };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

    res.json({ backups: backupFiles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list backups', details: err.message });
  }
});

// 5. POST /api/config/restore
app.post('/api/config/restore', (req, res) => {
  const { filename } = req.body;
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'filename is required' });
  }
  // Path-traversal guard: only plain backup filenames inside HERMES_DIR are
  // restorable — no separators, no '..', no absolute paths.
  if (/[\\/]|\.\./.test(filename)) {
    return res.status(400).json({ error: 'invalid filename' });
  }
  if (!filename.startsWith('config.yaml.bak')) {
    return res.status(400).json({ error: 'not a config backup file' });
  }

  const backupFilePath = path.join(HERMES_DIR, filename);
  if (!fs.existsSync(backupFilePath)) {
    return res.status(404).json({ error: `Backup file ${filename} not found` });
  }

  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const snapshotPath = path.join(HERMES_DIR, `config.yaml.bak.prerestore_${timestamp}`);
    if (fs.existsSync(CONFIG_PATH)) {
      fs.copyFileSync(CONFIG_PATH, snapshotPath);
    }

    fs.copyFileSync(backupFilePath, CONFIG_PATH);

    const rawYaml = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsedConfig = yaml.load(rawYaml) || {};
    const stats = getConfigStats(CONFIG_PATH);

    res.json({
      success: true,
      message: `Restored from ${filename}`,
      filePath: CONFIG_PATH,
      stats,
      rawYaml,
      parsedConfig,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore backup', details: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Provider Manager API (merged from hermes-provider-manager)
// ═══════════════════════════════════════════════════════════════════

const ENV_PATH = path.join(HERMES_DIR, '.env');
const PROVIDER_BACKUP_DIR = path.join(HERMES_DIR, 'provider-backups');

function loadCfg() {
  return yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8')) || {};
}

function backupConfig() {
  fs.mkdirSync(PROVIDER_BACKUP_DIR, { recursive: true });
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${String(process.pid % 10000).padStart(4, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  const dest = path.join(PROVIDER_BACKUP_DIR, `config-${ts}.yaml`);
  fs.copyFileSync(CONFIG_PATH, dest);
  // keep last 10
  const olds = fs.readdirSync(PROVIDER_BACKUP_DIR)
    .filter((f) => f.startsWith('config-'))
    .sort()
    .reverse();
  for (const f of olds.slice(10)) {
    try { fs.unlinkSync(path.join(PROVIDER_BACKUP_DIR, f)); } catch {}
  }
  return dest;
}

function saveCfg(cfg) {
  backupConfig();
  fs.writeFileSync(CONFIG_PATH, yaml.dump(cfg, { indent: 2, lineWidth: -1, noRefs: true }), 'utf8');
}

// ---- .env helpers ----
function envGet(key) {
  if (!key || !fs.existsSync(ENV_PATH)) return null;
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const s = line.trim();
    if (s.startsWith(`${key}=`)) return s.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

function envSet(key, value) {
  const lines = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8').split('\n') : [];
  const out = [];
  let replaced = false;
  for (const line of lines) {
    if (line.trim().startsWith(`${key}=`)) {
      out.push(`${key}=${value}`);
      replaced = true;
    } else {
      out.push(line);
    }
  }
  if (!replaced) out.push(`${key}=${value}`);
  fs.writeFileSync(ENV_PATH, out.filter((l, i, a) => !(l === '' && i === a.length - 1)).join('\n') + '\n', 'utf8');
}

function maskKey(v) {
  if (!v) return null;
  if (v.length <= 12) return v.slice(0, 3) + '…';
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}

function looksLikeUrl(v) {
  return Boolean(v) && /^(https?:\/\/|www\.)/i.test(String(v).trim());
}

function providerView(entry, section, key) {
  const keyEnv = entry.key_env || null;
  const inlineKey = entry.api_key || null;
  let keyMasked = null, hasKey = false, keySource = null;
  if (inlineKey) {
    keyMasked = maskKey(String(inlineKey));
    hasKey = true;
    keySource = 'inline (config.yaml)';
  } else if (keyEnv) {
    const v = envGet(String(keyEnv));
    keyMasked = maskKey(v);
    hasKey = Boolean(v);
    keySource = `env:${keyEnv}`;
  }
  let models = entry.models;
  if (models && typeof models === 'object' && !Array.isArray(models)) models = Object.keys(models);
  return {
    id: key,
    section,
    name: entry.name || key.split(':').pop(),
    base_url: entry.base_url || null,
    key_env: keyEnv,
    key_masked: keyMasked,
    has_key: hasKey,
    key_source: keySource,
    default_model: entry.default_model || entry.model || null,
    key_header: entry.key_header || null,
    models: Array.isArray(models) ? models : null,
  };
}

function allProviders(cfg) {
  const out = [];
  for (const [k, p] of Object.entries(cfg.providers || {})) {
    if (p && typeof p === 'object') out.push(providerView(p, 'providers', k));
  }
  (cfg.custom_providers || []).forEach((p, i) => {
    if (p && typeof p === 'object') {
      out.push(providerView(p, 'custom_providers', `legacy${i}-${String(p.name || i).replace(/:/g, '-')}`));
    }
  });
  return out;
}

function findEntry(cfg, pid) {
  if (pid.startsWith('legacy') && pid.includes('-')) {
    const idx = parseInt(pid.slice('legacy'.length).split('-')[0], 10);
    const lst = cfg.custom_providers || [];
    if (idx >= 0 && idx < lst.length) return { section: 'custom_providers', loc: idx, entry: lst[idx] };
    return { section: null, loc: null, entry: null };
  }
  const p = (cfg.providers || {})[pid];
  return p && typeof p === 'object'
    ? { section: 'providers', loc: pid, entry: p }
    : { section: null, loc: null, entry: null };
}

function validateKey(value, field) {
  if (value && looksLikeUrl(value)) {
    const err = new Error(`${field} ดูเหมือนจะเป็น URL — น่าจะวางผิดช่อง (URL ใส่ที่ Base URL)`);
    err.status = 400;
    throw err;
  }
}

function validateKeyEnvName(name) {
  if (!name) return name;
  if (!/^[A-Z][A-Z0-9_]*$/.test(name.trim())) {
    const err = new Error('ชื่อ env var ต้องเป็น UPPERCASE_SNAKE (เช่น MY_PROVIDER_API_KEY)');
    err.status = 400;
    throw err;
  }
  return name.trim();
}

function applyKeyHeader(entry, keyHeader, apiKey) {
  const kh = (keyHeader || '').trim();
  if (kh) {
    entry.key_header = kh;
    const headers = { ...(entry.extra_headers || {}) };
    const oldVal = headers[kh] || entry._stored_key_value;
    const val = apiKey || oldVal;
    if (val && !looksLikeUrl(val)) {
      headers[kh] = val;
      entry.extra_headers = headers;
      entry._stored_key_value = val;
    }
  } else {
    delete entry.key_header;
    delete entry._stored_key_value;
  }
}

// 6. GET /api/providers
app.get('/api/providers', (req, res) => {
  const cfg = loadCfg();
  const active = cfg.model || {};
  res.json({
    providers: allProviders(cfg),
    active: { provider: active.provider, model: active.default },
    fallback_providers: cfg.fallback_providers || [],
  });
});

// 7. POST /api/providers
app.post('/api/providers', (req, res) => {
  const p = req.body || {};
  const name = String(p.name || '').trim();
  if (!name || !String(p.base_url || '').trim()) {
    return res.status(400).json({ error: 'ต้องมี name และ base_url' });
  }
  const cfg = loadCfg();
  const existing = new Set(allProviders(cfg).map((x) => x.name.toLowerCase()));
  if (existing.has(name.toLowerCase())) {
    return res.status(409).json({ error: `มี provider ชื่อ '${name}' อยู่แล้ว` });
  }
  try {
    validateKey(p.api_key, 'API key');
    let entry;
    if (p.key_mode === 'inline') {
      if (!p.api_key) return res.status(400).json({ error: 'inline mode ต้องใส่ api_key' });
      entry = { name, base_url: p.base_url.trim(), api_key: p.api_key };
      applyKeyHeader(entry, p.key_header, p.api_key);
      if (p.default_model) entry.model = p.default_model.trim();
      if (p.models) entry.models = p.models;
      (cfg.custom_providers = cfg.custom_providers || []).push(entry);
    } else {
      validateKeyEnvName(p.key_env);
      entry = { name, base_url: p.base_url.trim() };
      if (p.key_env) {
        entry.key_env = p.key_env.trim();
        if (p.api_key) envSet(p.key_env.trim(), p.api_key);
      }
      applyKeyHeader(entry, p.key_header, p.api_key || (p.key_env ? envGet(p.key_env) : null));
      if (p.default_model) entry.default_model = p.default_model.trim();
      (cfg.providers = cfg.providers || {})[name] = entry;
    }
    saveCfg(cfg);
    res.json({ success: true, name });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// 8. PUT /api/providers/:pid
app.put('/api/providers/:pid', (req, res) => {
  const p = req.body || {};
  const cfg = loadCfg();
  const { section, loc, entry } = findEntry(cfg, req.params.pid);
  if (!entry) return res.status(404).json({ error: 'ไม่พบ provider' });
  try {
    entry.name = String(p.name || '').trim();
    entry.base_url = String(p.base_url || '').trim();
    validateKey(p.api_key, 'API key');
    applyKeyHeader(entry, p.key_header, p.api_key);

    if (p.key_mode === 'inline') {
      if (p.api_key) entry.api_key = p.api_key;
      delete entry.key_env;
      if (p.default_model) entry.model = p.default_model.trim();
      else delete entry.model;
      if (p.models !== undefined && p.models !== null) entry.models = p.models;
    } else {
      validateKeyEnvName(p.key_env);
      if (p.key_env) {
        entry.key_env = p.key_env.trim();
        if (p.api_key) envSet(p.key_env.trim(), p.api_key);
      }
      delete entry.api_key;
      if (p.default_model) entry.default_model = p.default_model.trim();
      else delete entry.default_model;
      delete entry.model;
    }
    saveCfg(cfg);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// 9. DELETE /api/providers/:pid
app.delete('/api/providers/:pid', (req, res) => {
  const cfg = loadCfg();
  const { section, loc, entry } = findEntry(cfg, req.params.pid);
  if (!entry) return res.status(404).json({ error: 'ไม่พบ provider' });
  const name = entry.name || String(loc);
  const force = req.query.force === 'true';
  const activeRef = String((cfg.model || {}).provider || '');
  const isActive = activeRef === `custom:${name}` || activeRef === name;

  if (isActive && !force) {
    return res.status(409).json({ error: 'provider นี้เป็นตัวที่ใช้งานอยู่ — สลับไปตัวอื่นก่อน หรือยืนยันลบ (force)' });
  }

  if (section === 'providers') delete cfg.providers[loc];
  else cfg.custom_providers.splice(loc, 1);

  let removedFb = 0;
  if (Array.isArray(cfg.fallback_providers)) {
    // Normalize the comparison: fallback entries reference providers by bare
    // name or "custom:<name>", and users type both spellings (zai vs z-ai) —
    // strip non-alphanumerics so every spelling of the same name matches.
    const norm = (s) => String(s || '').toLowerCase().replace(/^custom:/, '').replace(/[^a-z0-9]/g, '');
    const target = norm(name);
    cfg.fallback_providers = cfg.fallback_providers.filter((f) => {
      const ref = norm(f && f.provider);
      if (ref && ref === target) { removedFb += 1; return false; }
      return true;
    });
  }

  if (isActive && force) {
    cfg.model.provider = null;
    cfg.model.default = null;
  }

  saveCfg(cfg);
  let message = `ลบ '${name}' แล้ว`;
  if (removedFb) message += ` (เคลียร์ fallback ${removedFb} รายการ)`;
  if (isActive) message += ' — ระวัง: ตัวที่ลบเป็น active provider, model ถูกรีเซ็ต';
  res.json({ success: true, message });
});

// 10. POST /api/providers/:pid/test
app.post('/api/providers/:pid/test', (req, res) => {
  const cfg = loadCfg();
  const { entry } = findEntry(cfg, req.params.pid);
  if (!entry) return res.status(404).json({ error: 'ไม่พบ provider' });

  const base = String(entry.base_url || '').replace(/\/+$/, '');
  const model = (req.body && req.body.model) || entry.default_model || entry.model;
  if (!model) return res.status(400).json({ error: 'ไม่ทราบ model — ระบุ model ที่จะทดสอบ' });

  const keyHeader = String(entry.key_header || '').trim();
  let key = null;
  if (entry.api_key) key = String(entry.api_key);
  else if (entry._stored_key_value) key = String(entry._stored_key_value);
  else if (entry.key_env) {
    key = envGet(String(entry.key_env));
    if (!key) return res.status(400).json({ error: `ไม่พบ key ใน .env ที่ตัวแปร ${entry.key_env}` });
  }

  let authHeader = null;
  if (key && keyHeader) authHeader = [keyHeader, key];
  else if (key) authHeader = ['Authorization', `Bearer ${key}`];

  const url = `${base}/chat/completions`;
  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    max_tokens: 200,
  });

  // Pass the credential via a curl --config temp file (0600): the key must
  // not appear in the process list (argv) nor in server logs, and node's
  // spawn has no shell so "$VAR" strings are never expanded.
  const tmp = path.join(os.tmpdir(), `hpm-curl-${process.pid}-${Date.now()}.cfg`);
  let curlArgs = ['-sS', '-m', '45', '-w', '\n%{http_code}', url, '-H', 'Content-Type: application/json', '-d', body];
  if (authHeader) {
    const safeVal = authHeader[1].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    fs.writeFileSync(tmp, `header = "${authHeader[0]}: ${safeVal}"\n`, { mode: 0o600 });
    curlArgs = ['-sS', '-m', '45', '-w', '\n%{http_code}', url, '-H', 'Content-Type: application/json', '-K', tmp, '-d', body];
  }

  const t0 = Date.now();
  execFile('curl', curlArgs, { timeout: 50000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    try { if (authHeader) fs.unlinkSync(tmp); } catch {}
    const latencyMs = Date.now() - t0;
    const parts = String(stdout || '').split('\n');
    const httpCode = (parts.length >= 2 ? parts.pop() : '?').trim();
    const payload = parts.join('\n');

    const ok = httpCode === '200';
    let reply = null, servedModel = null, error = null;
    if (ok) {
      try {
        const j = JSON.parse(payload);
        reply = ((j.choices || [{}])[0].message || {}).content || '';
        reply = String(reply).slice(0, 120);
        servedModel = j.model;
      } catch {}
    } else {
      error = (payload || stderr || `HTTP ${httpCode}`).slice(0, 300);
    }
    res.json({ ok, http: httpCode, latency_ms: latencyMs, model, served_model: servedModel, reply, error });
  });
});

// 11. PUT /api/active
app.put('/api/active', (req, res) => {
  const { name, model } = req.body || {};
  if (!model) return res.status(400).json({ error: 'ระบุ model' });
  const cfg = loadCfg();
  const names = new Set(allProviders(cfg).map((x) => x.name));
  if (!names.has(name)) return res.status(404).json({ error: `ไม่พบ provider '${name}'` });
  cfg.model = cfg.model || {};
  cfg.model.provider = `custom:${name}`;
  cfg.model.default = String(model).trim();
  saveCfg(cfg);
  res.json({ success: true, provider: `custom:${name}`, model });
});

// Serve built frontend (dist/) at the same port as the API — single-process
// local tool: no CORS, no second port. SPA fallback for client-side routing.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // Express 5: '*' wildcard path is invalid — use a regex catch-all
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`Serving frontend from ${DIST_DIR}`);
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Hermes Config Backend running on http://127.0.0.1:${PORT}`);
});

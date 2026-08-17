'use strict';
// Screenshot generator for README — runs the app against a THROWAWAY demo
// HERMES_HOME so no personal providers/URLs appear in the images.
//
//   node scripts/capture-screenshots.mjs
//
// Outputs: docs/screenshots/{overview,providers,provider-edit,raw-yaml}.png
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = 38767;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, 'docs', 'screenshots');

// ── demo home (generic data only — no personal references) ────
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'hcs-shot-'));
const demoConfig = {
  model: { default: 'glm-5.3', provider: 'custom:z-ai', context_length: 196000 },
  providers: {
    'z-ai': {
      name: 'z-ai',
      base_url: 'https://api.z.ai/api/paas/v4',
      key_env: 'ZAI_API_KEY',
      default_model: 'glm-5.3',
    },
    openrouter: {
      name: 'openrouter',
      base_url: 'https://openrouter.ai/api/v1',
      key_env: 'OPENROUTER_API_KEY',
      default_model: 'anthropic/claude-sonnet-4',
    },
    'local-gateway': {
      name: 'local-gateway',
      base_url: 'http://localhost:20128/v1',
      key_env: 'LOCAL_GW_KEY',
      default_model: 'auto/best-free',
      key_header: 'x-bf-vk',
    },
  },
  custom_providers: [
    { name: 'ollama-lab', base_url: 'http://localhost:11434/v1', api_key: 'sk-local-lab-key', model: 'qwen3-coder:480b' },
  ],
  fallback_providers: [
    { provider: 'openrouter', model: 'anthropic/claude-sonnet-4' },
    { provider: 'custom', model: 'glm-5.3' },
  ],
  agent: { max_turns: 90 },
  compression: { enabled: true, threshold: 0.5, target_ratio: 0.2 },
};
fs.writeFileSync(path.join(HOME, 'config.yaml'), yaml.dump(demoConfig), 'utf8');
fs.writeFileSync(path.join(HOME, '.env'),
  'ZAI_API_KEY=sk-zai-demo-1111222233334444\nOPENROUTER_API_KEY=sk-or-demo-5555666677778888\nLOCAL_GW_KEY=vk-demo-99990000aaaa\n', 'utf8');

fs.mkdirSync(OUT, { recursive: true });

// ── start server with demo home ────────────────────────────────
const server = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
  env: { ...process.env, PORT: String(PORT), HERMES_HOME: HOME },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
server.stdout.on('data', (d) => (log += d));
server.stderr.on('data', (d) => (log += d));

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try { await fetch(`${BASE}/api/providers`); return; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  throw new Error(`server failed to start:\n${log}`);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

async function shot(name, opts = {}) {
  await page.waitForTimeout(opts.settle ?? 600);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: !!opts.fullPage });
  console.log(`✓ ${name}.png`);
}

try {
  await waitReady();
  await page.goto(BASE);
  await page.waitForSelector('text=Providers', { timeout: 10000 });

  // 1 — Overview tab
  await shot('overview', { settle: 900 });

  // 2 — Providers (the main feature)
  await page.click('text=Models & Providers');
  await shot('providers', { settle: 900 });

  // 3 — Edit modal open
  await page.click('button:has-text("แก้ไข")');
  await shot('provider-edit', { settle: 700 });
  await page.keyboard.press('Escape');
  await page.click('body', { position: { x: 720, y: 20 } }).catch(() => {});

  // 4 — Raw YAML editor
  await page.click('text=Raw YAML Editor');
  await shot('raw-yaml', { settle: 900 });

  console.log('done');
} catch (err) {
  console.error('CAPTURE ERROR:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill();
  fs.rmSync(HOME, { recursive: true, force: true });
}

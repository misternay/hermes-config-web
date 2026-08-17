<div align="center">

# Hermes Config Studio

**A local web UI for managing [Hermes Agent](https://hermes-agent.nousresearch.com) configuration — providers, models, and full config editing with automatic backups.**

[![Tests](https://img.shields.io/badge/tests-17%2F17-brightgreen)]() [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Node](https://img.shields.io/badge/node-%3E%3D20-339933)]()

Dark, developer-first dashboard for the `~/.hermes/` config that normally lives in a YAML file you're afraid to touch.

</div>

---

## Why

Hermes Agent is configured via `~/.hermes/config.yaml` + `~/.hermes/.env`. Adding a provider means hand-editing YAML, guessing which env var name the key lives in, and hoping you didn't break the fallback chain. This tool gives you:

- **Provider manager** — add / edit / delete providers (both the modern `providers:` map and legacy `custom_providers:` list), with API-key handling that never renders full keys in the UI
- **Connection testing** — one click fires a real chat completion and shows HTTP status, latency, the model that actually served the request, and the reply
- **Custom auth headers** — gateways like [Bifrost](https://github.com/maxnowack/bifrost) need the key in `x-bf-vk` instead of `Authorization: Bearer`; supported per provider
- **Active route switching** — flip `model.provider` + `model.default` from a dropdown
- **Fallback chain view** — see the failover order at a glance
- **Full config editor** — every other config section (agent, toolsets, personalities, terminal, …) plus a raw YAML editor with validation
- **Automatic backups** — every mutation snapshots `config.yaml` first; restore from the UI

## Screenshot

> _tip: add one after first run — `open http://127.0.0.1:8765`_

```
┌────────────────────────────────────────────────────────────┐
│ ● Active Route  custom:z-ai · glm-5.3        [z-ai ▾][glm‑5.3][สลับ] │
├────────────────────────────────────────────────────────────┤
│ ● z-ai          [V12]                                      │
│   https://api.z.ai/... · glm-5.3 · sk-x…key                │
│   [⚡ Test] [✎ Edit] [🗑 Delete]                            │
│                                                            │
│ ● arise-glm5    [x-bf-vk] [ACTIVE]                          │
│   https://inf-bifrost.../v1 · huawei/glm-5.2               │
│   ✓ 200 OK · 7.1s · served: glm-5.2 · replied "OK"         │
└────────────────────────────────────────────────────────────┘
```

## Quick start

```bash
git clone https://github.com/misternay/hermes-config-web.git
cd hermes-config-web
npm install
npm run build
npm start            # → http://127.0.0.1:8765
```

Or with the helper script (auto-builds when sources change):

```bash
./start.sh           # start + open browser
./start.sh stop
```

## Security model

This tool reads and writes your real Hermes config, including API keys. It is designed to be **strictly local**:

- Binds to `127.0.0.1` only — unreachable from the network
- No authentication layer — if you expose it, you expose your keys. Don't.
- Full API keys are **never** sent to the browser; only masked previews (`sk-7OCL…y_BA`)
- Connection tests pass credentials to `curl` via a `0600` temp config file, never in `argv` (invisible in `ps`) and never logged
- Validation guards: values that look like URLs are rejected in key fields (a real footgun we hit and fixed), env var names must be `UPPERCASE_SNAKE`
- Every write creates a timestamped backup in `~/.hermes/provider-backups/` (last 10 kept)

## Development

```bash
npm run dev          # vite dev server (frontend only, proxies /api → :3001)
npm run server       # backend on :3001
npm test             # API test suite (17 tests, throwaway HERMES_HOME)
```

The test suite runs the real server against a temp home with a mock LLM upstream, and asserts on the actual HTTP headers received — including the Bifrost `x-bf-vk` path and the key-leak regressions.

### Stack

React 19 · Vite 8 · Tailwind CSS 4 · Express 5 · js-yaml · lucide-react — no database, no telemetry, no external calls except the providers you configure.

## Config reference

| Field | Meaning |
|---|---|
| `base_url` | OpenAI-compatible endpoint root (e.g. `https://host/v1`) |
| `key_mode` | `env` — key stored in `~/.hermes/.env` under `key_env` (recommended) · `inline` — embedded in config.yaml |
| `key_header` | Custom header for the credential. Empty = `Authorization: Bearer`. Bifrost gateways: `x-bf-vk` |
| `default_model` | Model used when the provider is selected |
| `fallback_providers` | Ordered failover chain |

## License

[MIT](LICENSE)

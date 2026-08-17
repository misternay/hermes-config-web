import React, { useState, useEffect, useCallback } from 'react';
import {
  Server, Plus, Trash2, Pencil, Zap, RefreshCw, CheckCircle2, XCircle,
  Loader2, Key, Link2, Cpu, ArrowLeftRight, ShieldCheck, AlertTriangle, Globe,
} from 'lucide-react';

const API = '/api';

async function api(path, opts = {}) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

export default function ModelProviderSection() {
  const [providers, setProviders] = useState([]);
  const [active, setActive] = useState({ provider: null, model: null });
  const [fallbacks, setFallbacks] = useState([]);
  const [testing, setTesting] = useState({});
  const [results, setResults] = useState({});
  const [editing, setEditing] = useState(null); // null | 'new' | pid
  const [switching, setSwitching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // provider being deleted
  const [toast, setToast] = useState(null); // {msg, ok}

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = useCallback(async () => {
    const d = await api(`${API}/providers`);
    setProviders(d.providers);
    setActive(d.active);
    setFallbacks(d.fallback_providers || []);
  }, []);

  useEffect(() => { refresh().catch(console.error); }, [refresh]);

  const isActive = (p) =>
    active.provider && (active.provider === `custom:${p.name}` || active.provider === p.name);

  const runTest = async (pid) => {
    setTesting((t) => ({ ...t, [pid]: true }));
    setResults((r) => ({ ...r, [pid]: null }));
    try {
      const p = providers.find((x) => x.id === pid);
      const res = await api(`${API}/providers/${encodeURIComponent(pid)}/test`, {
        method: 'POST',
        body: JSON.stringify({ model: p.default_model }),
      });
      setResults((r) => ({ ...r, [pid]: res }));
    } catch (e) {
      setResults((r) => ({ ...r, [pid]: { ok: false, error: e.message } }));
    } finally {
      setTesting((t) => ({ ...t, [pid]: false }));
    }
  };

  const removeProvider = async (pid) => {
    const p = providers.find((x) => x.id === pid);
    if (!p) return;
    setConfirmDelete(p);
  };

  const doDelete = async () => {
    const p = confirmDelete;
    setConfirmDelete(null);
    try {
      const r = await api(`/api/providers/${encodeURIComponent(p.id)}?force=true`, { method: 'DELETE' });
      notify(r.message || 'ลบแล้ว');
      refresh();
    } catch (e) { notify(e.message, false); }
  };

  const switchActive = async () => {
    const name = document.getElementById('sw-prov').value;
    const model = document.getElementById('sw-model').value.trim();
    if (!model) return notify('ระบุ model ด้วย', false);
    setSwitching(true);
    try {
      await api('/api/active', { method: 'PUT', body: JSON.stringify({ name, model }) });
      notify(`สลับเป็น ${name} / ${model} แล้ว (session ใหม่ถึงมีผล)`);
      refresh();
    } catch (e) { notify(e.message, false); }
    finally { setSwitching(false); }
  };

  return (
    <div className="space-y-6">
      {/* ── Active + switch bar ─────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Active Route</div>
              <div className="text-sm font-semibold text-slate-100">
                <span className="text-emerald-400 font-mono">{active.provider || '—'}</span>
                <span className="text-slate-500 mx-2">·</span>
                <span className="font-mono">{active.model || '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <select
              id="sw-prov"
              className="bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[140px]"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <input
              id="sw-model"
              defaultValue={active.model || ''}
              placeholder="model เช่น glm-5.3"
              className="bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
            />
            <button
              onClick={switchActive}
              disabled={switching}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-smooth"
            >
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
              สลับ
            </button>
          </div>
        </div>
      </div>

      {/* ── Provider list header ────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Providers</h3>
              <p className="text-xs text-slate-400">
                {providers.length} ตัว · แก้ไข / ลบ / ทดสอบ connection ได้จากที่นี่ · ทุกการแก้ backup อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-smooth"
          >
            <Plus className="h-4 w-4" />
            เพิ่ม Provider
          </button>
        </div>

        <div className="p-4 space-y-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="group rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-smooth"
            >
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${isActive(p) ? 'bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/50' : p.has_key ? 'bg-cyan-500/70' : 'bg-rose-500'}`} />
                  <span className="font-mono font-semibold text-sm text-slate-100 truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isActive(p) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">ACTIVE</span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${p.section === 'custom_providers' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-600'}`}>
                    {p.section === 'custom_providers' ? 'LEGACY' : 'V12'}
                  </span>
                  {p.key_header && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30 font-mono">{p.key_header}</span>
                  )}
                  {!p.has_key && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">NO KEY</span>
                  )}
                </div>

                <div className="flex-1 min-w-[200px] hidden md:block">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate">
                    <Globe className="h-3 w-3 shrink-0" />
                    {p.base_url}
                    {p.default_model && <><span className="text-slate-600">·</span><Cpu className="h-3 w-3 shrink-0" /><span className="text-slate-300">{p.default_model}</span></>}
                    {p.key_masked && <><span className="text-slate-600">·</span><Key className="h-3 w-3 shrink-0" /><span className="text-slate-500">{p.key_masked}</span></>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => runTest(p.id)}
                    disabled={testing[p.id]}
                    className="flex items-center gap-1.5 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-smooth disabled:opacity-50"
                  >
                    {testing[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    Test
                  </button>
                  <button
                    onClick={() => setEditing(p.id)}
                    className="flex items-center gap-1.5 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 text-slate-300 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-smooth"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => removeProvider(p.id)}
                    className="flex items-center gap-1.5 border border-slate-700 hover:border-rose-500 hover:text-rose-400 text-slate-300 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-smooth"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ลบ
                  </button>
                </div>
              </div>

              {/* Test result inline */}
              {results[p.id] && (
                <div className={`mx-4 mb-3 rounded-lg border px-4 py-3 text-xs font-mono ${results[p.id].ok ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300' : 'border-rose-500/40 bg-rose-500/5 text-rose-300'}`}>
                  <div className="flex items-center gap-2">
                    {results[p.id].ok
                      ? <><CheckCircle2 className="h-4 w-4 shrink-0" /><span className="font-semibold">ใช้ได้</span></>
                      : <><XCircle className="h-4 w-4 shrink-0" /><span className="font-semibold">ล้มเหลว</span></>}
                    <span className="text-slate-400">HTTP {results[p.id].http ?? '?'} · {results[p.id].latency_ms}ms</span>
                    {results[p.id].ok && results[p.id].served_model && <span className="text-slate-400">· model: <span className="text-slate-200">{results[p.id].served_model}</span></span>}
                  </div>
                  {results[p.id].error && <div className="mt-1.5 text-slate-400 break-all">{results[p.id].error}</div>}
                  {results[p.id].ok && results[p.id].reply && <div className="mt-1.5 text-slate-500">ตอบ: "{results[p.id].reply}"</div>}
                </div>
              )}
            </div>
          ))}
          {providers.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">ยังไม่มี provider — เพิ่มตัวแรกได้เลย</div>
          )}
        </div>
      </div>

      {/* ── Fallback chain (read-only summary) ──────────────── */}
      {fallbacks.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Fallback Chain</h3>
              <p className="text-xs text-slate-400">เรียงตามลำดับ ถ้าตัวหลักพังจะไล่ลงไปตามนี้ (แก้ได้ที่ Raw YAML)</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {fallbacks.map((f, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-600 text-xs">→</span>}
                <span className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300">
                  {f.provider}<span className="text-slate-600">/</span><span className="text-slate-400">{f.model}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit / create modal ─────────────────────────────── */}
      {editing && (
        <ProviderModal
          pid={editing === 'new' ? null : editing}
          provider={editing === 'new' ? null : providers.find((p) => p.id === editing)}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}

      {/* ── Delete confirm dialog ───────────────────────────── */}
      {confirmDelete && (
        <ConfirmDialog
          title={`ลบ provider "${confirmDelete.name}" ?`}
          body="config จะ backup อัตโนมัติก่อนลบ — การกระทำนี้ย้อนกลับได้ผ่าน backup"
          confirmLabel="ลบ"
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] rounded-lg border px-4 py-2.5 text-sm shadow-xl shadow-black/40 ${toast.ok ? 'border-emerald-500/50 bg-emerald-950/90 text-emerald-200' : 'border-rose-500/50 bg-rose-950/90 text-rose-200'}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Accessible dialog primitives (ESC to close, focus trap, initial focus)
function useDialogA11y(onClose) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const prevFocus = document.activeElement;
    // initial focus: first focusable element (the close button / first input)
    const focusables = node.querySelectorAll('input, select, textarea, button, [href]');
    if (focusables.length) focusables[1] || focusables[0].focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        // focus trap
        const items = Array.from(node.querySelectorAll('input, select, textarea, button, [href]')).filter((el) => !el.disabled);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
  }, [onClose]);
  return ref;
}

function ConfirmDialog({ title, body, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const ref = useDialogA11y(onCancel);
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-label={title} className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">{body}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 border-t border-slate-800 px-6 py-4">
          <button autoFocus onClick={onCancel} className="border border-slate-700 hover:border-slate-500 text-slate-300 px-4 py-2 rounded-lg text-sm cursor-pointer transition-smooth focus:outline-none focus:ring-2 focus:ring-slate-500">ยกเลิก</button>
          <button onClick={onConfirm} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-smooth focus:outline-none focus:ring-2 focus:ring-rose-400">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ProviderModal({ pid, provider, onClose, onSaved }) {
  const dlgRef = useDialogA11y(onClose);
  const isNew = !pid;
  const [form, setForm] = useState(() => ({
    name: provider?.name || '',
    base_url: provider?.base_url || '',
    default_model: provider?.default_model || '',
    key_mode: provider ? (String(provider.key_source || '').startsWith('env') ? 'env' : provider.has_key ? 'inline' : 'env') : 'env',
    key_env: provider?.key_env || '',
    api_key: '',
    key_header: provider?.key_header || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      ...form,
      api_key: form.api_key.trim() || null,
      default_model: form.default_model.trim() || null,
      key_header: form.key_header.trim() || null,
    };
    try {
      if (isNew) await api(`${API}/providers`, { method: 'POST', body: JSON.stringify(body) });
      else await api(`${API}/providers/${encodeURIComponent(pid)}`, { method: 'PUT', body: JSON.stringify(body) });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const F = 'w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-smooth';
  const L = 'block text-xs font-mono text-slate-400 uppercase mb-1.5 tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form ref={dlgRef} onSubmit={save} role="dialog" aria-modal="true" aria-label={isNew ? 'เพิ่ม Provider' : `แก้ไข ${provider?.name}`} className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-100">
            {isNew ? 'เพิ่ม Provider' : `แก้ไข ${provider?.name}`}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 cursor-pointer">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={L}>ชื่อ</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="my-provider" className={F} />
            </div>
            <div>
              <label className={L}>Base URL</label>
              <input required type="url" value={form.base_url} onChange={(e) => set('base_url', e.target.value)} placeholder="https://host/v1" className={F} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={L}>Default model</label>
              <input value={form.default_model} onChange={(e) => set('default_model', e.target.value)} placeholder="glm-5.3" className={F} />
            </div>
            <div>
              <label className={L}>Key header</label>
              <input value={form.key_header} onChange={(e) => set('key_header', e.target.value)} placeholder="ว่าง = Bearer (ปกติ) · x-bf-vk = Bifrost" className={F} />
            </div>
          </div>

          <div>
            <label className={L}>Key mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set('key_mode', 'env')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium cursor-pointer transition-smooth ${form.key_mode === 'env' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                <ShieldCheck className="h-4 w-4" /> env (.env) — แนะนำ
              </button>
              <button
                type="button"
                onClick={() => set('key_mode', 'inline')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium cursor-pointer transition-smooth ${form.key_mode === 'inline' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                <AlertTriangle className="h-4 w-4" /> inline (ฝังใน config)
              </button>
            </div>
          </div>

          {form.key_mode === 'env' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={L}>Env var</label>
                <input value={form.key_env} onChange={(e) => set('key_env', e.target.value)} placeholder="MY_PROVIDER_API_KEY" className={F} />
              </div>
              <div>
                <label className={L}>API key (ใหม่)</label>
                <input type="password" value={form.api_key} onChange={(e) => set('api_key', e.target.value)} placeholder={provider?.has_key ? 'ไม่แตะ = ใช้ key เดิม' : 'sk-... (เขียนลง .env)'} className={F} />
              </div>
            </div>
          ) : (
            <div>
              <label className={L}>API key</label>
              <input type="password" value={form.api_key} onChange={(e) => set('api_key', e.target.value)} placeholder={provider?.has_key ? 'ไม่แตะ = ใช้ key เดิม' : 'sk-...'} className={F} />
            </div>
          )}

          <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-4 py-3 text-[11px] text-slate-500 leading-relaxed">
            ห้ามตั้งชื่อซ้ำ · env var ต้องเป็น UPPERCASE_SNAKE · วาง URL ในช่อง key จะถูกปฏิเสธ ·
            key ใหม่จะเขียนลง .env / config ทันที (backup อัตโนมัติ) ·
            Key header ใช้เมื่อ gateway ต้องการ header เฉพาะ เช่น Bifrost ใช้ <span className="font-mono text-slate-400">x-bf-vk</span>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-800 px-6 py-4">
          <button type="button" onClick={onClose} className="border border-slate-700 hover:border-slate-500 text-slate-300 px-4 py-2 rounded-lg text-sm cursor-pointer transition-smooth">ยกเลิก</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-smooth">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            บันทึก
          </button>
        </div>
      </form>
    </div>
  );
}

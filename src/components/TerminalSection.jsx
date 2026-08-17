import React from 'react';
import { Terminal as TerminalIcon, HardDrive, Shield } from 'lucide-react';

export default function TerminalSection({ config, onChange }) {
  const terminal = config.terminal || {};

  const handleTerminalChange = (key, val) => {
    onChange(['terminal', key], val);
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <TerminalIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Terminal & Execution Shell Settings</h3>
            <p className="text-xs text-slate-400">Configure command execution backend, working directory, and daemon grace timeouts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Backend Execution Mode</label>
            <select
              value={terminal.backend || 'local'}
              onChange={(e) => handleTerminalChange('backend', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none cursor-pointer"
            >
              <option value="local font-mono">Local Sandbox</option>
              <option value="modal">Modal Cloud Sandbox</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Modal Mode</label>
            <select
              value={terminal.modal_mode || 'auto'}
              onChange={(e) => handleTerminalChange('modal_mode', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none cursor-pointer"
            >
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Home Mode</label>
            <select
              value={terminal.home_mode || 'auto'}
              onChange={(e) => handleTerminalChange('home_mode', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none cursor-pointer"
            >
              <option value="auto">Auto</option>
              <option value="isolated">Isolated Home</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Default Working Directory (CWD)</label>
            <input
              type="text"
              value={terminal.cwd || '.'}
              onChange={(e) => handleTerminalChange('cwd', e.target.value)}
              placeholder="."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Command Timeout (Seconds)</label>
            <input
              type="number"
              value={terminal.timeout || 180}
              onChange={(e) => handleTerminalChange('timeout', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Daemon Grace Period (Seconds)</label>
            <input
              type="number"
              value={terminal.daemon_term_grace_seconds || 2}
              onChange={(e) => handleTerminalChange('daemon_term_grace_seconds', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

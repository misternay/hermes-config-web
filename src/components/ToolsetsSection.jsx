import React, { useState } from 'react';
import { Wrench, ShieldAlert, Plus, Trash2, Key } from 'lucide-react';

export default function ToolsetsSection({ config, onChange }) {
  const toolsets = config.toolsets || [];
  const agent = config.agent || {};
  const disabledToolsets = agent.disabled_toolsets || [];
  const terminal = config.terminal || {};
  const envPassthrough = terminal.env_passthrough || [];

  const [newToolset, setNewToolset] = useState('');
  const [newDisabled, setNewDisabled] = useState('');
  const [newEnvVar, setNewEnvVar] = useState('');

  // Toolsets handlers
  const handleAddToolset = () => {
    if (!newToolset.trim()) return;
    const name = newToolset.trim();
    if (!toolsets.includes(name)) {
      onChange(['toolsets'], [...toolsets, name]);
    }
    setNewToolset('');
  };

  const handleDeleteToolset = (name) => {
    onChange(['toolsets'], toolsets.filter((t) => t !== name));
  };

  // Disabled Toolsets handlers
  const handleAddDisabled = () => {
    if (!newDisabled.trim()) return;
    const name = newDisabled.trim();
    if (!disabledToolsets.includes(name)) {
      onChange(['agent', 'disabled_toolsets'], [...disabledToolsets, name]);
    }
    setNewDisabled('');
  };

  const handleDeleteDisabled = (name) => {
    onChange(['agent', 'disabled_toolsets'], disabledToolsets.filter((t) => t !== name));
  };

  // Env Passthrough handlers
  const handleAddEnvVar = () => {
    if (!newEnvVar.trim()) return;
    const name = newEnvVar.trim().toUpperCase();
    if (!envPassthrough.includes(name)) {
      onChange(['terminal', 'env_passthrough'], [...envPassthrough, name]);
    }
    setNewEnvVar('');
  };

  const handleDeleteEnvVar = (name) => {
    onChange(['terminal', 'env_passthrough'], envPassthrough.filter((e) => e !== name));
  };

  return (
    <div className="space-y-8">
      {/* Active Toolsets */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Active Toolsets</h3>
              <p className="text-xs text-slate-400">Registered tool modules available for agent execution.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newToolset}
              onChange={(e) => setNewToolset(e.target.value)}
              placeholder="Toolset name (e.g. git, docker)"
              className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
            />
            <button
              onClick={handleAddToolset}
              className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-smooth shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Toolset
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {toolsets.map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300"
            >
              <span>{t}</span>
              <button
                onClick={() => handleDeleteToolset(t)}
                className="text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {toolsets.length === 0 && (
            <div className="text-xs text-slate-500 font-mono py-2">No active toolsets specified.</div>
          )}
        </div>
      </div>

      {/* Disabled Toolsets */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Disabled Toolsets</h3>
              <p className="text-xs text-slate-400">Blacklisted tools blocked from agent invocation.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newDisabled}
              onChange={(e) => setNewDisabled(e.target.value)}
              placeholder="Block toolset name..."
              className="bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
            />
            <button
              onClick={handleAddDisabled}
              className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-smooth shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Block Toolset
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {disabledToolsets.map((dt) => (
            <div
              key={dt}
              className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-lg border border-rose-500/30 font-mono text-xs text-rose-300"
            >
              <span>{dt}</span>
              <button
                onClick={() => handleDeleteDisabled(dt)}
                className="text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {disabledToolsets.length === 0 && (
            <div className="text-xs text-slate-500 font-mono py-2">No toolsets are currently blocked.</div>
          )}
        </div>
      </div>

      {/* Terminal Env Passthrough */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Environment Variable Passthrough</h3>
              <p className="text-xs text-slate-400">Allow specified system environment variables inside the agent execution sandbox.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newEnvVar}
              onChange={(e) => setNewEnvVar(e.target.value)}
              placeholder="ENV_VAR_NAME"
              className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
            />
            <button
              onClick={handleAddEnvVar}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-smooth shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Env Var
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {envPassthrough.map((env) => (
            <div
              key={env}
              className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-lg border border-amber-500/30 font-mono text-xs text-amber-300"
            >
              <span>{env}</span>
              <button
                onClick={() => handleDeleteEnvVar(env)}
                className="text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {envPassthrough.length === 0 && (
            <div className="text-xs text-slate-500 font-mono py-2">No passthrough environment variables defined.</div>
          )}
        </div>
      </div>
    </div>
  );
}

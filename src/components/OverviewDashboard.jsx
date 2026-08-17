import React from 'react';
import { Cpu, Server, Zap, Smile, Shield, Terminal, ArrowRight, ToggleLeft, ToggleRight, Check } from 'lucide-react';

export default function OverviewDashboard({ config, onChange, onSelectTab }) {
  const model = config.model || {};
  const agent = config.agent || {};
  const providers = config.providers || {};
  const personalities = agent.personalities || {};
  const toolsets = config.toolsets || [];
  const fallbacks = config.fallback_providers || [];

  const updateAgentFlag = (key, val) => {
    onChange(['agent', key], val);
  };

  const getReasoningColor = (effort) => {
    switch (effort) {
      case 'xhigh': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'high': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'medium': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 md:p-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
            Active Hermes Agent Architecture
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
            Hermes Agent System Configuration
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Configure default AI model providers, reasoning parameters, interactive agent personalities, terminal execution behavior, and toolsets in one place.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model Card */}
        <div 
          onClick={() => onSelectTab('models')} 
          className="group p-5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-blue-500/40 cursor-pointer transition-smooth"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Default Model</span>
            <Cpu className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-smooth" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 truncate">
            {model.default || 'Not set'}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Provider: {model.provider || 'default'}</span>
            <span className="font-mono text-blue-400/80">{(model.context_length / 1000).toFixed(0)}k ctx</span>
          </div>
        </div>

        {/* Reasoning Effort */}
        <div 
          onClick={() => onSelectTab('agent')}
          className="group p-5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-smooth"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Reasoning Effort</span>
            <Zap className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-smooth" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${getReasoningColor(agent.reasoning_effort)}`}>
              {agent.reasoning_effort || 'default'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-3 flex items-center justify-between">
            <span>Max turns: {agent.max_turns || 90}</span>
            <span>Timeout: {agent.gateway_timeout || 1800}s</span>
          </div>
        </div>

        {/* Personalities Card */}
        <div 
          onClick={() => onSelectTab('personalities')}
          className="group p-5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-smooth"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Personalities</span>
            <Smile className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-smooth" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {Object.keys(personalities).length}
          </div>
          <div className="text-xs text-slate-400 mt-1 truncate">
            {Object.keys(personalities).slice(0, 3).join(', ')}...
          </div>
        </div>

        {/* Providers & Toolsets */}
        <div 
          onClick={() => onSelectTab('toolsets')}
          className="group p-5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-smooth"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Providers & Toolsets</span>
            <Server className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-smooth" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xl font-bold font-mono text-slate-100">{Object.keys(providers).length}</div>
              <div className="text-[11px] text-slate-400">Providers</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-xl font-bold font-mono text-slate-100">{toolsets.length}</div>
              <div className="text-[11px] text-slate-400">Toolsets</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-xl font-bold font-mono text-slate-100">{fallbacks.length}</div>
              <div className="text-[11px] text-slate-400">Fallbacks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Agent Feature Toggles */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            Core Agent Guardrails & Feature Flags
          </h3>
          <button 
            onClick={() => onSelectTab('agent')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono cursor-pointer"
          >
            All Agent Settings <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div>
              <div className="text-sm font-medium text-slate-200">Task Completion Guidance</div>
              <div className="text-xs text-slate-400 mt-0.5">Appends guidance prompts for task completion verification.</div>
            </div>
            <button
              onClick={() => updateAgentFlag('task_completion_guidance', !agent.task_completion_guidance)}
              className="cursor-pointer text-slate-400 hover:text-slate-200 transition-smooth"
            >
              {agent.task_completion_guidance ? (
                <ToggleRight className="h-7 w-7 text-blue-500" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-slate-600" />
              )}
            </button>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div>
              <div className="text-sm font-medium text-slate-200">Environment Probe</div>
              <div className="text-xs text-slate-400 mt-0.5">Automatically inspects local environment capabilities.</div>
            </div>
            <button
              onClick={() => updateAgentFlag('environment_probe', !agent.environment_probe)}
              className="cursor-pointer text-slate-400 hover:text-slate-200 transition-smooth"
            >
              {agent.environment_probe ? (
                <ToggleRight className="h-7 w-7 text-blue-500" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-slate-600" />
              )}
            </button>
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div>
              <div className="text-sm font-medium text-slate-200">Parallel Tool Call Guidance</div>
              <div className="text-xs text-slate-400 mt-0.5">Encourages agent to execute independent tool calls concurrently.</div>
            </div>
            <button
              onClick={() => updateAgentFlag('parallel_tool_call_guidance', !agent.parallel_tool_call_guidance)}
              className="cursor-pointer text-slate-400 hover:text-slate-200 transition-smooth"
            >
              {agent.parallel_tool_call_guidance ? (
                <ToggleRight className="h-7 w-7 text-blue-500" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-slate-600" />
              )}
            </button>
          </div>

          {/* Toggle 4 */}
          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div>
              <div className="text-sm font-medium text-slate-200">Verify On Stop</div>
              <div className="text-xs text-slate-400 mt-0.5">Requires automated check execution before task completion.</div>
            </div>
            <button
              onClick={() => updateAgentFlag('verify_on_stop', !agent.verify_on_stop)}
              className="cursor-pointer text-slate-400 hover:text-slate-200 transition-smooth"
            >
              {agent.verify_on_stop ? (
                <ToggleRight className="h-7 w-7 text-blue-500" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

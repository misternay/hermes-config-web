import React from 'react';
import { Sliders, Clock, Zap, Eye, ToggleLeft, ToggleRight, CheckSquare, Square } from 'lucide-react';

export default function AgentSection({ config, onChange }) {
  const agent = config.agent || {};

  const handleAgentChange = (key, val) => {
    onChange(['agent', key], val);
  };

  return (
    <div className="space-y-8">
      {/* Reasoning & Core Mode */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Reasoning & Cognitive Effort</h3>
            <p className="text-xs text-slate-400">Configure thinking depth, image mode, and tool enforcement rules.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Reasoning Effort */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Reasoning Effort</label>
            <select
              value={agent.reasoning_effort || 'xhigh'}
              onChange={(e) => handleAgentChange('reasoning_effort', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none cursor-pointer"
            >
              <option value="low">Low (Fast output)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Deep thinking)</option>
              <option value="xhigh">X-High (Maximum thoroughness)</option>
            </select>
          </div>

          {/* Tool Use Enforcement */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Tool Enforcement</label>
            <select
              value={agent.tool_use_enforcement || 'auto'}
              onChange={(e) => handleAgentChange('tool_use_enforcement', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none cursor-pointer"
            >
              <option value="auto">Auto</option>
              <option value="required">Required</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Image Input Mode */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Image Input Mode</label>
            <select
              value={agent.image_input_mode || 'auto'}
              onChange={(e) => handleAgentChange('image_input_mode', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none cursor-pointer"
            >
              <option value="auto">Auto</option>
              <option value="low">Low Resolution</option>
              <option value="high">High Detail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Numerical Execution Parameters */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Turn Limits & Timeouts</h3>
            <p className="text-xs text-slate-400">Control agent execution longevity, network retries, and gateway keepalive intervals.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Max Turns</label>
            <input
              type="number"
              value={agent.max_turns || 90}
              onChange={(e) => handleAgentChange('max_turns', parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Gateway Timeout (s)</label>
            <input
              type="number"
              value={agent.gateway_timeout || 1800}
              onChange={(e) => handleAgentChange('gateway_timeout', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">API Max Retries</label>
            <input
              type="number"
              value={agent.api_max_retries || 3}
              onChange={(e) => handleAgentChange('api_max_retries', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Clarify Timeout (s)</label>
            <input
              type="number"
              value={agent.clarify_timeout || 600}
              onChange={(e) => handleAgentChange('clarify_timeout', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Restart Drain Timeout (s)</label>
            <input
              type="number"
              value={agent.restart_drain_timeout || 60}
              onChange={(e) => handleAgentChange('restart_drain_timeout', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Gateway Warning Timeout (s)</label>
            <input
              type="number"
              value={agent.gateway_timeout_warning || 900}
              onChange={(e) => handleAgentChange('gateway_timeout_warning', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Gateway Notify Interval (s)</label>
            <input
              type="number"
              value={agent.gateway_notify_interval || 180}
              onChange={(e) => handleAgentChange('gateway_notify_interval', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">Auto Continue Freshness (s)</label>
            <input
              type="number"
              value={agent.gateway_auto_continue_freshness || 3600}
              onChange={(e) => handleAgentChange('gateway_auto_continue_freshness', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Boolean Toggles Grid */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Behavioral Flags</h3>
            <p className="text-xs text-slate-400">Enable or disable guidance protocols and runtime verification.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'task_completion_guidance', label: 'Task Completion Guidance', desc: 'Inject verification prompts on turn finish' },
            { key: 'parallel_tool_call_guidance', label: 'Parallel Tool Call Guidance', desc: 'Instruct agent to parallelize lookups' },
            { key: 'environment_probe', label: 'Environment Probe', desc: 'Auto-detect local binaries and environment tools' },
            { key: 'verify_on_stop', label: 'Verify On Stop', desc: 'Run verification tests before finishing turn' },
            { key: 'verbose', label: 'Verbose Output', desc: 'Enable detailed debug logs in terminal' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <div className="text-sm font-medium text-slate-200">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              <button
                onClick={() => handleAgentChange(item.key, !agent[item.key])}
                className="cursor-pointer text-slate-400 hover:text-slate-200 transition-smooth"
              >
                {agent[item.key] ? (
                  <ToggleRight className="h-7 w-7 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-slate-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

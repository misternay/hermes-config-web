import React, { useState, useEffect } from 'react';
import { FileCode, CheckCircle2, AlertCircle, Sparkles, GitCompare, Eye } from 'lucide-react';
import * as yaml from 'js-yaml';

export default function RawYamlEditor({ rawYaml, originalYaml, onChange }) {
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'diff'
  const [validationResult, setValidationResult] = useState({ valid: true });

  // Validate YAML on change
  useEffect(() => {
    try {
      yaml.load(rawYaml);
      setValidationResult({ valid: true });
    } catch (err) {
      setValidationResult({
        valid: false,
        error: err.message,
        line: err.mark ? err.mark.line + 1 : null,
      });
    }
  }, [rawYaml]);

  // Prettify YAML
  const handlePrettify = () => {
    try {
      const parsed = yaml.load(rawYaml);
      const dumped = yaml.dump(parsed, { indent: 2, lineWidth: -1, noRefs: true });
      onChange(dumped);
    } catch (err) {
      alert(`Cannot format invalid YAML: ${err.message}`);
    }
  };

  // Simple diff generator
  const getDiffLines = () => {
    const origLines = (originalYaml || '').split('\n');
    const newLines = (rawYaml || '').split('\n');

    const diff = [];
    const maxLen = Math.max(origLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const orig = origLines[i];
      const next = newLines[i];

      if (orig === next) {
        diff.push({ type: 'same', lineNum: i + 1, content: next });
      } else {
        if (orig !== undefined && next !== undefined) {
          diff.push({ type: 'removed', lineNum: i + 1, content: orig });
          diff.push({ type: 'added', lineNum: i + 1, content: next });
        } else if (orig !== undefined) {
          diff.push({ type: 'removed', lineNum: i + 1, content: orig });
        } else if (next !== undefined) {
          diff.push({ type: 'added', lineNum: i + 1, content: next });
        }
      }
    }
    return diff;
  };

  const lines = rawYaml.split('\n');

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Raw YAML Editor</h3>
            <p className="text-xs text-slate-400">Direct code editor with live syntax validation and diff view.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Validation Badge */}
          {validationResult.valid ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="h-3.5 w-3.5" /> Valid YAML
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
              <AlertCircle className="h-3.5 w-3.5" /> Syntax Error {validationResult.line && `(Line ${validationResult.line})`}
            </span>
          )}

          <button
            onClick={handlePrettify}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 cursor-pointer transition-smooth"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Format YAML
          </button>

          {/* Toggle View Mode */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1 rounded-md transition-smooth cursor-pointer ${
                viewMode === 'editor' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1 rounded-md transition-smooth cursor-pointer flex items-center gap-1 ${
                viewMode === 'diff' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" /> Diff View
            </button>
          </div>
        </div>
      </div>

      {/* Syntax error details banner */}
      {!validationResult.valid && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs font-mono space-y-1">
          <div className="font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" /> YAML Parsing Exception:
          </div>
          <div className="pl-6 text-slate-300">{validationResult.error}</div>
        </div>
      )}

      {/* Main Code Editor View */}
      {viewMode === 'editor' ? (
        <div className="bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 flex overflow-auto relative">
            {/* Line numbers column */}
            <div className="select-none bg-slate-900/60 text-slate-600 px-3 py-4 text-right border-r border-slate-800/80 shrink-0 font-mono leading-6">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Textarea Code Input */}
            <textarea
              value={rawYaml}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              className="flex-1 bg-transparent p-4 text-slate-100 font-mono text-xs leading-6 resize-none focus:outline-none whitespace-pre overflow-x-auto"
              style={{ tabSize: 2 }}
            />
          </div>
        </div>
      ) : (
        /* Diff View */
        <div className="bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs p-4 space-y-1 overflow-x-auto min-h-[500px]">
          <div className="text-slate-400 text-xs mb-3 pb-2 border-b border-slate-800 font-mono flex items-center justify-between">
            <span>Left: Original Disk Version &nbsp;|&nbsp; Right: Working Draft</span>
          </div>

          {getDiffLines().map((item, idx) => {
            let bgClass = 'text-slate-300 hover:bg-slate-900/50';
            let prefix = ' ';
            if (item.type === 'added') {
              bgClass = 'bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500';
              prefix = '+';
            } else if (item.type === 'removed') {
              bgClass = 'bg-rose-500/10 text-rose-300 line-through border-l-2 border-rose-500';
              prefix = '-';
            }

            return (
              <div key={idx} className={`px-2 py-0.5 rounded flex items-center gap-3 font-mono leading-5 ${bgClass}`}>
                <span className="text-slate-600 w-8 text-right shrink-0 select-none">{item.lineNum}</span>
                <span className="w-4 select-none font-bold">{prefix}</span>
                <pre className="font-mono text-xs whitespace-pre">{item.content}</pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

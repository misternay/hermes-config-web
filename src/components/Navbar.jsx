import React from 'react';
import { Cpu, Save, History, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';

export default function Navbar({
  filePath,
  stats,
  isSaving,
  hasUnsavedChanges,
  onSave,
  onOpenBackups,
  onRefresh,
  saveMessage,
  saveError,
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-smooth">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-100 text-lg tracking-tight">Hermes Config Studio</h1>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate max-w-xs md:max-w-md flex items-center gap-1">
              <FileText className="h-3 w-3 text-slate-500 shrink-0" />
              <span className="truncate">{filePath || '~/.hermes/config.yaml'}</span>
            </p>
          </div>
        </div>

        {/* Center status message */}
        {saveMessage && (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}
        {saveError && (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg animate-fade-in">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {hasUnsavedChanges && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              Unsaved changes
            </span>
          )}

          <button
            onClick={onRefresh}
            title="Reload from disk"
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 cursor-pointer transition-smooth"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenBackups}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700/80 cursor-pointer transition-smooth"
          >
            <History className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Backups & History</span>
          </button>

          <button
            onClick={onSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium text-white rounded-lg shadow-lg cursor-pointer transition-smooth ${
              hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25 ring-2 ring-blue-400/40'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save Config'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { History, X, RotateCcw, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function BackupModal({ isOpen, onClose, backups, onRestore, isRestoring }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up space-y-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Backup & Snapshot History</h3>
              <p className="text-xs text-slate-400">Restore previous versions of ~/.hermes/config.yaml</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Backups List */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {backups.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-mono">No backup snapshots found in ~/.hermes/</div>
          ) : (
            backups.map((item) => (
              <div
                key={item.filename}
                className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-smooth"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-slate-200">{item.filename}</span>
                    {item.isLatest && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Latest Backup
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                    <span>Modified: {new Date(item.mtime).toLocaleString()}</span>
                    <span>{(item.sizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                <button
                  disabled={isRestoring}
                  onClick={() => onRestore(item.filename)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/90 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium cursor-pointer transition-smooth disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 font-mono flex justify-between items-center">
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Restoring will snapshot your current config first.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

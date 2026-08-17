import React, { useState } from 'react';
import { Smile, Plus, Trash2, Edit3, Check, X, Sparkles, MessageSquare } from 'lucide-react';

const PRESET_PERSONALITIES = [
  { key: 'kawaii', prompt: 'You are a kawaii assistant! Use cute expressions like (◕‿◕), ★, ♪, and ~! Add sparkles and be super enthusiastic! ヽ(>∀<☆)ノ' },
  { key: 'catgirl', prompt: "You are Neko-chan, an anime catgirl AI assistant, nya~! Add 'nya' and cat-like expressions to your speech (=^･ω･^=)!" },
  { key: 'pirate', prompt: "Arrr! Ye be talkin' to Captain Hermes! Speak like a proper buccaneer and use nautical terms!" },
  { key: 'shakespeare', prompt: 'Hark! Thou speakest with an assistant most versed in the bardic arts. I shall respond in Shakespearean prose.' },
  { key: 'hype', prompt: "YOOO LET'S GOOOO!!! 🔥🔥🔥 I am SO PUMPED to help you today! We're gonna CRUSH IT together! 💪😤🚀" },
];

export default function PersonalitiesSection({ config, onChange }) {
  const agent = config.agent || {};
  const personalities = agent.personalities || {};

  const [editingKey, setEditingKey] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit personality prompt
  const handleStartEdit = (key, currentPrompt) => {
    setEditingKey(key);
    setEditPrompt(currentPrompt);
  };

  const handleSaveEdit = (key) => {
    onChange(['agent', 'personalities', key], editPrompt);
    setEditingKey(null);
  };

  // Add new personality
  const handleAddPersonality = () => {
    if (!newKey.trim() || !newPrompt.trim()) return;
    const cleanKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    onChange(['agent', 'personalities', cleanKey], newPrompt.trim());
    setNewKey('');
    setNewPrompt('');
    setShowAddForm(false);
  };

  // Delete personality
  const handleDeletePersonality = (key) => {
    const next = { ...personalities };
    delete next[key];
    onChange(['agent', 'personalities'], next);
  };

  // Quick add preset
  const handleAddPreset = (preset) => {
    onChange(['agent', 'personalities', preset.key], preset.prompt);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Smile className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Agent Persona Registry</h3>
              <p className="text-xs text-slate-400">Configure conversational personalities and behavior directives for Hermes.</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-smooth shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Custom Personality
          </button>
        </div>

        {/* Quick Add Presets Bar */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Quick Add Presets:
          </span>
          {PRESET_PERSONALITIES.map((preset) => {
            const exists = Boolean(personalities[preset.key]);
            return (
              <button
                key={preset.key}
                disabled={exists}
                onClick={() => handleAddPreset(preset)}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border shrink-0 transition-smooth ${
                  exists
                    ? 'bg-slate-950/40 text-slate-600 border-slate-800 opacity-60 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 cursor-pointer'
                }`}
              >
                {preset.key} {exists && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Form Drawer */}
      {showAddForm && (
        <div className="bg-slate-900/90 rounded-xl border border-emerald-500/30 p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-emerald-400 font-mono">Add New Agent Personality</h4>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Personality Key Name</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. sarcastic_coder, mentor"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">Prompt / Instructions</label>
              <textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                rows={3}
                placeholder="You are a sarcastic senior developer..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPersonality}
                className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
              >
                Save Personality
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personality Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Object.entries(personalities).map(([key, prompt]) => {
          const isEditing = editingKey === key;
          return (
            <div
              key={key}
              className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-smooth group"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-400" />
                    <span className="font-mono font-bold text-sm text-emerald-300 uppercase tracking-wide">
                      {key}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => handleStartEdit(key, prompt)}
                          className="text-slate-500 hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-800 cursor-pointer transition-smooth"
                          title="Edit prompt"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePersonality(key)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10 cursor-pointer transition-smooth"
                          title="Delete personality"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSaveEdit(key)}
                          className="text-emerald-400 p-1.5 rounded-md hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="text-slate-400 p-1.5 rounded-md hover:bg-slate-800 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg p-3 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-mono text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap">
                    {prompt}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

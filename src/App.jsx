import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverviewDashboard from './components/OverviewDashboard';
import ModelProviderSection from './components/ModelProviderSection';
import AgentSection from './components/AgentSection';
import PersonalitiesSection from './components/PersonalitiesSection';
import ToolsetsSection from './components/ToolsetsSection';
import TerminalSection from './components/TerminalSection';
import RawYamlEditor from './components/RawYamlEditor';
import BackupModal from './components/BackupModal';

import {
  LayoutDashboard,
  Cpu,
  Zap,
  Smile,
  Wrench,
  Terminal as TerminalIcon,
  FileCode,
  AlertTriangle,
} from 'lucide-react';

import * as yaml from 'js-yaml';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [filePath, setFilePath] = useState('');
  const [stats, setStats] = useState({});
  const [rawYaml, setRawYaml] = useState('');
  const [originalYaml, setOriginalYaml] = useState('');
  const [parsedConfig, setParsedConfig] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const [isBackupsOpen, setIsBackupsOpen] = useState(false);
  const [backups, setBackups] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch initial config
  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to fetch configuration');
      const data = await res.json();

      setFilePath(data.filePath);
      setStats(data.stats);
      setRawYaml(data.rawYaml);
      setOriginalYaml(data.rawYaml);
      setParsedConfig(data.parsedConfig || {});
      setSaveError(null);
    } catch (err) {
      setSaveError(`Error loading config: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Sync state when GUI form changes nested paths
  const handleConfigChange = (pathArray, newValue) => {
    const updated = JSON.parse(JSON.stringify(parsedConfig));
    let curr = updated;

    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (!curr[key] || typeof curr[key] !== 'object') {
        curr[key] = {};
      }
      curr = curr[key];
    }
    curr[pathArray[pathArray.length - 1]] = newValue;

    setParsedConfig(updated);
    try {
      const dumped = yaml.dump(updated, { indent: 2, lineWidth: -1, noRefs: true });
      setRawYaml(dumped);
    } catch (e) {
      // fallback
    }
  };

  // Sync state when raw YAML text changes
  const handleRawYamlChange = (newYamlText) => {
    setRawYaml(newYamlText);
    try {
      const parsed = yaml.load(newYamlText);
      if (parsed && typeof parsed === 'object') {
        setParsedConfig(parsed);
      }
    } catch (err) {
      // YAML syntax invalid, keep parsedConfig as is until valid
    }
  };

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawYaml, parsedConfig }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Save failed');
      }

      setStats(data.stats);
      setRawYaml(data.rawYaml);
      setOriginalYaml(data.rawYaml);
      setParsedConfig(data.parsedConfig);

      setSaveMessage('Configuration saved & backed up successfully!');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch backups modal list
  const handleOpenBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      setBackups(data.backups || []);
      setIsBackupsOpen(true);
    } catch (err) {
      alert(`Failed to load backups: ${err.message}`);
    }
  };

  // Restore backup
  const handleRestoreBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to restore ${filename}?`)) return;

    setIsRestoring(true);
    try {
      const res = await fetch('/api/config/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      setStats(data.stats);
      setRawYaml(data.rawYaml);
      setOriginalYaml(data.rawYaml);
      setParsedConfig(data.parsedConfig);

      setIsBackupsOpen(false);
      setSaveMessage(`Restored from ${filename}`);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const hasUnsavedChanges = rawYaml !== originalYaml;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'models', label: 'Models & Providers', icon: Cpu },
    { id: 'agent', label: 'Agent Tuning', icon: Zap },
    { id: 'personalities', label: 'Personalities', icon: Smile },
    { id: 'toolsets', label: 'Toolsets & Security', icon: Wrench },
    { id: 'terminal', label: 'Terminal & System', icon: TerminalIcon },
    { id: 'raw_yaml', label: 'Raw YAML Editor', icon: FileCode },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        filePath={filePath}
        stats={stats}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onOpenBackups={handleOpenBackups}
        onRefresh={fetchConfig}
        saveMessage={saveMessage}
        saveError={saveError}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition-smooth whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 font-mono text-sm">
            Loading configuration from ~/.hermes/config.yaml...
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <OverviewDashboard
                config={parsedConfig}
                onChange={handleConfigChange}
                onSelectTab={setActiveTab}
              />
            )}
            {activeTab === 'models' && <ModelProviderSection />}
            {activeTab === 'agent' && (
              <AgentSection
                config={parsedConfig}
                onChange={handleConfigChange}
              />
            )}
            {activeTab === 'personalities' && (
              <PersonalitiesSection
                config={parsedConfig}
                onChange={handleConfigChange}
              />
            )}
            {activeTab === 'toolsets' && (
              <ToolsetsSection
                config={parsedConfig}
                onChange={handleConfigChange}
              />
            )}
            {activeTab === 'terminal' && (
              <TerminalSection
                config={parsedConfig}
                onChange={handleConfigChange}
              />
            )}
            {activeTab === 'raw_yaml' && (
              <RawYamlEditor
                rawYaml={rawYaml}
                originalYaml={originalYaml}
                onChange={handleRawYamlChange}
              />
            )}
          </div>
        )}
      </main>

      {/* Backup Modal */}
      <BackupModal
        isOpen={isBackupsOpen}
        onClose={() => setIsBackupsOpen(false)}
        backups={backups}
        onRestore={handleRestoreBackup}
        isRestoring={isRestoring}
      />
    </div>
  );
}

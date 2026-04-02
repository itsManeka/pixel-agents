import { useEffect, useRef, useState } from 'react';

import type { WorkspaceFolder } from '../hooks/useExtensionMessages.js';
import { vscode } from '../vscodeApi.js';
import { SettingsModal } from './SettingsModal.js';

interface BottomToolbarProps {
  isEditMode: boolean;
  onOpenClaude: () => void;
  onToggleEditMode: () => void;
  isDebugMode: boolean;
  onToggleDebugMode: () => void;
  alwaysShowOverlay: boolean;
  onToggleAlwaysShowOverlay: () => void;
  workspaceFolders: WorkspaceFolder[];
  externalAssetDirectories: string[];
  watchAllSessions: boolean;
  onToggleWatchAllSessions: () => void;
}

export function BottomToolbar({
  isEditMode,
  onOpenClaude,
  onToggleEditMode,
  isDebugMode,
  onToggleDebugMode,
  alwaysShowOverlay,
  onToggleAlwaysShowOverlay,
  workspaceFolders,
  externalAssetDirectories,
  watchAllSessions,
  onToggleWatchAllSessions,
}: BottomToolbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [isBypassMenuOpen, setIsBypassMenuOpen] = useState(false);
  const [hoveredFolder, setHoveredFolder] = useState<number | null>(null);
  const [hoveredBypass, setHoveredBypass] = useState<number | null>(null);
  const folderPickerRef = useRef<HTMLDivElement>(null);
  const pendingBypassRef = useRef(false);

  // Close folder picker / bypass menu on outside click
  useEffect(() => {
    if (!isFolderPickerOpen && !isBypassMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setIsFolderPickerOpen(false);
        setIsBypassMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isFolderPickerOpen, isBypassMenuOpen]);

  const hasMultipleFolders = workspaceFolders.length > 1;

  const handleAgentClick = () => {
    setIsBypassMenuOpen(false);
    pendingBypassRef.current = false;
    if (hasMultipleFolders) {
      setIsFolderPickerOpen((v) => !v);
    } else {
      onOpenClaude();
    }
  };

  const handleAgentRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFolderPickerOpen(false);
    setIsBypassMenuOpen((v) => !v);
  };

  const handleFolderSelect = (folder: WorkspaceFolder) => {
    setIsFolderPickerOpen(false);
    const bypassPermissions = pendingBypassRef.current;
    pendingBypassRef.current = false;
    vscode.postMessage({ type: 'openClaude', folderPath: folder.path, bypassPermissions });
  };

  const handleBypassSelect = (bypassPermissions: boolean) => {
    setIsBypassMenuOpen(false);
    if (hasMultipleFolders) {
      pendingBypassRef.current = bypassPermissions;
      setIsFolderPickerOpen(true);
    } else {
      vscode.postMessage({ type: 'openClaude', bypassPermissions });
    }
  };

  return (
    <div className="absolute bottom-10 left-10 z-50 flex items-center gap-4 pixel-panel py-4 px-6">
      <div ref={folderPickerRef} className="relative">
        <button
          onClick={handleAgentClick}
          onContextMenu={handleAgentRightClick}
          className={`pixel-btn py-[5px] px-12 border-2 border-pixel-agent-border text-pixel-agent-text ${
            isFolderPickerOpen || isBypassMenuOpen
              ? 'bg-pixel-agent-hover'
              : 'bg-pixel-agent-bg hover:bg-pixel-agent-hover'
          }`}
        >
          + Agent
        </button>
        {isBypassMenuOpen && (
          <div className="pixel-dropdown min-w-[180px]">
            <button
              onClick={() => handleBypassSelect(false)}
              onMouseEnter={() => setHoveredBypass(0)}
              onMouseLeave={() => setHoveredBypass(null)}
              className="pixel-dropdown-item"
              style={{
                background: hoveredBypass === 0 ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              }}
            >
              Normal
            </button>
            <div className="h-[1px] my-4 bg-pixel-border" />
            <button
              onClick={() => handleBypassSelect(true)}
              onMouseEnter={() => setHoveredBypass(1)}
              onMouseLeave={() => setHoveredBypass(null)}
              className="pixel-dropdown-item text-pixel-warning"
              style={{
                background: hoveredBypass === 1 ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              }}
            >
              <span className="text-[16px]">⚡</span> Bypass Permissions
            </button>
          </div>
        )}
        {isFolderPickerOpen && (
          <div className="pixel-dropdown min-w-[160px]">
            {workspaceFolders.map((folder, i) => (
              <button
                key={folder.path}
                onClick={() => handleFolderSelect(folder)}
                onMouseEnter={() => setHoveredFolder(i)}
                onMouseLeave={() => setHoveredFolder(null)}
                className="pixel-dropdown-item text-[22px]"
                style={{
                  background: hoveredFolder === i ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                }}
              >
                {folder.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onToggleEditMode}
        className={isEditMode ? 'pixel-btn-active' : 'pixel-btn'}
        title="Edit office layout"
      >
        Layout
      </button>
      <div className="relative">
        <button
          onClick={() => setIsSettingsOpen((v) => !v)}
          className={isSettingsOpen ? 'pixel-btn-active' : 'pixel-btn'}
          title="Settings"
        >
          Settings
        </button>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDebugMode={isDebugMode}
          onToggleDebugMode={onToggleDebugMode}
          alwaysShowOverlay={alwaysShowOverlay}
          onToggleAlwaysShowOverlay={onToggleAlwaysShowOverlay}
          externalAssetDirectories={externalAssetDirectories}
          watchAllSessions={watchAllSessions}
          onToggleWatchAllSessions={onToggleWatchAllSessions}
        />
      </div>
    </div>
  );
}

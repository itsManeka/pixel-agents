import { useState } from 'react';

import { isSoundEnabled, setSoundEnabled } from '../notificationSound.js';
import { vscode } from '../vscodeApi.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDebugMode: boolean;
  onToggleDebugMode: () => void;
  alwaysShowOverlay: boolean;
  onToggleAlwaysShowOverlay: () => void;
  externalAssetDirectories: string[];
  watchAllSessions: boolean;
  onToggleWatchAllSessions: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDebugMode,
  onToggleDebugMode,
  alwaysShowOverlay,
  onToggleAlwaysShowOverlay,
  externalAssetDirectories,
  watchAllSessions,
  onToggleWatchAllSessions,
}: SettingsModalProps) {
  const [soundLocal, setSoundLocal] = useState(isSoundEnabled);

  if (!isOpen) return null;

  return (
    <>
      {/* Dark backdrop — click to close */}
      <div onClick={onClose} className="pixel-backdrop z-[49]" />
      {/* Centered modal */}
      <div className="pixel-modal z-50 min-w-[200px]">
        {/* Header with title and X button */}
        <div className="pixel-modal-header">
          <span className="text-[24px] text-pixel-text-bright">Settings</span>
          <button onClick={onClose} className="pixel-close-btn">
            X
          </button>
        </div>
        {/* Menu items */}
        <button
          onClick={() => {
            vscode.postMessage({ type: 'openSessionsFolder' });
            onClose();
          }}
          className="pixel-menu-item"
        >
          Open Sessions Folder
        </button>
        <button
          onClick={() => {
            vscode.postMessage({ type: 'exportLayout' });
            onClose();
          }}
          className="pixel-menu-item"
        >
          Export Layout
        </button>
        <button
          onClick={() => {
            vscode.postMessage({ type: 'importLayout' });
            onClose();
          }}
          className="pixel-menu-item"
        >
          Import Layout
        </button>
        <button
          onClick={() => {
            vscode.postMessage({ type: 'addExternalAssetDirectory' });
            onClose();
          }}
          className="pixel-menu-item"
        >
          Add Asset Directory
        </button>
        {externalAssetDirectories.map((dir) => (
          <div key={dir} className="flex items-center justify-between py-4 px-10 gap-8">
            <span
              className="text-[18px] text-pixel-text-muted overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]"
              title={dir}
            >
              {dir.split(/[/\\]/).pop() ?? dir}
            </span>
            <button
              onClick={() =>
                vscode.postMessage({ type: 'removeExternalAssetDirectory', path: dir })
              }
              className="bg-transparent border border-white/20 rounded-none text-pixel-text-muted text-[18px] cursor-pointer py-[1px] px-6 shrink-0 hover:bg-red-500/20"
            >
              X
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newVal = !isSoundEnabled();
            setSoundEnabled(newVal);
            setSoundLocal(newVal);
            vscode.postMessage({ type: 'setSoundEnabled', enabled: newVal });
          }}
          className="pixel-menu-item"
        >
          <span>Sound Notifications</span>
          <span
            className="pixel-checkbox"
            style={{ background: soundLocal ? 'rgba(90, 140, 255, 0.8)' : 'transparent' }}
          >
            {soundLocal ? 'X' : ''}
          </span>
        </button>
        <button onClick={onToggleWatchAllSessions} className="pixel-menu-item">
          <span>Watch All Sessions</span>
          <span
            className="pixel-checkbox"
            style={{ background: watchAllSessions ? 'rgba(90, 140, 255, 0.8)' : 'transparent' }}
          >
            {watchAllSessions ? 'X' : ''}
          </span>
        </button>
        <button onClick={onToggleAlwaysShowOverlay} className="pixel-menu-item">
          <span>Always Show Labels</span>
          <span
            className="pixel-checkbox"
            style={{ background: alwaysShowOverlay ? 'rgba(90, 140, 255, 0.8)' : 'transparent' }}
          >
            {alwaysShowOverlay ? 'X' : ''}
          </span>
        </button>
        <button onClick={onToggleDebugMode} className="pixel-menu-item">
          <span>Debug View</span>
          {isDebugMode && <span className="w-6 h-6 rounded-full bg-pixel-accent-80 shrink-0" />}
        </button>
      </div>
    </>
  );
}

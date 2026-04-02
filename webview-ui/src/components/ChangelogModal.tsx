import { useState } from 'react';

import { CHANGELOG_REPO_URL, changelogEntries, toMajorMinor } from '../changelogData.ts';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
}

export function ChangelogModal({ isOpen, onClose, currentVersion }: ChangelogModalProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!isOpen) return null;

  const majorMinor = toMajorMinor(currentVersion);
  const entry = changelogEntries.find((e) => e.version === majorMinor) ?? changelogEntries[0];

  if (!entry) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="pixel-backdrop z-[51]" />
      {/* Modal */}
      <div className="pixel-modal z-[52] min-w-[280px] max-w-[500px]">
        {/* Header */}
        <div className="pixel-modal-header">
          <span className="text-[32px] text-pixel-text-bright">What's New in v{entry.version}</span>
          <button
            onClick={onClose}
            onMouseEnter={() => setHovered('close')}
            onMouseLeave={() => setHovered(null)}
            className="pixel-close-btn pb-[5px] leading-[0.5]"
            style={{
              background: hovered === 'close' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            }}
          >
            x
          </button>
        </div>

        {/* Body */}
        <div className="py-4 px-10 max-h-[60vh] overflow-y-auto">
          {entry.sections.map((section) => (
            <div key={section.title} className="mb-12">
              <div className="text-[24px] text-pixel-accent mb-4">{section.title}</div>
              <ul className="m-0 pl-18 list-disc">
                {section.items.map((item, i) => (
                  <li key={i} className="text-[20px] text-pixel-text mb-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contributors */}
          {entry.contributors.length > 0 && (
            <div className="mb-8">
              <div className="text-[22px] text-pixel-accent mb-4">Contributors</div>
              <ul className="m-0 pl-18 list-disc">
                {entry.contributors.map((c) => (
                  <li key={c.name} className="text-[20px] text-pixel-text mb-2">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pixel-accent no-underline"
                    >
                      {c.name}
                    </a>
                    {' — '}
                    {c.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-6 px-10 border-t border-pixel-border mt-4 flex justify-center">
          <a
            href={`${CHANGELOG_REPO_URL}/blob/main/CHANGELOG.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[24px] text-pixel-text-dim no-underline cursor-pointer transition-colors duration-200 hover:text-pixel-accent"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </>
  );
}

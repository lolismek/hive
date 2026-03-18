"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/modal";

interface FileViewerProps {
  path: string;
  content: string;
  onClose: () => void;
}

function fileExtension(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? path.slice(dot + 1) : "";
}

function langLabel(path: string): string {
  const ext = fileExtension(path);
  const map: Record<string, string> = {
    py: "Python", sh: "Shell", md: "Markdown", txt: "Text",
    js: "JavaScript", ts: "TypeScript", json: "JSON", yaml: "YAML",
    yml: "YAML", toml: "TOML", cfg: "Config", ini: "Config",
  };
  return map[ext] ?? ext.toUpperCase();
}

export function FileViewer({ path, content, onClose }: FileViewerProps) {
  const lines = content.split("\n");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lang = langLabel(path);
  const gutterWidth = String(lines.length).length;

  return (
    <Modal onClose={onClose} maxWidth="max-w-4xl" className="rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between shrink-0 bg-[var(--color-layer-2)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-layer-3)] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--color-text-secondary)]">
              <path fillRule="evenodd" d="M3.75 1.5a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V4.664a.25.25 0 00-.073-.177l-2.914-2.914a.25.25 0 00-.177-.073H3.75zM2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0112.25 16h-8.5A1.75 1.75 0 012 14.25V1.75z" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold font-[family-name:var(--font-ibm-plex-mono)] text-[var(--color-text)] truncate block">{path}</span>
            <div className="flex items-center gap-2 mt-0.5">
              {lang && <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">{lang}</span>}
              <span className="text-[10px] text-[var(--color-text-tertiary)]">{lines.length} lines</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium bg-[var(--color-layer-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-layer-3)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>
          </button>
        </div>
      </div>

      {/* File content */}
      <div className="flex-1 min-h-0 overflow-auto bg-[var(--color-bg)] py-1">
        <table className="w-full border-collapse text-[12px] font-[family-name:var(--font-ibm-plex-mono)] leading-[20px]">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="group hover:bg-[var(--color-layer-1)]">
                <td
                  className="sticky left-0 whitespace-nowrap py-0 text-right select-none text-[var(--color-text-tertiary)] border-r border-[var(--color-border)] bg-[var(--color-surface)] group-hover:bg-[var(--color-layer-1)] transition-colors"
                  style={{ width: `${gutterWidth + 2}ch`, paddingLeft: "1ch", paddingRight: "1ch" }}
                >
                  {i + 1}
                </td>
                <td className="px-4 py-0 whitespace-pre select-all text-[var(--color-text-secondary)]">
                  {line || "\u00A0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

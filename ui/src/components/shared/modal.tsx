"use client";

import { useEffect, ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** Max width class, e.g. "max-w-5xl", "max-w-3xl" */
  maxWidth?: string;
  className?: string;
}

export function Modal({ onClose, children, maxWidth = "max-w-5xl", className = "" }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl ${maxWidth} w-full mx-4 my-8 animate-fade-in max-h-[calc(100vh-4rem)] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-layer-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors shrink-0"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l8 8M11 3l-8 8" />
      </svg>
    </button>
  );
}

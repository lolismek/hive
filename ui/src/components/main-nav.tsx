"use client";

import { useState } from "react";
import Link from "next/link";
import { CreateTaskModal } from "@/components/create-task-modal";

interface MainNavProps {
  activePage: "tasks" | "feed";
  onTaskCreated?: () => void;
}

export function MainNav({ activePage, onTaskCreated }: MainNavProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <nav className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activePage === "tasks"
                ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            Tasks
          </Link>
          <Link
            href="/feed"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activePage === "feed"
                ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            Feed
          </Link>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-lg transition-colors"
        >
          + Create Task
        </button>
      </nav>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            onTaskCreated?.();
          }}
        />
      )}
    </>
  );
}

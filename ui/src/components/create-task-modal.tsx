"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { apiPost, apiFetch } from "@/lib/api";

/* ── types ─────────────────────────────────────────────────────── */

interface CreateTaskModalProps {
  onClose: () => void;
  onCreated: () => void;
}

type Step = "repo" | "configure" | "review";
const STEPS: Step[] = ["repo", "configure", "review"];
const STEP_LABELS: Record<Step, string> = { repo: "Repo", configure: "Configure", review: "Review" };

const GITHUB_RE = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/;

/* ── helpers ───────────────────────────────────────────────────── */

function slugFromUrl(url: string): string {
  const parts = url.replace(/\/+$/, "").split("/");
  return (parts.pop() ?? "").toLowerCase();
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

/* ── component ─────────────────────────────────────────────────── */

export function CreateTaskModal({ onClose, onCreated }: CreateTaskModalProps) {
  /* state */
  const [step, setStep] = useState<Step>("repo");
  const [repoUrl, setRepoUrl] = useState("");
  const [taskId, setTaskId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  /* field-level errors */
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const setFieldError = (field: string, msg: string | null) =>
    setErrors((prev) => ({ ...prev, [field]: msg }));

  /* auto-generated flags — only auto-fill once per URL change */
  const [autoTaskId, setAutoTaskId] = useState(true);
  const [autoName, setAutoName] = useState(true);

  const overlayRef = useRef<HTMLDivElement>(null);

  /* dirty tracking */
  const isDirty = useMemo(
    () => !!(repoUrl || taskId || name || description || config),
    [repoUrl, taskId, name, description, config],
  );

  /* safe close — confirm if dirty */
  const safeClose = useCallback(() => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  /* ESC handler */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDiscard) {
          setShowDiscard(false);
        } else {
          safeClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [safeClose, showDiscard]);

  /* ── validation helpers ──────────────────────────────────────── */

  const validateRepoUrl = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed) return "GitHub repo URL is required.";
    if (!GITHUB_RE.test(trimmed)) return "Must be a valid URL (https://github.com/owner/repo).";
    return null;
  };

  const TASK_ID_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  const validateTaskId = (id: string): string | null => {
    if (!id.trim()) return "Task ID is required.";
    if (!TASK_ID_RE.test(id.trim())) return "Lowercase letters, digits, and hyphens only. Must start/end with a letter or digit.";
    if (id.includes("--")) return "Consecutive hyphens are not allowed.";
    return null;
  };

  const validateJson = (json: string): string | null => {
    if (!json.trim()) return null;
    try {
      JSON.parse(json);
      return null;
    } catch (e) {
      return `Invalid JSON: ${(e as Error).message}`;
    }
  };

  /* async uniqueness check */
  const checkUniqueness = async (id: string) => {
    try {
      await apiFetch(`/tasks/${id}`);
      setFieldError("taskId", `Task ID "${id}" already exists. Try "${id}-2".`);
    } catch {
      /* 404 = available, clear error if it was the uniqueness error */
      setErrors((prev) =>
        prev.taskId?.includes("already exists") ? { ...prev, taskId: null } : prev,
      );
    }
  };

  /* ── auto-generate from repo URL ─────────────────────────────── */

  const handleRepoUrlChange = (url: string) => {
    setRepoUrl(url);
    setFieldError("repoUrl", null);

    const trimmed = url.trim().replace(/\/+$/, "");
    if (GITHUB_RE.test(trimmed)) {
      const slug = slugFromUrl(trimmed);
      if (autoTaskId && slug) {
        setTaskId(slug);
        setFieldError("taskId", null);
      }
      if (autoName && slug) {
        setName(titleFromSlug(slug));
        setFieldError("name", null);
      }
    }
  };

  /* ── step navigation ─────────────────────────────────────────── */

  const goNext = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };
  const goBack = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  };

  const canAdvanceFromRepo = (): boolean => {
    const err = validateRepoUrl(repoUrl);
    setFieldError("repoUrl", err);
    return !err;
  };

  const canAdvanceFromConfigure = (): boolean => {
    const idErr = validateTaskId(taskId);
    const nameErr = !name.trim() ? "Name is required." : null;
    const descErr = !description.trim() ? "Description is required." : null;
    const cfgErr = validateJson(config);
    setFieldError("taskId", idErr);
    setFieldError("name", nameErr);
    setFieldError("description", descErr);
    setFieldError("config", cfgErr);
    return !idErr && !nameErr && !descErr && !cfgErr;
  };

  /* ── submit ──────────────────────────────────────────────────── */

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("id", taskId.trim());
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      if (config.trim()) formData.append("config", config.trim());
      formData.append("repo_url", repoUrl.trim().replace(/\/+$/, ""));
      await apiPost("/tasks", formData);
      onCreated();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── shared field classes ────────────────────────────────────── */
  const inputCls = "w-full px-3 py-2 text-sm border rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent";
  const inputBorder = (field: string) =>
    errors[field] ? "border-red-400" : "border-[var(--color-border)]";
  const labelCls = "block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5";

  /* ── render ──────────────────────────────────────────────────── */

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) safeClose(); }}
    >
      <div className="bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-[var(--shadow-elevated)] w-full max-w-[540px] h-full flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Create Task</h2>
          <button
            onClick={safeClose}
            className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-layer-2)] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-[var(--color-border)] shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && (
                <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--color-text-tertiary)] mx-1">
                  <path d="M4.5 2.5l3 3.5-3 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                  s === step
                    ? "bg-[var(--color-accent)] text-white"
                    : STEPS.indexOf(s) < STEPS.indexOf(step)
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-tertiary)]"
                }`}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ─── Step 1: Repo ─── */}
          {step === "repo" && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Paste the GitHub repository URL for your task.
              </p>
              <div>
                <label className={labelCls}>GitHub Repo URL</label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => handleRepoUrlChange(e.target.value)}
                  onBlur={() => setFieldError("repoUrl", validateRepoUrl(repoUrl))}
                  placeholder="https://github.com/owner/repo"
                  autoFocus
                  className={`${inputCls} ${inputBorder("repoUrl")} font-[family-name:var(--font-ibm-plex-mono)]`}
                />
                <FieldError msg={errors.repoUrl ?? null} />
              </div>
            </div>
          )}

          {/* ─── Step 2: Configure ─── */}
          {step === "configure" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className={labelCls}>Task ID</label>
                <input
                  type="text"
                  value={taskId}
                  onChange={(e) => { setTaskId(e.target.value); setAutoTaskId(false); setFieldError("taskId", null); }}
                  onBlur={() => {
                    const err = validateTaskId(taskId);
                    setFieldError("taskId", err);
                    if (!err) checkUniqueness(taskId.trim());
                  }}
                  placeholder="e.g. my-benchmark"
                  autoFocus
                  className={`${inputCls} ${inputBorder("taskId")} font-[family-name:var(--font-ibm-plex-mono)]`}
                />
                <FieldError msg={errors.taskId ?? null} />
              </div>

              <div>
                <label className={labelCls}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setAutoName(false); setFieldError("name", null); }}
                  onBlur={() => setFieldError("name", !name.trim() ? "Name is required." : null)}
                  placeholder="e.g. My Benchmark"
                  className={`${inputCls} ${inputBorder("name")}`}
                />
                <FieldError msg={errors.name ?? null} />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setFieldError("description", null); }}
                  onBlur={() => setFieldError("description", !description.trim() ? "Description is required." : null)}
                  placeholder="What should agents optimize? Describe the task, evaluation criteria, and scoring."
                  rows={3}
                  className={`${inputCls} ${inputBorder("description")} resize-none`}
                />
                <FieldError msg={errors.description ?? null} />
              </div>

              <div>
                <label className={labelCls}>Config <span className="text-[var(--color-text-tertiary)]">(optional, JSON)</span></label>
                <textarea
                  value={config}
                  onChange={(e) => { setConfig(e.target.value); setFieldError("config", null); }}
                  onBlur={() => setFieldError("config", validateJson(config))}
                  placeholder='{"eval_timeout": 300}'
                  rows={2}
                  className={`${inputCls} ${inputBorder("config")} resize-none font-[family-name:var(--font-ibm-plex-mono)]`}
                />
                <FieldError msg={errors.config ?? null} />
              </div>
            </div>
          )}

          {/* ─── Step 3: Review ─── */}
          {step === "review" && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Review your task before creating.</p>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] divide-y divide-[var(--color-border)]">
                {[
                  ["Repo", repoUrl.trim().replace(/\/+$/, "")],
                  ["Task ID", taskId],
                  ["Name", name],
                  ["Description", description],
                  ...(config.trim() ? [["Config", config.trim()]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 px-4 py-2.5">
                    <span className="text-xs font-medium text-[var(--color-text-tertiary)] w-20 shrink-0 pt-0.5">{label}</span>
                    <span className="text-sm text-[var(--color-text)] break-all font-[family-name:var(--font-ibm-plex-mono)]">{value}</span>
                  </div>
                ))}
              </div>

              {submitError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] shrink-0">
          <div>
            {step !== "repo" && (
              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={safeClose}
              className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
            {step === "repo" && (
              <button
                type="button"
                onClick={() => { if (canAdvanceFromRepo()) goNext(); }}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-lg transition-colors"
              >
                Next
              </button>
            )}
            {step === "configure" && (
              <button
                type="button"
                onClick={() => { if (canAdvanceFromConfigure()) goNext(); }}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-lg transition-colors"
              >
                Next
              </button>
            )}
            {step === "review" && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Task"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discard confirmation */}
      {showDiscard && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-elevated)] p-6 max-w-sm mx-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Discard draft?</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">You have unsaved changes that will be lost.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDiscard(false)}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                Keep editing
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

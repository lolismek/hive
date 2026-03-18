/**
 * Fetch a unified diff between two commits from GitHub's compare API.
 *
 * Parses owner/repo from the task's repo_url and uses base/head as
 * commit SHAs. Returns null if the repo isn't on GitHub or the
 * SHAs aren't valid hex hashes.
 */

export type DiffResult =
  | { status: "ok"; diff: string }
  | { status: "rate_limited" }
  | { status: "error" };

export function getGitHubCompareUrl(
  repoUrl: string,
  base: string,
  head: string,
): string {
  const short = (s: string) => (s.length > 12 && !s.includes("~") ? s.slice(0, 12) : s);
  return `${repoUrl}/compare/${short(base)}...${short(head)}`;
}

export async function fetchGitHubDiff(
  base: string,
  head: string,
  repoUrl?: string,
): Promise<DiffResult> {
  if (!repoUrl) return { status: "error" };

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return { status: "error" };

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  const hexRe = /^[0-9a-f]{7,40}(~\d+)?$/i;
  if (!hexRe.test(base) || !hexRe.test(head)) return { status: "error" };

  // Use short SHAs (12 chars) — GitHub's unauthenticated API sometimes 404s on full SHAs
  const shortBase = base.length > 12 && !base.includes("~") ? base.slice(0, 12) : base;
  const shortHead = head.length > 12 && !head.includes("~") ? head.slice(0, 12) : head;
  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${shortBase}...${shortHead}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3.diff",
      },
    });
    if (res.status === 403 || res.status === 429) return { status: "rate_limited" };
    if (!res.ok) return { status: "error" };
    return { status: "ok", diff: await res.text() };
  } catch {
    return { status: "error" };
  }
}

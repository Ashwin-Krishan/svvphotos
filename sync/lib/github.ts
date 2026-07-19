// Minimal GitHub REST API client used by albumsRegistry.ts to read/write
// src/data/albums.generated.json on main (intentionally — a new album
// should trigger a Vercel rebuild). Deliberately API-based rather than
// local `git checkout`/`commit` — this way the pipeline never touches
// whatever branch is currently checked out in the working tree it's run
// from (important for the local on-demand path, which may be run while
// other work is in progress).
//
// The manifest used to live here too (on a dedicated sync-state branch),
// but that hit GitHub's ~100MB Git Blobs API ceiling as it grew — see
// sync/lib/manifest.ts, which now stores it in R2 instead.
import { execSync } from "node:child_process";

function repoInfo(): { owner: string; repo: string } {
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    return { owner, repo };
  }
  const url = execSync("git remote get-url origin").toString().trim();
  const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/);
  if (!match) throw new Error(`Couldn't parse a GitHub repo from remote: ${url}`);
  return { owner: match[1], repo: match[2] };
}

function resolveToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execSync("gh auth token").toString().trim();
  } catch {
    throw new Error(
      "No GitHub token available. Set GITHUB_TOKEN/GH_TOKEN, or run `gh auth login` locally."
    );
  }
}

const { owner, repo } = repoInfo();
const token = resolveToken();

async function ghFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });
  return res;
}

/** Ensures a branch exists, creating it from `main`'s current tip if not. */
export async function ensureBranch(branch: string): Promise<void> {
  const check = await ghFetch(`/git/ref/heads/${branch}`);
  if (check.ok) return;
  if (check.status !== 404) {
    throw new Error(`Failed checking branch ${branch}: ${check.status} ${await check.text()}`);
  }

  const mainRef = await ghFetch(`/git/ref/heads/main`);
  if (!mainRef.ok) {
    throw new Error(`Failed reading main ref: ${mainRef.status} ${await mainRef.text()}`);
  }
  const mainSha = (await mainRef.json()).object.sha;

  const create = await ghFetch(`/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: mainSha }),
  });
  if (!create.ok) {
    throw new Error(`Failed creating branch ${branch}: ${create.status} ${await create.text()}`);
  }
}

/** Reads a file from a branch. Returns null if it doesn't exist yet. */
export async function getFile(
  branch: string,
  filePath: string
): Promise<{ content: string; sha: string } | null> {
  const res = await ghFetch(`/contents/${filePath}?ref=${branch}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed reading ${filePath}@${branch}: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();

  // The Contents API only inlines base64 content for files up to 1MB —
  // above that it returns `content` as an empty string (not omitted, not
  // a different status code — just silently empty). manifest.json
  // crosses that threshold once a few thousand photos are synced, so
  // fall back to the Git Blobs API (good up to 100MB) whenever the
  // reported size doesn't match what an empty string would decode to.
  if (json.content) {
    return { content: Buffer.from(json.content, "base64").toString("utf-8"), sha: json.sha };
  }

  const blob = await ghFetch(`/git/blobs/${json.sha}`);
  if (!blob.ok) {
    throw new Error(`Failed reading blob for ${filePath}@${branch}: ${blob.status} ${await blob.text()}`);
  }
  const blobJson = await blob.json();
  return { content: Buffer.from(blobJson.content, "base64").toString("utf-8"), sha: json.sha };
}

/** Writes (creates or updates) a file on a branch via a single commit. */
export async function putFile(
  branch: string,
  filePath: string,
  content: string,
  message: string
): Promise<void> {
  await ensureBranch(branch);
  const existing = await getFile(branch, filePath);

  const res = await ghFetch(`/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch,
      sha: existing?.sha,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed writing ${filePath}@${branch}: ${res.status} ${await res.text()}`);
  }
}

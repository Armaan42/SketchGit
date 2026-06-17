/**
 * GitHub REST API client for SketchGit.
 *
 * All functions take an accessToken parameter (retrieved server-side from
 * the NextAuth session). The token never reaches the browser.
 *
 * Uses Contents API for reading/writing JSON files (< 1MB)
 * and will use Git Data API for assets in Phase 2.
 */

import {
  GitHubApiError,
  type GitHubFileInfo,
  type GitHubRepo,
  type SaveResult,
} from "@/types/sketch";

const GITHUB_API = "https://api.github.com";

/** Standard headers for all GitHub API requests */
function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** Handles common HTTP error codes from the GitHub API */
async function handleResponse(res: Response): Promise<Response> {
  if (res.ok) return res;

  const body = await res.text().catch(() => "");

  switch (res.status) {
    case 401:
      throw new GitHubApiError(
        "auth",
        "GitHub authentication failed. Please sign in again.",
        401
      );
    case 403:
      if (res.headers.get("x-ratelimit-remaining") === "0") {
        throw new GitHubApiError(
          "rate_limit",
          "GitHub API rate limit exceeded. Please wait a moment.",
          403
        );
      }
      throw new GitHubApiError("auth", "Access forbidden.", 403);
    case 404:
      throw new GitHubApiError("not_found", "Resource not found.", 404);
    case 409:
      throw new GitHubApiError(
        "conflict",
        "Conflict: the file has been modified since you last loaded it. Reload and try again.",
        409
      );
    case 422:
      throw new GitHubApiError(
        "validation",
        `Validation failed: ${body}`,
        422
      );
    default:
      throw new GitHubApiError(
        "unknown",
        `GitHub API error (${res.status}): ${body}`,
        res.status
      );
  }
}

// ─── Repository operations ───────────────────────────────────────────

/**
 * List the authenticated user's repositories, sorted by most recently updated.
 */
export async function listUserRepos(
  token: string,
  page = 1,
  perPage = 30
): Promise<GitHubRepo[]> {
  const url = `${GITHUB_API}/user/repos?sort=updated&direction=desc&per_page=${perPage}&page=${page}&affiliation=owner,collaborator`;
  const res = await handleResponse(await fetch(url, { headers: headers(token) }));
  return res.json();
}

// ─── File operations ────────────────────────────────────────────────

/**
 * List the contents of a directory in a repo.
 * Returns array of GitHubFileInfo for each item.
 */
export async function getRepoContents(
  token: string,
  owner: string,
  repo: string,
  path = ""
): Promise<GitHubFileInfo[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const res = await handleResponse(await fetch(url, { headers: headers(token) }));
  const data = await res.json();

  // GitHub returns a single object for files, array for directories
  if (Array.isArray(data)) return data;
  return [data];
}

/**
 * Get the decoded content of a single file.
 * Returns the parsed content plus the file's SHA (needed for updates).
 */
export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<{ content: string; sha: string }> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const res = await handleResponse(await fetch(url, { headers: headers(token) }));
  const data = await res.json();

  if (data.type !== "file") {
    throw new GitHubApiError("validation", `${path} is not a file.`, 422);
  }

  // GitHub returns base64-encoded content
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

/**
 * Create or update a file in a repo via the Contents API.
 *
 * - If `sha` is omitted → GitHub creates a new file (first commit).
 * - If `sha` is provided → GitHub updates the file (new commit).
 *   A mismatched SHA returns 409 (conflict).
 */
export async function saveFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha?: string,
  message?: string
): Promise<SaveResult> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const commitMessage =
    message || (sha ? `Update ${path}` : `Create ${path}`);

  // Content must be base64-encoded for the Contents API
  const base64Content = Buffer.from(content, "utf-8").toString("base64");

  const body: Record<string, string> = {
    message: commitMessage,
    content: base64Content,
  };

  // Include SHA for updates — omit for creation
  if (sha) {
    body.sha = sha;
  }

  const res = await handleResponse(
    await fetch(url, {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify(body),
    })
  );

  const data = await res.json();
  return {
    sha: data.content.sha,
    commitSha: data.commit.sha,
    path: data.content.path,
  };
}

/**
 * Delete a file from a repo.
 */
export async function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message?: string
): Promise<void> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const commitMessage = message || `Delete ${path}`;

  await handleResponse(
    await fetch(url, {
      method: "DELETE",
      headers: headers(token),
      body: JSON.stringify({
        message: commitMessage,
        sha,
      }),
    })
  );
}

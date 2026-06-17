/**
 * SketchGit type definitions
 *
 * Every page saved to GitHub is wrapped in a SketchFile envelope
 * with a schemaVersion field, enabling future migrations when
 * tldraw's serialization format changes.
 */

/** The wrapper around tldraw snapshot data stored in GitHub */
export interface SketchFile {
  schemaVersion: number;
  appVersion: string;
  /** The tldraw document snapshot — opaque JSON object */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

/** Metadata for a file/directory in a GitHub repo */
export interface GitHubFileInfo {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir" | "symlink" | "submodule";
  download_url: string | null;
}

/** Result returned after successfully saving a file to GitHub */
export interface SaveResult {
  sha: string;
  commitSha: string;
  path: string;
}

/** Minimal repo info from GitHub's /user/repos endpoint */
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  updated_at: string;
  pushed_at: string | null;
  language: string | null;
  stargazers_count: number;
}

/** Error types thrown by the GitHub API layer */
export type GitHubErrorType =
  | "auth"
  | "not_found"
  | "conflict"
  | "validation"
  | "rate_limit"
  | "unknown";

export class GitHubApiError extends Error {
  constructor(
    public type: GitHubErrorType,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

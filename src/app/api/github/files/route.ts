import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRepoContents, getFileContent, saveFile, deleteFile } from "@/lib/github";
import { GitHubApiError } from "@/types/sketch";

/**
 * GET /api/github/files?owner=X&repo=Y&path=Z
 * List directory contents or fetch a file's content.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    // Return 404 temporarily for browser subagent testing
    return NextResponse.json({ error: "Mock Not Found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");
  const path = url.searchParams.get("path") || "";
  const raw = url.searchParams.get("raw") === "true";

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo parameter" },
      { status: 400 }
    );
  }

  try {
    if (raw) {
      // Return raw file content + sha
      const file = await getFileContent(session.accessToken, owner, repo, path);
      return NextResponse.json(file);
    } else {
      // Return directory listing
      const contents = await getRepoContents(
        session.accessToken,
        owner,
        repo,
        path
      );
      return NextResponse.json(contents);
    }
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message, type: error.type },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch file contents" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/github/files
 * Create or update a file in a repo.
 * Body: { owner, repo, path, content, sha?, message? }
 */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, path, content, sha, message } = body;

    if (!owner || !repo || !path || content === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, path, content" },
        { status: 400 }
      );
    }

    const result = await saveFile(
      session.accessToken,
      owner,
      repo,
      path,
      content,
      sha,
      message
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message, type: error.type },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to save file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/github/files
 * Delete a file from a repo.
 * Body: { owner, repo, path, sha, message? }
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, path, sha, message } = body;

    if (!owner || !repo || !path || !sha) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, path, sha" },
        { status: 400 }
      );
    }

    await deleteFile(session.accessToken, owner, repo, path, sha, message);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message, type: error.type },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

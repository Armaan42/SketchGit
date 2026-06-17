import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listUserRepos } from "@/lib/github";
import { GitHubApiError } from "@/types/sketch";

/**
 * GET /api/github/repos
 * Returns the authenticated user's repos, paginated.
 * Query params: page (default 1), per_page (default 30)
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("per_page") || "30", 10);

  try {
    const repos = await listUserRepos(session.accessToken, page, perPage);
    return NextResponse.json(repos);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message, type: error.type },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

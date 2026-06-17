export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Match dashboard and canvas routes — these require auth
    "/dashboard/:path*",
    "/canvas/:path*",
  ],
};

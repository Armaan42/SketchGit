export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Match dashboard routes — canvas commented out for sandbox testing
    "/dashboard/:path*",
    // "/canvas/:path*",
  ],
};

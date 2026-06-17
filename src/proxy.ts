import { auth } from "@/lib/auth";

export const proxy = auth;
export default auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/canvas/:path*",
  ],
};

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // 'repo' gives read/write to all repos (needed to save diagrams)
          // 'read:user' gives profile info
          // 'user:email' gives email address
          scope: "repo read:user user:email",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Controls whether the request is allowed to proceed.
    // When used with middleware, redirects unauthenticated users to signIn page.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/canvas");

      if (isProtected && !isLoggedIn) {
        return false; // Redirects to signIn page
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      // On initial sign-in, persist the GitHub access token and login
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.login = (profile as { login?: string }).login;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose accessToken and login on the session (server-side use only)
      session.accessToken = token.accessToken;
      if (token.login) {
        session.user.login = token.login;
      }
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

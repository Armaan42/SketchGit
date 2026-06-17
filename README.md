# SketchGit

A **GitHub-native visual workspace** — an infinite canvas (tldraw) where every page is a JSON file committed to your GitHub repo. Diagrams that live with your code, with free version history via commits.

**No backend database.** GitHub is the database. GitHub OAuth is the login. Vercel hosts the app.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Canvas:** [tldraw](https://tldraw.dev) SDK v5
- **Styling:** Tailwind CSS v4
- **Auth:** NextAuth.js v5 (Auth.js) with GitHub OAuth
- **Storage:** GitHub REST API (Contents API + Git Data API)
- **Hosting:** Vercel

## Quick Start

### 1. Create a GitHub OAuth App

1. Go to [GitHub → Settings → Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** SketchGit (or anything)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

### 2. Configure Environment

Edit `.env.local` and replace the placeholder values:

```env
GITHUB_CLIENT_ID=your_client_id_from_step_1
GITHUB_CLIENT_SECRET=your_client_secret_from_step_1
```

The `AUTH_SECRET` is already generated for you.

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in with GitHub** → pick a repo → create a page → start sketching!

## How It Works

1. **Login** → GitHub OAuth grants `repo` scope (read/write your repos)
2. **Dashboard** → Lists your GitHub repos
3. **Repo view** → Shows `.json` files inside the `pages/` directory
4. **Canvas** → tldraw infinite canvas; state lives in memory while drawing
5. **Save** → `Ctrl+S` or Save button → serializes canvas → commits JSON to GitHub via Contents API
6. **Version history** → Every save is a Git commit — free history via GitHub

### File Format

Every page is saved as:

```json
{
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "data": { /* tldraw document snapshot */ }
}
```

The `schemaVersion` wrapper enables future migrations when the tldraw SDK changes.

## Repo Layout (in your GitHub repos)

```
your-repo/
  pages/
    home.json        ← sketch pages
    architecture.json
    user-flow.json
  assets/            ← (Phase 2) uploaded images
  exports/           ← (Phase 3) PNG/SVG exports
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import it on [Vercel](https://vercel.com/new)
3. Add environment variables (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_SECRET`)
4. Update your GitHub OAuth App's callback URL to `https://your-domain.vercel.app/api/auth/callback/github`

## License

MIT

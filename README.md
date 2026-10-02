# InsightFlow

InsightFlow turns captured ideas into a learning loop: capture, connect, revisit, and grow. The application uses Next.js for the UI and server application and PostgreSQL for operational data. Google OAuth and Google Drive backup can be enabled when needed.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Keep `GOOGLE_SSO_ON=false` to use the application locally without authentication.
3. Start PostgreSQL and migrate:

```bash
docker compose up -d
npm install
npm run db:migrate
npm run dev
```

With SSO disabled, InsightFlow automatically provisions one PostgreSQL user named `Local User`. All local data belongs to this user; this mode is intended only for private development.

To enable Google authentication and Drive backup later:

1. Set `GOOGLE_SSO_ON=true`.
2. Generate `AUTH_SECRET` and configure `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_URL`.
3. Enable Google Drive API and add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
4. Configure the OAuth consent scopes `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/drive.file`.

Restart the Next.js process after changing the flag.

## Commands

```bash
npm run dev             # development server
npm run db:generate     # generate a versioned migration
npm run db:migrate      # apply migrations
npm run db:seed         # seed an existing signed-in user (requires SEED_USER_EMAIL)
npm test                # unit tests
npm run test:integration # PostgreSQL tests (requires migrated TEST_DATABASE_URL)
npm run lint
npm run typecheck
npm run build
```

Backups are versioned JSON documents. They exclude OAuth credentials, sessions, logs, caches, and infrastructure secrets. Restore validates the complete document before replacing only the authenticated user's learning data in a transaction.

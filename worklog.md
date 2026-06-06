---
Task ID: 1
Agent: Main Agent
Task: ÉTAPES 2-8 — Sécurisation bcrypt, middleware, .env

Work Log:
- Read all current files (lib/auth.ts, api/users/route.ts, api/commercials/route.ts, api/commercials/[id]/route.ts, api/users/[id]/route.ts, api/seed/route.ts, middleware.ts, package.json, .env, .env.example, password.ts)
- ÉTAPE 2: Replaced `verifyPassword()` + `hashPassword()` from password.ts with direct `bcrypt.compare()` in lib/auth.ts authorize()
- ÉTAPE 3: Replaced `hashPassword()` with `bcrypt.hash(password, 10)` in api/users/route.ts POST
- ÉTAPE 4: Same bcrypt.hash(password, 10) in api/commercials/route.ts POST
- ÉTAPE 4b: Same in api/commercials/[id]/route.ts PUT and api/users/[id]/route.ts PUT
- Updated api/seed/route.ts — all 5 seed users use bcrypt.hash('password123', 10)
- Deleted src/lib/password.ts
- ÉTAPE 5: Replaced middleware.ts with user's provided code (NEXTAUTH_SECRET check, public paths, session-token cookie check)
- ÉTAPE 6: Created .env.example with all user-specified variables
- ÉTAPE 7: Created .env.local with dev values including NEXTAUTH_SECRET
- Updated .env to include NEXTAUTH_SECRET
- ÉTAPE 8: Added "generate-secret": "openssl rand -base64 32" to package.json scripts
- Fixed critical bug: findUnique → findFirst in authorize() (User.email was not @unique)
- Added @@unique([email, companyId]) compound unique constraint to User model in Prisma schema
- Pushed schema to DB with db:push --accept-data-loss
- All tests passed via curl

Stage Summary:
- Commit 3c39c1c pushed to origin/main
- 13 files changed, 70 insertions, 152 deletions
- All 8 étapes completed and tested
- Lint passes clean

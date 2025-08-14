# Repository Guidelines

## Project Structure & Module Organization
- `src/server.ts`: MCP server entry; registers tools and env checks.
- `src/handlers/`: One file per tool (e.g., `list-emails.ts`, `send-email.ts`).
- `src/services/gmail.service.ts`: Gmail API wrapper and auth.
- `src/schemas/tool-schemas.ts`: Shared input validation schemas.
- `src/types/`: Shared TypeScript types.
- `src/utils/email-parser.ts`: MIME/raw parsing helpers.
- `dist/`: Compiled JavaScript output (build target).
- `examples/`: Example usage and configs.
- Tests/scripts: `test-gmail-connection.ts`, `test-list-emails.js` in repo root.
- Config: `.env.example` (copy to `.env`), `.local/` for ignored local files.

## Build, Test, and Development Commands
- `npm run dev:server`: Start TS server via `tsx` for local dev.
- `npm run build`: Compile TypeScript to `dist/`.
- `npm start`: Run compiled server from `dist`.
- `npm run setup`: Desktop flow to obtain and store a Gmail refresh token.
- `npm run test` / `test:connection`: Connectivity test (`test-gmail-connection.ts`).
- `npm run test:list`: List recent emails (`test-list-emails.js`).
- `npm run lint`: Lint `src/**/*.ts`.
- `npm run typecheck`: Type-check without emitting files.

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode), Node >= 18, CommonJS output.
- Linting: ESLint + `@typescript-eslint`. Prefer `const`, forbid `debugger`, limit `console` to `error`/`warn`. Prefix intentionally unused vars with `_`.
- Files: kebab-case for filenames (`create-draft.ts`), PascalCase for classes, camelCase for functions/variables. Tool names follow snake_case as exposed to MCP (e.g., `find_and_draft_reply`).

## Testing Guidelines
- Tests are lightweight scripts run with `tsx`/`node`. Keep them idempotent and safe.
- Default to drafts: prefer `create_draft` over `send_email`. Only enable direct sending by setting `GMAIL_ALLOW_DIRECT_SEND=true` when necessary.
- Add new scripts as `test-*.ts` (lint-ignore pattern already configured).

## Commit & Pull Request Guidelines
- Commits: Follow Conventional Commits (e.g., `feat:`, `fix:`, `docs:`, `chore:`) as used in history.
- PRs: Include clear description, motivation, linked issues, manual test steps, and relevant logs/output. Update `README.md`/`CLAUDE.md` when tool behavior or setup changes. Ensure `npm run lint`, `typecheck`, and `build` pass.

## Security & Configuration Tips
- Required env: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`. Optional: `GMAIL_ALLOW_DIRECT_SEND` (default disabled). Example in `.env.example`.
- Run `npm run setup` to generate a refresh token. Never commit secrets; keep local files in `.local/` or `.env`.

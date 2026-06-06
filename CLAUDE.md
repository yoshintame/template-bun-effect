# CLAUDE.md

Effect 3.x project on Bun + TypeScript, scaffolded from `template-bun-effect`.

- Follow the `effect-ts` skill for all Effect code: `Effect.Service` (not bare `Context.Tag`), tagged errors (`Data.TaggedError`), `Config.*`/`Config.redacted` (never `process.env`), `Effect.log` + `annotateLogs`, `@effect/platform` over Node/Bun built-ins, `@effect/vitest` (`it.effect`/`it.scoped`) for tests.
- Follow `ts-react-style`: named exports, top-level `function` declarations, kebab-case files, single quotes / no semicolons, `ts-pattern`/`Match` over `switch`, and no comments in code unless asked.
- Run Effects only at the edge (`BunRuntime.runMain`, or `Effect.runPromise` behind a Promise boundary). Never `runSync`/`throw` inside services.
- Env is read via `Config` (Bun auto-loads `.env`).

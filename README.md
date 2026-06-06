# template-bun-effect

Personal `bun create` template for [Effect](https://effect.website) 3.x projects on Bun + TypeScript.

It is `template-bun-ts` plus the Effect stack: `effect` + `@effect/platform(-bun)`, `@effect/vitest`, the `@effect/language-service` TS plugin, and an idiomatic hello-world seed. Everything else (tsconfig combo, Biome via `@yoshintame/biome-config`, changesets, knip, husky + commitlint + lint-staged) comes from the base template.

## Usage

```sh
bun create yoshintame/template-bun-effect my-app
cd my-app
bun install
bun run dev
```

## Scripts

| Script | What |
|---|---|
| `bun run dev` | Run `src/main.ts` in watch mode |
| `bun run start` | Run `src/main.ts` once |
| `bun run test` / `test:watch` | Vitest (via `@effect/vitest`) |
| `bun run typecheck` | `tsc --noEmit` (strictest + bun combo) |
| `bun run lint` / `lint:dry` | Biome lint |
| `bun run format` | Biome format |
| `bun run depscheck` | knip (unused deps / exports) |
| `bun run changeset` / `version` / `release` | Changesets release flow |

## What the seed shows

`src/main.ts` is intentionally tiny — it only seeds the non-obvious wiring, not an architecture:

- an `Effect.Service` (`Greeter`) with a traced method via `Effect.fn`
- reading env through `Config`, not `process.env`
- running an Effect at the process edge with `BunRuntime.runMain`, guarded by `import.meta.main`
- a `@effect/vitest` test (`it.effect`) with a `ConfigProvider.fromMap` override and a silent logger

Delete `Greeter` and write your own services. There is deliberately **no** `public`/`internal` split or `runPublic` Promise boundary — that is a published-library pattern, not a default. Add it only if you ship a vanilla-Promise API to non-Effect consumers (see the library recipe below).

## Conventions

Follow the `effect-ts` and `ts-react-style` skills: `Effect.Service` over bare `Context.Tag`, tagged errors (`Data.TaggedError`), `Config.redacted` for secrets, `Match.tagsExhaustive` over `switch`, named exports, kebab-case files, no comments. Secrets and config come from the environment (Bun auto-loads `.env`) via `Config`, e.g. `GREETING` in the seed.

## Recipes

### HTTP server

```sh
bun add @effect/platform @effect/platform-bun
```

```ts
import { HttpRouter, HttpServer, HttpServerResponse } from '@effect/platform'
import { BunHttpServer, BunRuntime } from '@effect/platform-bun'
import { Layer } from 'effect'

const router = HttpRouter.empty.pipe(
  HttpRouter.get('/', HttpServerResponse.text('Hello World!')),
)

const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress)

BunRuntime.runMain(Layer.launch(app.pipe(Layer.provide(BunHttpServer.layer({ port: 3000 })))))
```

### CLI

```sh
bun add @effect/cli @effect/printer @effect/printer-ansi
```

```ts
import { Command } from '@effect/cli'
import { BunContext, BunRuntime } from '@effect/platform-bun'
import { Effect } from 'effect'

const root = Command.make('my-app', {}, () => Effect.log('hello'))
const cli = Command.run(root, { name: 'my-app', version: '0.0.0' })

cli(process.argv).pipe(Effect.provide(BunContext.layer), BunRuntime.runMain)
```

Add a `bin` entry to `package.json` pointing at the CLI file (Bun runs the `.ts` directly).

### Library — vanilla-Promise boundary

When consumers do not use Effect, expose a Promise API and keep Effect internal:

```ts
import { Effect } from 'effect'

export function greet(name: string): Promise<string> {
  return Greeter.greet(name).pipe(Effect.provide(MainLive), Effect.runPromise)
}
```

For long-lived processes reuse one runtime with `ManagedRuntime.make(MainLive)` instead of providing per call.

### Asserting typed errors in tests

```ts
const result = yield* Effect.either(service.doThing(badInput))
expect(Either.isLeft(result)).toBe(true)
if (Either.isLeft(result)) expect(result.left._tag).toBe('MyTaggedError')
```

### Secrets

```ts
const apiKey = yield* Config.redacted('API_KEY')
const client = new Vendor({ apiKey: Redacted.value(apiKey) })
```

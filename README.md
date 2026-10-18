# template-bun-effect

Personal `bun create` template for [Effect](https://effect.website) 3.x projects on Bun + TypeScript.

It is `template-bun-ts` plus the Effect stack: `effect` + `@effect/platform(-bun)`, `@effect/vitest`, the `@effect/language-service` TS plugin, and an idiomatic hello-world seed. Everything else (tsconfig combo, type-aware oxlint on the `base`, `strict` and `vitest` presets and oxfmt via `@yoshintame/ox-config`, git hooks and checks via `hk-config`, CI via `yoshintame/workflows`, knip) comes from the base template.

## Usage

```sh
bun create yoshintame/template-bun-effect my-app
cd my-app
mise install
bun install
hk install --mise
bun run dev
```

## Scripts

| Script                        | What                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| `bun run dev`                 | Run `src/main.ts` in watch mode                                       |
| `bun run start`               | Run `src/main.ts` once                                                |
| `bun run test` / `test:watch` | Vitest (via `@effect/vitest`)                                         |
| `bun run typecheck`           | `tsc --noEmit` (strictest + bun combo), then `diagnostics`            |
| `bun run diagnostics`         | Effect language service diagnostics; `--strict` fails on warnings too |
| `bun run depscheck`           | knip (unused deps / exports), also a slow hk step                     |

## Development

Tools come from `mise.toml`, checks from the `hk-config` preset in `hk.pkl`. Run `mise install` and `bun install`, then `hk install --mise` once per clone for the git hooks. `hk check --all --slow` runs every check CI runs, `hk fix --all` formats and applies lint fixes.

CI is `.github/workflows/ci.yml` on top of [`yoshintame/workflows`](https://github.com/yoshintame/workflows). The project is an app (`"private": true`); to publish it as a package see [Publishing](#publishing).

## What the seed shows

`src/main.ts` is intentionally tiny — it only seeds the non-obvious wiring, not an architecture:

- an `Effect.Service` (`Greeter`) with a traced method via `Effect.fn`
- reading env through `Config`, not `process.env`
- running an Effect at the process edge with `BunRuntime.runMain`, guarded by `import.meta.main`
- a `@effect/vitest` test (`it.effect`) with a `ConfigProvider.fromMap` override and a silent logger

Delete `Greeter` and write your own services. There is deliberately **no** `public`/`internal` split or `runPublic` Promise boundary — that is a published-library pattern, not a default. Add it only if you ship a vanilla-Promise API to non-Effect consumers (see the library recipe below).

## Conventions

Follow the `effect-ts` and `ts-react-style` skills: `Effect.Service` over bare `Context.Tag`, tagged errors (`Data.TaggedError`), `Config.redacted` for secrets, `Match.tagsExhaustive` over `switch`, named exports, kebab-case files, no comments. Secrets and config come from the environment (Bun auto-loads `.env`) via `Config`, e.g. `GREETING` in the seed. Internal imports go through the `#src/*` subpath imports in `package.json` (`#src/main` resolves to `./src/main.ts`), not a tsconfig `paths` alias.

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

BunRuntime.runMain(
  Layer.launch(app.pipe(Layer.provide(BunHttpServer.layer({ port: 3000 })))),
)
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

import { Greeter, MainLive } from '#src/main'

export function greet(name: string): Promise<string> {
  return Effect.flatMap(Greeter, (greeter) => greeter.greet(name)).pipe(
    Effect.provide(MainLive),
    Effect.runPromise,
  )
}
```

For long-lived processes reuse one runtime with `ManagedRuntime.make(MainLive)` instead of providing per call.

### Asserting typed errors in tests

```ts
it.effect('fails with MyTaggedError on bad input', () =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(service.doThing(badInput))

    expect(error._tag).toBe('MyTaggedError')
  }),
)
```

### Secrets

```ts
const makeClient = Effect.gen(function* () {
  const apiKey = yield* Config.redacted('API_KEY')

  return new Vendor({ apiKey: Redacted.value(apiKey) })
})
```

## Publishing

The template is an app. To publish it as a single package:

1. In `package.json` drop `"private": true`, set `"version": "0.0.0-development"` (semantic-release sets the real one) and add `exports`, `files`, `repository` and `publishConfig`. A package for Bun consumers can ship its sources as they are: `"exports": { ".": "./src/main.ts" }`, `"files": ["src"]`; the `#src/*` imports travel with it. Drop `src/types/reset.d.ts` and `@total-typescript/ts-reset` too: consumers type-check the shipped sources without ts-reset.
2. Switch `hk.pkl` to the `ts-lib.pkl` preset and add the `lint:package` script it runs: `bun add -d publint @arethetypeswrong/cli`, then `"lint:package": "publint --strict && attw --pack . --profile esm-only"`. A package with a build step prepends `bun run build &&` and adds `"prepack": "bun run build"`, since the release job publishes from a clean checkout. Build it with a bundler (`tsup`, `bun build`): `tsc` leaves the `#src/*` specifiers pointing at `src`, which such a package does not ship.
3. `bun add -d semantic-release` and add `"release": { "branches": ["main"] }` to `package.json`.
4. On npmjs a trusted publisher can only be added to an existing package: publish the first version by hand with `version` temporarily set to it, tag that commit `vX.Y.Z`, push the tag, then add the publisher as described in [Registries and permissions](https://github.com/yoshintame/workflows#registries-and-permissions) and set the package's publishing access to require two-factor authentication and disallow tokens.
5. Add the `release` job from the [`yoshintame/workflows` usage](https://github.com/yoshintame/workflows#usage) to `.github/workflows/ci.yml`, pinned to the same ref as `verify`, with the permissions your registry needs.

import { BunRuntime } from '@effect/platform-bun'
import { Config, Effect, Layer } from 'effect'

export class Greeter extends Effect.Service<Greeter>()('Greeter', {
  effect: Effect.gen(function* () {
    const prefix = yield* Config.string('GREETING').pipe(
      Config.withDefault('Hello'),
    )

    const greet = Effect.fn('Greeter.greet')(function* (name: string) {
      yield* Effect.logDebug('greeting').pipe(Effect.annotateLogs({ name }))

      return `${prefix}, ${name}!`
    })

    return { greet } as const
  }),
}) {}

export const MainLive = Layer.mergeAll(Greeter.Default)

const program = Effect.gen(function* () {
  const greeter = yield* Greeter
  const message = yield* greeter.greet('world')

  yield* Effect.log(message)
})

if (import.meta.main) {
  program.pipe(Effect.provide(MainLive), BunRuntime.runMain)
}

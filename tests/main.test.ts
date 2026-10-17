import { it } from '@effect/vitest'
import { ConfigProvider, Effect, Layer, Logger, LogLevel } from 'effect'
import { expect } from 'vitest'

import { Greeter } from '#src/main'

const TestLive = Layer.mergeAll(
  Greeter.Default,
  Logger.minimumLogLevel(LogLevel.None),
).pipe(
  Layer.provide(
    Layer.setConfigProvider(
      ConfigProvider.fromMap(new Map([['GREETING', 'Hi']])),
    ),
  ),
)

it.effect('greets with the configured prefix', () =>
  Effect.gen(function* () {
    const greeter = yield* Greeter
    const message = yield* greeter.greet('world')

    expect(message).toBe('Hi, world!')
  }).pipe(Effect.provide(TestLive)),
)

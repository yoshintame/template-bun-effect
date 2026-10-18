import {
  base,
  ignorePatterns,
  strict,
  vitest,
} from '@yoshintame/ox-config/oxlint'
import { defineConfig } from 'oxlint'

const effectTestBlocks = ['effect', 'live', 'scoped', 'scopedLive'].flatMap(
  (kind) => [
    `it.${kind}`,
    ...['each', 'fails', 'only', 'prop', 'runIf', 'skip', 'skipIf'].map(
      (modifier) => `it.${kind}.${modifier}`,
    ),
  ],
)

export default defineConfig({
  extends: [base, strict, vitest],
  ignorePatterns,
  options: {
    typeCheck: true,
  },
  rules: {
    'vitest/no-standalone-expect': [
      'error',
      { additionalTestBlockFunctions: effectTestBlocks },
    ],
  },
  overrides: [
    {
      files: ['**/*.{test,spec}.*'],
      rules: {
        'no-restricted-properties': [
          'error',
          {
            property: 'only',
            message: 'focused tests skip the rest of the suite in CI',
          },
          {
            property: 'skip',
            message: 'skipped tests hide failures',
          },
        ],
      },
    },
  ],
})

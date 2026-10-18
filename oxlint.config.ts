import {
  base,
  ignorePatterns,
  strict,
  vitest,
} from '@yoshintame/ox-config/oxlint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base, strict, vitest],
  ignorePatterns,
  options: {
    typeCheck: true,
  },
  rules: {
    'vitest/no-standalone-expect': [
      'error',
      {
        additionalTestBlockFunctions: [
          'it.effect',
          'it.live',
          'it.scoped',
          'it.scopedLive',
        ],
      },
    ],
  },
})

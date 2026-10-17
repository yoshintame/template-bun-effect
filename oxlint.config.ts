import { base, ignorePatterns } from '@yoshintame/ox-config/oxlint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base],
  ignorePatterns,
})

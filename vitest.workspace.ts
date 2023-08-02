import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      testTimeout: 100000,
      hookTimeout: 100000,
    },
  },
])

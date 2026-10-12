import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
    globals: true,
    // engine tests must not depend on jsdom; they still run fine here,
    // but engine code must never import DOM globals (enforced by review).
  }
})

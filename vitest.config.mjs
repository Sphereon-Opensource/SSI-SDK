import { defineConfig } from 'vitest/config';
// const tsconfigPaths = require('vite-tsconfig-paths');

export default defineConfig({
    // plugins: [tsconfigPaths()],
    test: {
        workspace: ['packages/*'],
        testTimeout: 0,
        server: {
            deps: {
                fallbackCJS: true,
                inline: true
            }
        },
        /* for example, use global to avoid globals imports (describe, test, expect): */
        globals: false,
        // testTimeout: 0
    }
});
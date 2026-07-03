import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/security/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
        fileParallelism: false
    }
});

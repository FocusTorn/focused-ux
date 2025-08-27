nx g ./generators:test-scaffold

pnpm dlx vitest run -c libs/shared/vitest.config.ts --coverage

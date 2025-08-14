"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('ConfigurationService', () => {
    (0, vitest_1.it)('returns default when no workspace root', async () => {
        const fs = { readFile: async (_p) => '' };
        const proc = { getWorkspaceRoot: () => '' };
        const { ConfigurationService } = await import('../src/services/Configuration.service.js');
        const svc = new ConfigurationService(fs, proc);
        (0, vitest_1.expect)(await svc.get('a.b', 42)).toBe(42);
    });
    (0, vitest_1.it)('loads yaml and returns nested value or default', async () => {
        const fs = { readFile: async (_p) => 'a:\n  b: 7' };
        const proc = { getWorkspaceRoot: () => '/root' };
        const { ConfigurationService } = await import('../src/services/Configuration.service.js');
        const svc = new ConfigurationService(fs, proc);
        (0, vitest_1.expect)(await svc.get('a.b', 42)).toBe(7);
        (0, vitest_1.expect)(await svc.get('a.c', 42)).toBe(42);
    });
    (0, vitest_1.it)('returns default on fs/yaml errors', async () => {
        const fs = { readFile: async (_p) => { throw new Error('nope'); } };
        const proc = { getWorkspaceRoot: () => '/root' };
        const { ConfigurationService } = await import('../src/services/Configuration.service.js');
        const svc = new ConfigurationService(fs, proc);
        (0, vitest_1.expect)(await svc.get('x.y', 1)).toBe(1);
    });
});
//# sourceMappingURL=configuration.service.test.js.map
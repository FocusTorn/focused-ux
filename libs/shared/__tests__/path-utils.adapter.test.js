"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PathUtils_adapter_js_1 = require("../src/vscode/adapters/PathUtils.adapter.js");
(0, vitest_1.describe)('PathUtilsAdapter', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('getDottedPath returns dotted relative path from dest dir to source file', () => {
        const utils = new PathUtils_adapter_js_1.PathUtilsAdapter();
        const from = '/a/b/c/src/file.ts';
        const to = '/a/b/c/dist/out.js';
        const rel = utils.getDottedPath(from, to);
        (0, vitest_1.expect)(rel).toBe('../src/file.ts');
    });
    (0, vitest_1.it)('getDottedPath normalizes separators and prefixes with ./ when needed', () => {
        const utils = new PathUtils_adapter_js_1.PathUtilsAdapter();
        const from = 'C:/proj/src/file.ts';
        const to = 'C:/proj/index.js';
        const rel = utils.getDottedPath(from, to);
        (0, vitest_1.expect)(rel).toBe('./src/file.ts');
    });
    (0, vitest_1.it)('getDottedPath returns undefined on invalid inputs', () => {
        const utils = new PathUtils_adapter_js_1.PathUtilsAdapter();
        (0, vitest_1.expect)(utils.getDottedPath('', '/a/b')).toBeUndefined();
        (0, vitest_1.expect)(utils.getDottedPath('/a/b', '')).toBeUndefined();
        // @ts-expect-error testing runtime guard
        (0, vitest_1.expect)(utils.getDottedPath(undefined, '/a/b')).toBeUndefined();
        // @ts-expect-error testing runtime guard
        (0, vitest_1.expect)(utils.getDottedPath('/a/b', null)).toBeUndefined();
    });
    (0, vitest_1.it)('sanitizePath replaces invalid characters and never returns empty', () => {
        const utils = new PathUtils_adapter_js_1.PathUtilsAdapter();
        (0, vitest_1.expect)(utils.sanitizePath('inva<li>d*na?me|.txt')).toBe('inva_li_d_na_me_.txt');
        (0, vitest_1.expect)(utils.sanitizePath('   ')).toBe('_');
        // @ts-expect-error testing runtime guard
        (0, vitest_1.expect)(utils.sanitizePath(undefined)).toBe('');
    });
});
//# sourceMappingURL=path-utils.adapter.test.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vitest_1 = require("vitest");
const node_process_1 = tslib_1.__importDefault(require("node:process"));
const Uri_adapter_js_1 = require("../src/vscode/adapters/Uri.adapter.js");
const ENABLE_CONSOLE_OUTPUT = node_process_1.default.env.ENABLE_TEST_CONSOLE === 'true';
if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vitest_1.vi.fn();
    console.info = vitest_1.vi.fn();
    console.warn = vitest_1.vi.fn();
    console.error = vitest_1.vi.fn();
}
class LocalMockUriFactory {
    file(path) {
        const mockUri = {
            fsPath: path,
            path,
            scheme: 'file',
            authority: '',
            query: '',
            fragment: '',
            toString: () => `file://${path}`,
        };
        return new Uri_adapter_js_1.UriAdapter(mockUri);
    }
    create(uri) {
        const path = uri?.fsPath ?? uri?.path ?? String(uri);
        return this.file(path);
    }
    joinPath(base, ...paths) {
        const basePath = base.uri?.fsPath ?? base.uri?.path ?? String(base);
        const fullPath = [basePath, ...paths]
            .join('/')
            .replace(/\\/g, '/')
            .replace(/\/+/g, '/');
        return this.file(fullPath);
    }
    dirname(uri) {
        const basePath = uri.uri?.fsPath ?? uri.uri?.path ?? String(uri);
        const pathString = typeof basePath === 'string' ? basePath : String(basePath);
        const dirPath = pathString.split('/').slice(0, -1).join('/') || '/';
        return this.file(dirPath);
    }
}
Uri_adapter_js_1.UriAdapter.setFactory(new LocalMockUriFactory());
//# sourceMappingURL=_setup.js.map
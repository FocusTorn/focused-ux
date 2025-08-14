"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UriAdapter = void 0;
const VSCodeUriFactory_js_1 = require("./VSCodeUriFactory.js");
class UriAdapter {
    uri;
    constructor(uri) {
        this.uri = uri;
    }
    get path() {
        return this.uri.path;
    }
    get query() {
        return this.uri.query;
    }
    get fsPath() {
        return this.uri.fsPath;
    }
    toString() {
        return this.uri.toString();
    }
    // Static methods for backward compatibility - these delegate to the default factory
    static create(uri) {
        return UriAdapter.defaultFactory.create(uri);
    }
    static file(path) {
        return UriAdapter.defaultFactory.file(path);
    }
    static joinPath(base, ...paths) {
        return UriAdapter.defaultFactory.joinPath(base, ...paths);
    }
    static dirname(uri) {
        return UriAdapter.defaultFactory.dirname(uri);
    }
    // Default factory instance for backward compatibility
    static defaultFactory = new VSCodeUriFactory_js_1.VSCodeUriFactory();
    // Method to set a custom factory (useful for testing)
    static setFactory(factory) {
        UriAdapter.defaultFactory = factory;
    }
    // Method to get the current factory
    static getFactory() {
        return UriAdapter.defaultFactory;
    }
}
exports.UriAdapter = UriAdapter;
//# sourceMappingURL=Uri.adapter.js.map
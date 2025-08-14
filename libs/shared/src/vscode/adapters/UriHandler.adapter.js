"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UriHandlerAdapter = void 0;
const Uri_adapter_js_1 = require("./Uri.adapter.js");
class UriHandlerAdapter {
    handler;
    constructor(handler) {
        this.handler = handler;
    }
    async handleUri(uri) {
        const vscodeUri = uri.uri;
        await this.handler.handleUri(vscodeUri);
    }
    static create(handler) {
        return {
            handleUri: async (uri) => {
                const adapter = new Uri_adapter_js_1.UriAdapter(uri);
                await handler.handleUri(adapter);
            },
        };
    }
}
exports.UriHandlerAdapter = UriHandlerAdapter;
//# sourceMappingURL=UriHandler.adapter.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSymbolAdapter = void 0;
const Range_adapter_js_1 = require("./Range.adapter.js");
class DocumentSymbolAdapter {
    symbol;
    constructor(symbol) {
        this.symbol = symbol;
    }
    get name() {
        return this.symbol.name;
    }
    get range() {
        return new Range_adapter_js_1.RangeAdapter(this.symbol.range);
    }
    get children() {
        return this.symbol.children?.map(child => new DocumentSymbolAdapter(child));
    }
    static fromVSCodeSymbols(symbols) {
        return symbols?.map(symbol => new DocumentSymbolAdapter(symbol));
    }
}
exports.DocumentSymbolAdapter = DocumentSymbolAdapter;
//# sourceMappingURL=DocumentSymbol.adapter.js.map
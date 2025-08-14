"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionAdapter = void 0;
const vscode_1 = require("vscode");
class PositionAdapter {
    create(line, character) {
        return new vscode_1.Position(line, character);
    }
}
exports.PositionAdapter = PositionAdapter;
//# sourceMappingURL=Position.adapter.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTypeAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class FileTypeAdapter {
    get Unknown() { return vscode.FileType.Unknown; }
    get File() { return vscode.FileType.File; }
    get Directory() { return vscode.FileType.Directory; }
    get SymbolicLink() { return vscode.FileType.SymbolicLink; }
}
exports.FileTypeAdapter = FileTypeAdapter;
//# sourceMappingURL=FileType.adapter.js.map
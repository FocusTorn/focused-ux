"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitterAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class EventEmitterAdapter {
    emitter;
    constructor() {
        this.emitter = new vscode.EventEmitter();
    }
    get event() {
        return this.emitter.event;
    }
    fire(data) {
        this.emitter.fire(data);
    }
    dispose() {
        this.emitter.dispose();
    }
}
exports.EventEmitterAdapter = EventEmitterAdapter;
//# sourceMappingURL=EventEmitter.adapter.js.map
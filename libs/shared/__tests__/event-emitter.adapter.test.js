"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const EventEmitter_adapter_js_1 = require("../src/vscode/adapters/EventEmitter.adapter.js");
(0, vitest_1.describe)('EventEmitterAdapter', () => {
    (0, vitest_1.it)('fires events and disposes without error', () => {
        const emitter = new EventEmitter_adapter_js_1.EventEmitterAdapter();
        const handler = vitest_1.vi.fn();
        const sub = emitter.event(handler);
        emitter.fire('hello');
        (0, vitest_1.expect)(handler).toHaveBeenCalledWith('hello');
        sub.dispose();
        emitter.dispose();
        // No explicit assertions post-dispose; ensures no throw
    });
});
//# sourceMappingURL=event-emitter.adapter.test.js.map
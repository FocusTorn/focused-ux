"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathAdapter = void 0;
const node_path_1 = require("node:path");
class PathAdapter {
    join(...paths) {
        return (0, node_path_1.join)(...paths);
    }
    basename(path) {
        return (0, node_path_1.basename)(path);
    }
    parse(path) {
        return (0, node_path_1.parse)(path);
    }
    dirname(path) {
        return (0, node_path_1.dirname)(path);
    }
    relative(from, to) {
        return (0, node_path_1.relative)(from, to);
    }
}
exports.PathAdapter = PathAdapter;
//# sourceMappingURL=Path.adapter.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationService = void 0;
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("node:path"));
const yaml = tslib_1.__importStar(require("js-yaml"));
class ConfigurationService {
    fileSystem;
    process;
    constructor(fileSystem, process) {
        this.fileSystem = fileSystem;
        this.process = process;
    }
    async get(keyPath, defaultValue) {
        const workspaceRoot = this.process.getWorkspaceRoot();
        if (!workspaceRoot) {
            return defaultValue;
        }
        const configPath = path.join(workspaceRoot, '.FocusedUX');
        try {
            const fileContent = await this.fileSystem.readFile(configPath);
            const config = yaml.load(fileContent);
            // Navigate the object using the dot-separated key path
            const value = keyPath.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, config);
            return value === undefined ? defaultValue : value;
        }
        catch (_e) {
            // File not found, parsing error, etc.
            return defaultValue;
        }
    }
}
exports.ConfigurationService = ConfigurationService;
//# sourceMappingURL=Configuration.service.js.map
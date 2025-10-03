// PAE Configuration - TypeScript version
// This mirrors config.json exactly - update both files when making changes

import type { AliasConfig } from './_types/index.js'
import { ConfigUtils } from './services/CommonUtils.service.js'

export const config: AliasConfig = {
    
    // Target aliases for feature's entire dependency chain
    "feature-nxTargets": { //>
        "b": {"run-from": "ext", "run-target": "build"},
        "t": {"run-from": "ext", "run-target": "test:deps --output-style=stream"},
        "ti": {"run-from": "ext", "run-target": "test:integration"},
        "tsc": {"run-from": "ext", "run-target": "type-check"},
        "l": {"run-from": "ext", "run-target": "lint:deps --output-style=stream"},
        "ct": {"run-from": "ext", "run-target": "check-types:deps --output-style=stream"}
    }, //<
    
    // Target aliases for a single project
    "nxTargets": { //>
        "b": "build",
        "p": "package",
        "pd": "package:dev",
        "pub": "publish",
        "ct": "check-types",
        "ctd": "check-types:deps",
        "l": "lint",
        "lf": "lint:deps",
        "v": "validate",
        "vf": "validate:deps",
        "a": "audit",
        "aa": "audit:all",
        "at": "audit:test",
        "ac": "audit:code",
        "t": "test",
        "tc": "test:coverage-tests",
        "td": "test:deps",
        "tdc": "test:deps:coverage-tests",
        "ti": "test:integration",
        "tf": "test:file",
        "c": "clean",
        "cc": "clean:cache",
        "cd": "clean:dist",
        "s": "status",
        "o": "optimize",
        "m": "monitor"
    }, //<
    
    // Expands Nx project name but not targets
    "not-nxTargets": { //>
        "esv": "npx esbuild-visualizer --metadata"
    }, //<
    
    // Agnostic alias assignments, directly replaces alias with command as written
    "expandable-commands": { //>
        "build": "nx build @fux/project-alias-expander -s"
    }, //<
    
    // PAE built-in commands with descriptions
    "commands": { //>
        "install": "Install PAE scripts to native modules directory (use --local for dist-based install)",
        "load": "Load PAE module into active PowerShell session",
        "help": "Show this help with all available aliases and flags (deprecated)"
    }, //<
    
    // Accepts templates and expanded(-alias to --flag) > passed with the command
    "expandable-flags": { //>
        
        //- Nx Flags ---------------------------------------- 
        "s": "--skip-nx-cache",
        "os": { //>
            "defaults": {"style": "stream"},
            "template": "--output-style={style}"
        }, //<

        //- General Flags ----------------------------------- 
        "f": "--fix",
        "c": "--coverage",
        "watch": "--watch",
        "tn": { //>
            "defaults": {"namePattern": ""},
            "template": "--testNamePattern='{namePattern}'"
        }, //<
        "tf": { //>
            "defaults": {"fileName": ""},
            "template": "--testfile='{fileName}'"
        }, //<
        
        "bail": { //>
            "defaults": {"bailOn": "1"},
            "template": "--bail {bailOn}"
        } //<
    }, //<
    
    // Context-aware flags that behave differently based on target alias
    "context-aware-flags": { //> Does not work
        "f": { //>
            // "l": "--fix",                    // lint → --fix
            // "lint": "--fix",                 // lint:deps → --fix  
            // "lf": "--fix",                   // lint:deps → --fix
            // "t": "--testfile={value}",       // test → --testfile={value}
            // "test": "--testfile={value}",    // test:deps → --testfile={value}
            // "td": "--testfile={value}",      // test:deps → --testfile={value}
            // "tc": "--testfile={value}",      // test:coverage-tests → --testfile={value}
            // "tdc": "--testfile={value}",     // test:deps:coverage-tests → --testfile={value}
            // "ti": "--testfile={value}",      // test:integration → --testfile={value}
            // "tf": "--testfile={value}",      // test:file → --testfile={value}
            // "ct": "--strict",                // check-types → --strict
            // "check-types": "--strict",        // check-types:deps → --strict
            // "ctd": "--strict",               // check-types:deps → --strict
            // "v": "--verbose",                // validate → --verbose
            // "validate": "--verbose",         // validate:deps → --verbose
            // "vf": "--verbose",               // validate:deps → --verbose
            "default": "--fix"
        }, //<
        "c": { //>
            // "t": "--coverage",               // test → --coverage
            // "test": "--coverage",            // test:deps → --coverage
            // "td": "--coverage",              // test:deps → --coverage
            // "tc": "--coverage",              // test:coverage-tests → --coverage (redundant but explicit)
            // "tdc": "--coverage",             // test:deps:coverage-tests → --coverage (redundant but explicit)
            "default": "--coverage"
        } //<
    }, //<
    
    // Accepts templates and expanded(-alias to --flag) > processed before command is generated
    "internal-flags": { //>
        "h": "--help",
        "sto": { //>
            "defaults": { "time": "10" },
            "mutation": "value >= 100 ? value : parseInt(value.toString() + '000')",
            "template": "--pae-execa-timeout={time}"
        } //<
    }, //<
    
    // Accepts templates and expanded(-alias to --flag) > processed before command is generated
    "env-setting-flags": { //>
        "v": "--pae-verbose",
        "db": "--pae-debug",
        "echo": { //>
            "defaults": { "echoVariant": "" },
            "mutation": "{echoVariant} -replace '^si$', 'short-in' -replace '^so$', 'short-out' -replace '^gi$', 'global-in' -replace '^go$', 'global-out'",
            "template": "--pae-echo={echoVariant}"
        }, //<
        "echoX": { //>
            "defaults": { "echoVariant": "" },
            "mutation": "{echoVariant} -replace '^si$', 'short-in' -replace '^so$', 'short-out' -replace '^gi$', 'global-in' -replace '^go$', 'global-out'",
            "template": "--pae-echoX={echoVariant}"
        } //<
    }, //<
    
    /**
     * EXPANDABLES SYSTEM
     * ===================
     * 
     * The expandables system allows dynamic command expansion with template-based variable substitution.
     * This enables powerful runtime modifications to PAE commands without hardcoding every variation.
     * 
     * SYNTAX SUPPORT:
     * - Both `-key=value` and `-key:value` syntax are supported
     * - Multiple expansions can be combined: `-sto=5 -mem=2048 -f`
     * 
     * POSITIONING:
     * - "start": Expands at the very start of the command before anything else
     * - "prefix": Expands after the nx run but before the target
     * - "pre-args": Expands before flags but after the base command  
     * - "suffix": Expands after all flags
     * - "end": Expands at the very end, after the command is created, unique instance.
     * 
     * TEMPLATE SYSTEM:
     * - Use {variable} placeholders in templates
     * - Defaults provide fallback values when no value is specified
     * - String literals can be used for simple expansions
     * 
     * USAGE EXAMPLES:
     * 
     * Simple String Expansions:
     *   pae pbc t -f                    → pae pbc t --fix
     *   pae pbc t -v                    → pae pbc t --verbose
     * 
     * Template Expansions with Defaults:
     *   pae pbc t -sto                  → timeout 10s nx run test @fux/project-butler-core
     *   pae pbc t -mem                  → nx run node --max-old-space-size=4096MB test @fux/project-butler-core
     * 
     * Custom Values:
     *   pae pbc t -sto=5                → timeout 5s nx run test @fux/project-butler-core
     *   pae pbc t -mem=2048             → nx run node --max-old-space-size=2048MB test @fux/project-butler-core
     * 
     * Multiple Expansions:
     *   pae pbc t -sto=5 -mem=2048 -f   → timeout 5s nx run node --max-old-space-size=2048MB test @fux/project-butler-core --fix
     *   pae pbc t -sto:5 -mem=2048      → timeout 5s nx run node --max-old-space-size=2048MB test @fux/project-butler-core
     * 
     * CONFIGURATION EXAMPLES:
     * 
     * Simple String:
     *   "f": "--fix"
     * 
     * Template with Defaults:
     *   "sto": {
     *     "position": "prefix",
     *     "defaults": {"command": "timeout", "duration": "10"},
     *     "template": "{command} {duration}s"
     *   }
     * 
     * Template with Position:
     *   "f": {
     *     "position": "suffix", 
     *     "template": "--fix"
     *   }
     * 
     * "Demo": { //>
     *       "defaults": {"duration": 10},
     *       "pwsh-template":[
     *           {
     *               "position": "start",
     *               "template": "$p = Start-Process -FilePath 'pwsh' -ArgumentList '-Command', '"
     *           },
     *           {
     *               "position": "end",
     *               "template": "' -NoNewWindow -PassThru; if (-not $p.WaitForExit({duration}000)) { Stop-Process -Id $p.Id -Force; Write-Warning 'Process timed out and was terminated.' }"
     *           }
     *       ],
     *       "linux-template":{ //>
     *           "position": "start",
     *           "template": "timeout {duration}s"
     *       } //<
     *   } //<
     */
    "expandable-templates": { //>
    }, //<
    
    // Feature and project alias assignments 
    "nxPackages": { //>
        "ccp": { "name": "context-cherry-picker", "suffix": "ext", "full": true },
        "ccpc": { "name": "context-cherry-picker", "suffix": "core" },
        "ccpe": { "name": "context-cherry-picker", "suffix": "ext" },
        "dc": { "name": "dynamicons", "suffix": "ext", "full": true },
        "dca": { "name": "dynamicons", "suffix": "ext" },
        "dcc": { "name": "dynamicons", "suffix": "core" },
        "dce": { "name": "dynamicons", "suffix": "ext" },
        "gw": { "name": "ghost-writer", "suffix": "ext", "full": true },
        "gwc": { "name": "ghost-writer", "suffix": "core" },
        "gwe": { "name": "ghost-writer", "suffix": "ext" },
        "pb": { "name": "project-butler", "suffix": "ext", "full": true },
        "pbc": { "name": "project-butler", "suffix": "core" },
        "pbe": { "name": "project-butler", "suffix": "ext" },
        "nh": { "name": "note-hub", "suffix": "ext", "full": true },
        "nhc": { "name": "note-hub", "suffix": "core" },
        "nhe": { "name": "note-hub", "suffix": "ext" },
        "vp": "@fux/vsix-packager",
        "vsct": "@fux/vscode-test-cli-config",
        "aka": "@fux/project-alias-expander",
        "ms": "@fux/mock-strategy",
        "audit": "@fux/structure-auditor",
        "cmo": "@fux/cursor-memory-optimizer",
        "vpack": "@fux/vpack",
        "vscte": "@fux/vscode-test-executor",
        "fttc": "@fux/ft-typescript",
        "reco": "@fux/recommended"
    } //<
}

export default config

// Export the resolveProjectForAlias function for compatibility
export function resolveProjectForAlias(aliasValue: string | { name: string, suffix?: 'core' | 'ext', full?: boolean }): { project: string, isFull: boolean } {
    return ConfigUtils.resolveProjectForAlias(aliasValue)
}

// Export loadAliasConfig function for compatibility
export function loadAliasConfig(): AliasConfig {
    return config
}

// Export loadAliasConfigCached function for compatibility (same as loadAliasConfig for static config)
export function loadAliasConfigCached(): AliasConfig {
    return config
}

// Export clearAllCaches function for compatibility (no-op for static config)
export function clearAllCaches(): void {
    // No-op for static config - no caches to clear
}

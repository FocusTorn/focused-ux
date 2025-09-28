import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'node:url'
import stripJsonComments from 'strip-json-comments'
import type { AliasConfig, AliasValue } from './_types/index.js'

const __filename = fileURLToPath(import.meta.url)
const PACKAGE_ROOT = path.resolve(path.dirname(__filename), '..')

// Debug mode - check environment variable or debug flag
const DEBUG = process.env.PAE_DEBUG === '1' || process.argv.includes('-d') || process.argv.includes('--debug')

function debug(message: string, ...args: any[]) {
    if (DEBUG) {
        console.error(`[CONFIG DEBUG] ${message}`, ...args)
    }
}

debug('Config.ts debug:')
debug('  __filename:', __filename)
debug('  PACKAGE_ROOT:', PACKAGE_ROOT)
debug('  process.cwd():', process.cwd())

export function loadAliasConfig(): AliasConfig {
    // Try multiple possible locations for config.json
    const possiblePaths = [
        // If running from project root
        path.join(process.cwd(), 'libs', 'project-alias-expander', 'config.json'),
        // If running from package directory
        path.join(process.cwd(), 'config.json'),
        // If running from compiled dist
        path.join(PACKAGE_ROOT, 'config.json'),
        // Fallback to relative path
        path.resolve('libs/project-alias-expander/config.json')
    ]
    
    for (const configPath of possiblePaths) {
        debug(`Trying config path: ${configPath}`)
        debug(`  existsSync result: ${fs.existsSync(configPath)}`)
        try {
            if (fs.existsSync(configPath)) {
                debug(`  Found config file, reading content...`)
                const configContent = fs.readFileSync(configPath, 'utf-8')
                debug(`  Config content length: ${configContent.length}`)
                const strippedContent = stripJsonComments(configContent)
                debug(`  Stripped content length: ${strippedContent.length}`)
                const parsed = JSON.parse(strippedContent)
                debug(`  Config parsed successfully`)
                return parsed
            }
        } catch (error) {
            debug(`  Error with path ${configPath}:`, error)
            // Continue to next path
        }
    }
    
    // If none of the paths worked, throw error with the first attempted path
    const firstPath = possiblePaths[0]
    console.error(`Failed to load config from any of these locations:`, possiblePaths)
    throw new Error(`Config file not found. Tried: ${possiblePaths.join(', ')}`)
}

export function resolveProjectForAlias(aliasValue: string | { name: string, suffix?: 'core' | 'ext', full?: boolean }): { project: string, isFull: boolean } {
    if (typeof aliasValue === 'string') {
        const project = aliasValue.startsWith('@fux/') ? aliasValue : `@fux/${aliasValue}`
        return { project, isFull: false }
    }
    
    const { name, suffix, full } = aliasValue
    if (full) {
        // When full is true, we still need to consider the suffix
        const projectName = suffix ? `${name}-${suffix}` : name
        const project = projectName.startsWith('@fux/') ? projectName : `@fux/${projectName}`
        return { project, isFull: true }
    }
    
    const projectName = suffix ? `${name}-${suffix}` : name
    const project = projectName.startsWith('@fux/') ? projectName : `@fux/${projectName}`
    return { project, isFull: false }
}

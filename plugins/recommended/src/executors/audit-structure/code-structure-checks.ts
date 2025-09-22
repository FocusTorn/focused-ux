import path from 'node:path'
import fs from 'node:fs'

export interface CodeViolation {
    category: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    file: string
    line: number
    column: number
    message: string
    suggestion?: string
}

export interface CodeStructureResult {
    violations: CodeViolation[]
    totalFiles: number
    filesWithViolations: number
}

/**
 * Scans source files for architectural violations based on FocusedUX patterns
 */
export function auditCodeStructure(projectRoot: string, verbose = false): CodeStructureResult {
    const violations: CodeViolation[] = []
    const sourceFiles: string[] = []
    const filesWithViolations = new Set<string>()

    // Find all source files
    function findSourceFiles(dir: string) {
        if (!fs.existsSync(dir)) return

        const entries = fs.readdirSync(dir, { withFileTypes: true })
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            
            if (entry.isDirectory()) {
                // Skip node_modules, dist, and test directories
                if (['node_modules', 'dist', '__tests__', 'test'].includes(entry.name)) continue
                findSourceFiles(fullPath)
            } else if ((entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts')) || entry.name === 'package.json') {
                sourceFiles.push(fullPath)
            }
        }
    }

    // Start scanning from project root
    findSourceFiles(projectRoot)

    // Check each source file for violations
    for (const sourceFile of sourceFiles) {
        const fileViolations = checkSourceFile(sourceFile, projectRoot, verbose)

        violations.push(...fileViolations)
        
        if (fileViolations.length > 0) {
            filesWithViolations.add(sourceFile)
        }
    }

    return {
        violations,
        totalFiles: sourceFiles.length,
        filesWithViolations: filesWithViolations.size
    }
}

/**
 * Check a single source file for architectural violations
 */
function checkSourceFile(filePath: string, projectRoot: string, verbose: boolean): CodeViolation[] {
    const violations: CodeViolation[] = []
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const lines = content.split('\n')
        const relativePath = path.relative(projectRoot, filePath)

        // Check for various violation patterns
        violations.push(...checkSharedReferences(lines, relativePath))
        violations.push(...checkMocklyReferences(lines, relativePath))
        violations.push(...checkVSCodeValueImports(lines, relativePath, filePath))
        violations.push(...checkDynamicImports(lines, relativePath))
        violations.push(...checkNodeJsImports(lines, relativePath))
        violations.push(...checkBusinessLogicInExtensions(lines, relativePath, filePath))
        violations.push(...checkDIContainerPatterns(lines, relativePath, filePath))
        violations.push(...checkPackageJsonStructure(filePath, projectRoot))
        violations.push(...checkDevDependenciesMisplacement(filePath, projectRoot))
    } catch (error) {
        if (verbose) {
            console.warn(`Warning: Could not read file ${filePath}: ${error}`)
        }
    }

    return violations
}

/**
 * Check for references to @fux/shared (CRITICAL violation)
 */
function checkSharedReferences(lines: string[], filePath: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    const sharedPatterns = [
        /@fux\/shared/,
        /from\s+['"]@fux\/shared['"]/,
        /import.*@fux\/shared/,
        /require.*@fux\/shared/,
    ]

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Skip comment lines
        const trimmedLine = line.trim()

        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
            continue
        }
        
        for (const pattern of sharedPatterns) {
            if (pattern.test(line)) {
                violations.push({
                    category: 'Forbidden Shared References',
                    severity: 'CRITICAL',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf('@fux/shared') + 1,
                    message: 'Package references @fux/shared. In refactored end state, all packages must be completely self-contained.',
                    suggestion: 'Remove @fux/shared dependency and implement required functionality directly in this package'
                })
            }
        }
    }

    return violations
}

/**
 * Check for references to @fux/mockly (CRITICAL violation)
 */
function checkMocklyReferences(lines: string[], filePath: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    const mocklyPatterns = [
        /@fux\/mockly/,
        /from\s+['"]@fux\/mockly['"]/,
        /import.*@fux\/mockly/,
        /require.*@fux\/mockly/,
    ]

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Skip comment lines
        const trimmedLine = line.trim()

        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
            continue
        }
        
        for (const pattern of mocklyPatterns) {
            if (pattern.test(line)) {
                violations.push({
                    category: 'Forbidden Mockly References',
                    severity: 'CRITICAL',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf('@fux/mockly') + 1,
                    message: 'Package references @fux/mockly. In refactored end state, NO package should have any knowledge of @fux/mockly.',
                    suggestion: 'Use direct instantiation instead of DI containers'
                })
            }
        }
    }

    return violations
}

/**
 * Check for VSCode value imports (not type imports)
 */
function checkVSCodeValueImports(lines: string[], filePath: string, fullPath: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    
    // Skip adapter files, extension entry points, and test files - they are allowed VSCode imports
    const fileName = path.basename(fullPath)

    if (fileName.endsWith('.adapter.ts')
      || fileName === 'index.ts'
      || fileName === 'extension.ts'
      || fileName.endsWith('.test.ts')
      || fileName.endsWith('.spec.ts')
      || fileName === 'helpers.ts'
      || fileName === '_setup.ts'
      || fileName === 'runTest.ts'
      || fullPath.includes('/integration-tests/')) {
        return violations
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Skip type-only imports
        if (line.includes('import type')) {
            continue
        }
        
        // Check for VSCode value imports (not type imports)
        const vscodeValuePatterns = [
            /import\s+.*\s+from\s+['"]vscode['"]/,
            /import\s+.*\s+from\s+['"]@types\/vscode['"]/,
        ]
        
        for (const pattern of vscodeValuePatterns) {
            if (pattern.test(line)) {
                const isCorePackage = fullPath.includes('/core/')
                const isExtPackage = fullPath.includes('/ext/')
                
                if (isCorePackage) {
                    violations.push({
                        category: 'Core Package VSCode Value Import',
                        severity: 'CRITICAL',
                        file: filePath,
                        line: i + 1,
                        column: line.indexOf('import') + 1,
                        message: 'Core packages must use type imports only. Use "import type { Uri } from vscode" instead of value imports.',
                        suggestion: 'Change to: import type { Api } from vscode'
                    })
                } else if (isExtPackage) {
                    violations.push({
                        category: 'Extension Package VSCode Value Import',
                        severity: 'HIGH',
                        file: filePath,
                        line: i + 1,
                        column: line.indexOf('import') + 1,
                        message: 'Extension packages should create local adapters with VSCode value imports. Ensure this is in an adapter file with .adapter.ts suffix.',
                        suggestion: 'Move VSCode value imports to a .adapter.ts file'
                    })
                } else {
                    violations.push({
                        category: 'VSCode Value Import',
                        severity: 'HIGH',
                        file: filePath,
                        line: i + 1,
                        column: line.indexOf('import') + 1,
                        message: 'VSCode value imports are not allowed. Use type imports only.',
                        suggestion: 'Change to: import type { Api } from vscode'
                    })
                }
            }
        }
    }

    return violations
}

/**
 * Check for dynamic imports (not allowed)
 */
function checkDynamicImports(lines: string[], filePath: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    
    // Skip integration test files - they are allowed to use dynamic imports for VSCode testing
    if (filePath.includes('/integration-tests/') || path.basename(filePath) === 'runTest.ts') {
        return violations
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Check for dynamic imports
        const dynamicImportPatterns = [
            /import\s*\(/,
            /require\s*\(/,
        ]
        
        for (const pattern of dynamicImportPatterns) {
            if (pattern.test(line)) {
                violations.push({
                    category: 'Dynamic Import',
                    severity: 'HIGH',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf('import') + 1,
                    message: 'Dynamic imports not allowed, refactor to static imports',
                    suggestion: 'Replace dynamic import with static import statement'
                })
            }
        }
    }

    return violations
}

/**
 * Check for direct Node.js module imports
 */
function checkNodeJsImports(lines: string[], filePath: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    
    // Skip core packages - they can use Node.js modules
    if (filePath.includes('/core/')) {
        return violations
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Check for Node.js module imports
        const nodeJsImportPatterns = [
            /import.*from\s+['"]node:fs['"]/,
            /import.*from\s+['"]node:path['"]/,
            /import.*from\s+['"]node:os['"]/,
            /import.*from\s+['"]node:crypto['"]/,
            /import.*from\s+['"]node:child_process['"]/,
            /import.*from\s+['"]fs['"]/,
            /import.*from\s+['"]path['"]/,
        ]
        
        for (const pattern of nodeJsImportPatterns) {
            if (pattern.test(line)) {
                violations.push({
                    category: 'Direct Node.js Module Import',
                    severity: 'HIGH',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf('import') + 1,
                    message: 'VSCode extensions should not include Node.js built-in modules. Use VSCode APIs or shared adapters.',
                    suggestion: 'Use VSCode APIs or create adapters in shared package'
                })
            }
        }
    }

    return violations
}

/**
 * Check for business logic in extension packages
 */
function checkBusinessLogicInExtensions(lines: string[], filePath: string, fullPath: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    
    // Only check extension packages
    if (!filePath.includes('/ext/')) {
        return violations
    }

    // Skip extension.ts as it is allowed to have some logic
    const fileName = path.basename(fullPath)

    if (fileName === 'extension.ts') {
        return violations
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Check for business logic patterns that should be in core
        const businessLogicPatterns = [
            /async\s+function\s+processData/,
            /async\s+function\s+validateInput/,
            /async\s+function\s+transformData/,
            /class\s+\w+Service/,
            /export\s+class\s+\w+Processor/,
            /export\s+class\s+\w+Validator/,
        ]
        
        for (const pattern of businessLogicPatterns) {
            if (pattern.test(line)) {
                violations.push({
                    category: 'Business Logic in Extension Package',
                    severity: 'HIGH',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf('async') + 1,
                    message: 'Extension packages should be thin wrappers. Business logic belongs in core package.',
                    suggestion: 'Move business logic to core package'
                })
            }
        }
    }

    return violations
}

/**
 * Check for DI container patterns in core packages
 */
function checkDIContainerPatterns(lines: string[], filePath: string, _fullPath: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    
    // Only check core packages
    if (!filePath.includes('/core/')) {
        return violations
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Check for DI container patterns
        const diPatterns = [
            /createContainer/,
            /asFunction/,
            /asClass/,
            /asValue/,
            /awilix/,
            /InjectionMode/,
        ]
        
        for (const pattern of diPatterns) {
            if (pattern.test(line)) {
                violations.push({
                    category: 'DI Container Patterns in Core Package',
                    severity: 'CRITICAL',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf(pattern.source) + 1,
                    message: 'Core packages should use direct instantiation, not DI containers.',
                    suggestion: 'Remove DI container usage and use direct instantiation'
                })
            }
        }
    }

    return violations
}

/**
 * Check package.json structure compliance for core packages
 */
function checkPackageJsonStructure(filePath: string, projectRoot: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    
    // Only check package.json files in core packages
    if (!filePath.includes('/core/') || !filePath.endsWith('package.json')) {
        return violations
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const packageJson = JSON.parse(content)
        const relativePath = path.relative(projectRoot, filePath)

        // Check required fields
        const requiredFields = [
            'name', 'version', 'private', 'main', 'types', 'exports', 'devDependencies'
        ]

        for (const field of requiredFields) {
            if (!(field in packageJson)) {
                violations.push({
                    category: 'Package.json Structure',
                    severity: 'HIGH',
                    file: relativePath,
                    line: 1,
                    column: 1,
                    message: `Missing required field "${field}" in package.json`,
                    suggestion: `Add "${field}" field to package.json`
                })
            }
        }

        // Check exports structure
        if (packageJson.exports && typeof packageJson.exports === 'object') {
            if (!packageJson.exports['.']) {
                violations.push({
                    category: 'Package.json Structure',
                    severity: 'HIGH',
                    file: relativePath,
                    line: 1,
                    column: 1,
                    message: 'Missing "." export in exports field',
                    suggestion: 'Add "." export with types, import, and default fields'
                })
            } else {
                const dotExport = packageJson.exports['.']
                const requiredExportFields = ['types', 'import', 'default']
                
                for (const field of requiredExportFields) {
                    if (!(field in dotExport)) {
                        violations.push({
                            category: 'Package.json Structure',
                            severity: 'HIGH',
                            file: relativePath,
                            line: 1,
                            column: 1,
                            message: `Missing "${field}" field in "." export`,
                            suggestion: `Add "${field}" field to "." export`
                        })
                    }
                }
            }
        }

        // Check main and types paths
        if (packageJson.main && !packageJson.main.startsWith('./dist/')) {
            violations.push({
                category: 'Package.json Structure',
                severity: 'MEDIUM',
                file: relativePath,
                line: 1,
                column: 1,
                message: 'main field should point to "./dist/index.js"',
                suggestion: 'Change main field to "./dist/index.js"'
            })
        }

        if (packageJson.types && !packageJson.types.startsWith('./dist/')) {
            violations.push({
                category: 'Package.json Structure',
                severity: 'MEDIUM',
                file: relativePath,
                line: 1,
                column: 1,
                message: 'types field should point to "./dist/index.d.ts"',
                suggestion: 'Change types field to "./dist/index.d.ts"'
            })
        }

        // Check required devDependencies
        const requiredDevDeps = ['@types/node', 'typescript', 'vitest']

        if (packageJson.devDependencies) {
            for (const dep of requiredDevDeps) {
                if (!(dep in packageJson.devDependencies)) {
                    violations.push({
                        category: 'Package.json Structure',
                        severity: 'MEDIUM',
                        file: relativePath,
                        line: 1,
                        column: 1,
                        message: `Missing required devDependency "${dep}"`,
                        suggestion: `Add "${dep}" to devDependencies`
                    })
                }
            }
        }
    } catch (error) {
        violations.push({
            category: 'Package.json Structure',
            severity: 'CRITICAL',
            file: path.relative(projectRoot, filePath),
            line: 1,
            column: 1,
            message: `Invalid package.json: ${error}`,
            suggestion: 'Fix JSON syntax errors in package.json'
        })
    }

    return violations
}

/**
 * Check for devDependencies that should be in dependencies
 */
function checkDevDependenciesMisplacement(filePath: string, projectRoot: string): CodeViolation[] {
    const violations: CodeViolation[] = []
    
    // Only check package.json files
    if (!filePath.endsWith('package.json')) {
        return violations
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const packageJson = JSON.parse(content)
        const relativePath = path.relative(projectRoot, filePath)

        // Common runtime dependencies that are often mistakenly placed in devDependencies
        const runtimeDeps = [
            'js-yaml', 'micromatch', 'gpt-tokenizer', 'typescript', 'lodash', 'moment', 'axios',
            'uuid', 'crypto-js', 'jsonwebtoken', 'bcrypt', 'express', 'fastify', 'koa',
            'mongoose', 'sequelize', 'prisma', 'redis', 'ioredis', 'pg', 'mysql2'
        ]

        if (packageJson.devDependencies) {
            for (const [depName, _depVersion] of Object.entries(packageJson.devDependencies)) {
                if (runtimeDeps.includes(depName)) {
                    violations.push({
                        category: 'DevDependencies Misplacement',
                        severity: 'HIGH',
                        file: relativePath,
                        line: 1,
                        column: 1,
                        message: `"${depName}" is a runtime dependency but is listed in devDependencies`,
                        suggestion: `Move "${depName}" from devDependencies to dependencies`
                    })
                }
            }
        }

        // Check for @types packages in dependencies (should be in devDependencies)
        if (packageJson.dependencies) {
            for (const depName of Object.keys(packageJson.dependencies)) {
                if (depName.startsWith('@types/')) {
                    violations.push({
                        category: 'DevDependencies Misplacement',
                        severity: 'HIGH',
                        file: relativePath,
                        line: 1,
                        column: 1,
                        message: `"${depName}" is a type definition package but is listed in dependencies`,
                        suggestion: `Move "${depName}" from dependencies to devDependencies`
                    })
                }
            }
        }
    } catch (_error) {
        // Skip invalid JSON files - they're handled by the package.json structure check
    }

    return violations
}

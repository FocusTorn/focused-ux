import path from 'node:path'
import fs from 'node:fs'

export interface TestViolation {
    category: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    file: string
    line: number
    column: number
    message: string
    suggestion?: string
}

export interface TestStructureResult {
    violations: TestViolation[]
    totalFiles: number
    filesWithViolations: number
}

/**
 * Scans test files for structure violations based on the Enhanced Mock Strategy
 */
export function auditTestStructure(projectRoot: string, verbose = false): TestStructureResult {
    const violations: TestViolation[] = []
    const testFiles: string[] = []
    const filesWithViolations = new Set<string>()

    // Find all test files
    function findTestFiles(dir: string) {
        if (!fs.existsSync(dir)) return

        const entries = fs.readdirSync(dir, { withFileTypes: true })
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            
            if (entry.isDirectory()) {
                // Skip node_modules
                if (entry.name === 'node_modules') continue
                findTestFiles(fullPath)
            } else if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) {
                testFiles.push(fullPath)
            }
        }
    }

    // Start scanning from project root
    findTestFiles(projectRoot)

    // Check each test file for violations
    for (const testFile of testFiles) {
        const fileViolations = checkTestFile(testFile, projectRoot, verbose)
        violations.push(...fileViolations)
        
        if (fileViolations.length > 0) {
            filesWithViolations.add(testFile)
        }
    }

    return {
        violations,
        totalFiles: testFiles.length,
        filesWithViolations: filesWithViolations.size
    }
}

/**
 * Check a single test file for structure violations
 */
function checkTestFile(filePath: string, projectRoot: string, verbose: boolean): TestViolation[] {
    const violations: TestViolation[] = []
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const lines = content.split('\n')
        const relativePath = path.relative(projectRoot, filePath)

        // Check for various violation patterns
        violations.push(...checkDuplicateMockClasses(lines, relativePath))
        violations.push(...checkMockSetupOrder(lines, relativePath))
        violations.push(...checkMissingHelperImports(lines, relativePath, content))
        violations.push(...checkInconsistentServiceInstantiation(lines, relativePath))
        violations.push(...checkDirectGlobalMockReferences(lines, relativePath))
        violations.push(...checkUnnecessaryGlobalDeclarations(lines, relativePath))
        violations.push(...checkTestStructurePatterns(lines, relativePath))

    } catch (error) {
        if (verbose) {
            console.warn(`Warning: Could not read file ${filePath}: ${error}`)
        }
    }

    return violations
}

/**
 * Check for duplicate mock class definitions
 */
function checkDuplicateMockClasses(lines: string[], filePath: string): TestViolation[] {
    const violations: TestViolation[] = []
    const duplicateMockClasses = ['MockFileSystem', 'MockPath', 'MockYaml', 'MockTokenizer', 'MockMicromatch']

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        for (const mockClass of duplicateMockClasses) {
            if (line.includes(`class ${mockClass}`)) {
                violations.push({
                    category: 'Duplicate Mock Class Definitions',
                    severity: 'CRITICAL',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf('class') + 1,
                    message: `Duplicate mock class '${mockClass}' found. Use global mocks from setupTestEnvironment() instead.`,
                    suggestion: `Replace with: let mocks: ReturnType<typeof setupTestEnvironment>`
                })
            }
        }
    }

    return violations
}

/**
 * Check for incorrect mock setup order
 */
function checkMockSetupOrder(lines: string[], filePath: string): TestViolation[] {
    const violations: TestViolation[] = []
    let resetAllMocksLine = -1
    let setupMocksLine = -1

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        if (line.includes('resetAllMocks(mocks)')) {
            resetAllMocksLine = i
        }
        
        if (line.includes('setup') && line.includes('Mocks(mocks)')) {
            setupMocksLine = i
        }
    }

    if (resetAllMocksLine !== -1 && setupMocksLine !== -1 && resetAllMocksLine > setupMocksLine) {
        violations.push({
            category: 'Incorrect Mock Setup Order',
            severity: 'HIGH',
            file: filePath,
            line: resetAllMocksLine + 1,
            column: 1,
            message: 'resetAllMocks() called after setup functions. This clears the setup!',
            suggestion: 'Call resetAllMocks(mocks) before any setup*Mocks(mocks) calls'
        })
    }

    return violations
}

/**
 * Check for missing helper function imports
 */
function checkMissingHelperImports(lines: string[], filePath: string, content: string): TestViolation[] {
    const violations: TestViolation[] = []
    
    // Check what operations are used in the file
    const usesFileSystem = content.includes('fileSystem') || content.includes('readFile') || content.includes('writeFile')
    const usesPath = content.includes('path.') || content.includes('join') || content.includes('resolve')
    const usesYaml = content.includes('yaml.') || content.includes('load') || content.includes('dump')
    const usesTokenizer = content.includes('tokenizer') || content.includes('tokenize')
    const usesMicromatch = content.includes('micromatch') || content.includes('isMatch')

    // Check imports
    const importLines = lines.filter(line => line.includes('import') && line.includes('from'))
    const importContent = importLines.join(' ')

    if (usesFileSystem && !importContent.includes('setupFileSystemMocks')) {
        violations.push({
            category: 'Missing Helper Function Calls',
            severity: 'MEDIUM',
            file: filePath,
            line: 1,
            column: 1,
            message: 'File system operations detected but setupFileSystemMocks not imported',
            suggestion: 'Add setupFileSystemMocks to imports from helpers'
        })
    }

    if (usesPath && !importContent.includes('setupPathMocks')) {
        violations.push({
            category: 'Missing Helper Function Calls',
            severity: 'MEDIUM',
            file: filePath,
            line: 1,
            column: 1,
            message: 'Path operations detected but setupPathMocks not imported',
            suggestion: 'Add setupPathMocks to imports from helpers'
        })
    }

    if (usesYaml && !importContent.includes('setupYamlMocks')) {
        violations.push({
            category: 'Missing Helper Function Calls',
            severity: 'MEDIUM',
            file: filePath,
            line: 1,
            column: 1,
            message: 'YAML operations detected but setupYamlMocks not imported',
            suggestion: 'Add setupYamlMocks to imports from helpers'
        })
    }

    if (usesTokenizer && !importContent.includes('setupTokenizerMocks')) {
        violations.push({
            category: 'Missing Helper Function Calls',
            severity: 'MEDIUM',
            file: filePath,
            line: 1,
            column: 1,
            message: 'Tokenizer operations detected but setupTokenizerMocks not imported',
            suggestion: 'Add setupTokenizerMocks to imports from helpers'
        })
    }

    if (usesMicromatch && !importContent.includes('setupMicromatchMocks')) {
        violations.push({
            category: 'Missing Helper Function Calls',
            severity: 'MEDIUM',
            file: filePath,
            line: 1,
            column: 1,
            message: 'Micromatch operations detected but setupMicromatchMocks not imported',
            suggestion: 'Add setupMicromatchMocks to imports from helpers'
        })
    }

    return violations
}

/**
 * Check for inconsistent service instantiation
 */
function checkInconsistentServiceInstantiation(lines: string[], filePath: string): TestViolation[] {
    const violations: TestViolation[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Look for service constructor calls with local mock variables
        if (line.includes('new ') && line.includes('(') && line.includes(')')) {
            const mockPattern = /mock\w+\s+as\s+any/g
            const matches = line.match(mockPattern)
            
            if (matches) {
                violations.push({
                    category: 'Inconsistent Service Instantiation',
                    severity: 'HIGH',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf('new') + 1,
                    message: 'Service instantiation using local mock variables instead of global mocks',
                    suggestion: 'Use mocks.* instead of local mock variables'
                })
            }
        }
    }

    return violations
}

/**
 * Check for direct global mock references
 */
function checkDirectGlobalMockReferences(lines: string[], filePath: string): TestViolation[] {
    const violations: TestViolation[] = []
    const globalMockPatterns = ['mockYaml.', 'mockMicromatch.', 'mockFileSystem.', 'mockPath.', 'mockTokenizer.']

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        for (const pattern of globalMockPatterns) {
            if (line.includes(pattern)) {
                violations.push({
                    category: 'Direct Global Mock References',
                    severity: 'MEDIUM',
                    file: filePath,
                    line: i + 1,
                    column: line.indexOf(pattern) + 1,
                    message: `Direct reference to global mock '${pattern}' instead of using mocks object`,
                    suggestion: `Replace with mocks.${pattern.replace('mock', '').toLowerCase()}`
                })
            }
        }
    }

    return violations
}

/**
 * Check for unnecessary global declarations
 */
function checkUnnecessaryGlobalDeclarations(lines: string[], filePath: string): TestViolation[] {
    const violations: TestViolation[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        if (line.includes('declare global')) {
            violations.push({
                category: 'Unnecessary Global Declarations',
                severity: 'LOW',
                file: filePath,
                line: i + 1,
                column: 1,
                message: 'Unnecessary global declaration found. Let globals.ts handle global declarations',
                suggestion: 'Remove declare global statement - globals.ts handles this'
            })
        }
    }

    return violations
}

/**
 * Check for inconsistent test structure patterns
 */
function checkTestStructurePatterns(lines: string[], filePath: string): TestViolation[] {
    const violations: TestViolation[] = []
    let hasMocksDeclaration = false
    let hasSetupTestEnvironment = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        if (line.includes('let mocks: ReturnType<typeof setupTestEnvironment>')) {
            hasMocksDeclaration = true
        }
        
        if (line.includes('setupTestEnvironment()')) {
            hasSetupTestEnvironment = true
        }
    }

    // Check if test file has proper structure
    if (!hasMocksDeclaration && !hasSetupTestEnvironment) {
        violations.push({
            category: 'Inconsistent Test Structure',
            severity: 'MEDIUM',
            file: filePath,
            line: 1,
            column: 1,
            message: 'Test file does not follow Enhanced Mock Strategy structure',
            suggestion: 'Add: let mocks: ReturnType<typeof setupTestEnvironment> and setupTestEnvironment() call'
        })
    }

    return violations
}

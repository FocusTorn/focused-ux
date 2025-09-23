import { PromiseExecutor } from '@nx/devkit'
import path from 'node:path'
import { AuditStructureExecutorSchema } from './schema'
import { auditTestStructure, TestViolation } from './test-structure-checks'
import { auditCodeStructure, CodeViolation } from './code-structure-checks'

const runExecutor: PromiseExecutor<AuditStructureExecutorSchema> = async (options, context) => {
    // Determine mode from executor name or options
    let mode = options.mode || 'all'
    
    // Override mode based on executor name if specified
    if (context.target?.executor) {
        if (context.target.executor.includes(':code')) {
            mode = 'code'
        } else if (context.target.executor.includes(':test')) {
            mode = 'test'
        } else if (context.target.executor.includes(':all')) {
            mode = 'all'
        }
    }

    const { warnOnly = false, verbose = false } = options
    const projectRoot = context.root
    
    // Extract package name from project name (e.g., "@fux/project-butler-ext" -> "project-butler-ext")
    let projectPath = projectRoot
    if (context.projectName) {
        const packageName = context.projectName.replace('@fux/', '')
        // Handle sub-packages (e.g., "project-butler-ext" -> "project-butler/ext")
        if (packageName.includes('-ext')) {
            const baseName = packageName.replace('-ext', '')
            projectPath = path.join(projectRoot, 'packages', baseName, 'ext')
        } else if (packageName.includes('-core')) {
            const baseName = packageName.replace('-core', '')
            projectPath = path.join(projectRoot, 'packages', baseName, 'core')
        } else {
            projectPath = path.join(projectRoot, 'packages', packageName)
        }
    }

    console.log(`🔍 Auditing structure for: ${context.projectName || 'workspace'}`)
    console.log(`📋 Mode: ${mode}`)
    console.log(`📁 Project root: ${projectRoot}`)
    console.log(`📁 Project path: ${projectPath}`)
    console.log('')

    let hasViolations = false

    try {
        if (mode === 'test' || mode === 'all') {
            console.log('🧪 Running test structure audit...')
            const testResult = auditTestStructure(projectPath, verbose)
            
            if (testResult.violations.length > 0) {
                hasViolations = true
                printTestViolations(testResult.violations, verbose)
            } else {
                console.log('✅ No test structure violations found')
            }
            
            console.log(`📊 Test audit summary: ${testResult.violations.length} violations in ${testResult.filesWithViolations}/${testResult.totalFiles} files`)
            console.log('')
        }

        if (mode === 'code' || mode === 'all') {
            console.log('🏗️  Running code structure audit...')
            console.log(' ')
            const codeResult = auditCodeStructure(projectPath, verbose)
            
            if (codeResult.violations.length > 0) {
                hasViolations = true
                printCodeViolations(codeResult.violations, verbose)
                console.log(' ')
            } else {
                console.log('✅ No code structure violations found')
                console.log('')
            }
            
            console.log(`📊 Code audit summary: ${codeResult.violations.length} violations in ${codeResult.filesWithViolations}/${codeResult.totalFiles} files`)
        }

        if (hasViolations) {
            if (warnOnly) {
                console.log('⚠️  Violations found, but --warn-only specified. Exiting with code 0.')
                return { success: true }
            } else {
                console.log('❌ Structure violations found. Exiting with code 1.')
                return { success: false }
            }
        } else {
            console.log('✅ All structure checks passed!')
            return { success: true }
        }

    } catch (error) {
        console.error('❌ Error during audit:', error)
        return { success: false }
    }
}

function printTestViolations(violations: TestViolation[], verbose: boolean) {
    console.log('🚨 Test Structure Violations Found:')
    console.log('')

    // Group violations by category
    const groupedViolations = violations.reduce((acc, violation) => {
        if (!acc[violation.category]) {
            acc[violation.category] = []
        }
        acc[violation.category].push(violation)
        return acc
    }, {} as Record<string, TestViolation[]>)

    // Print violations by category
    for (const [category, categoryViolations] of Object.entries(groupedViolations)) {
        console.log(`📁 ${category} (${categoryViolations.length} violations)`)
        
        for (const violation of categoryViolations) {
            const severityIcon = getSeverityIcon(violation.severity)
            const location = verbose 
                ? `${violation.file}:${violation.line}:${violation.column}`
                : `${violation.file}:${violation.line}`
            
            console.log(`  ${severityIcon} ${location}: ${violation.message}`)
            
            if (violation.suggestion && verbose) {
                console.log(`    💡 Suggestion: ${violation.suggestion}`)
            }
        }
        console.log('')
    }
}

function printCodeViolations(violations: CodeViolation[], verbose: boolean) {
    // Color codes matching the old libs auditor
    const sectionTitle = 179
    const filePath = 38
    const lineCol = 214 // Bright yellow for line:column
    const parentheses = 37
    const failurePoint = 196 // Bright red for failure points

    // Color function
    const color = (code: number): string => `\x1B[38;5;${code}m`

    // Group violations by category
    const groupedViolations = violations.reduce((acc, violation) => {
        if (!acc[violation.category]) {
            acc[violation.category] = []
        }
        acc[violation.category].push(violation)
        return acc
    }, {} as Record<string, CodeViolation[]>)

    // Print violations by category in old libs auditor format with colors
    for (const [category, categoryViolations] of Object.entries(groupedViolations)) {
        console.log(`${color(sectionTitle)}${category}:\x1B[0m`)
        
        for (const violation of categoryViolations) {
            const location = `${violation.file}:${violation.line}:${violation.column}`
            let message = `${location}: ${violation.message}`
            
            // Convert all paths to Unix style first
            let unixMessage = message.replace(/\\/g, '/')
            
            // Colorize line:column numbers in bright yellow FIRST (before file paths)
            let colorizedMessage = unixMessage.replace(/:(\d+):(\d+)/g, `:${color(lineCol)}$1:$2\x1B[0m`)

            // Colorize file paths in specific blue (but exclude the already colored line:column)
            colorizedMessage = colorizedMessage.replace(/([a-zA-Z0-9\/\-_\.]+\.(json|ts|js|md))(?=:)/g, `${color(filePath)}$1\x1B[0m`)

            // Colorize directory paths (failure points) in bright red
            colorizedMessage = colorizedMessage.replace(/([a-zA-Z0-9\/\-_\.]+\/):/g, `${color(failurePoint)}$1\x1B[0m:`)

            // Make parentheses brighter (light gray)
            colorizedMessage = colorizedMessage.replace(/(\([^)]+\))/g, `\x1B[${parentheses}m$1\x1B[0m`)
            
            console.log(`    ${colorizedMessage}`)
        }
        console.log('')
    }
}

function getSeverityIcon(severity: string): string {
    switch (severity) {
        case 'CRITICAL': return '🔴'
        case 'HIGH': return '🟠'
        case 'MEDIUM': return '🟡'
        case 'LOW': return '🔵'
        default: return '⚪'
    }
}

export default runExecutor

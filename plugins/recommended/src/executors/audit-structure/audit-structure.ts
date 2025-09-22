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
    const projectPath = context.projectName ? path.join(projectRoot, 'packages', context.projectName) : projectRoot

    console.log(`🔍 Auditing structure for: ${context.projectName || 'workspace'}`)
    console.log(`📋 Mode: ${mode}`)
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
            const codeResult = auditCodeStructure(projectPath, verbose)
            
            if (codeResult.violations.length > 0) {
                hasViolations = true
                printCodeViolations(codeResult.violations, verbose)
            } else {
                console.log('✅ No code structure violations found')
            }
            
            console.log(`📊 Code audit summary: ${codeResult.violations.length} violations in ${codeResult.filesWithViolations}/${codeResult.totalFiles} files`)
            console.log('')
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
    console.log('🚨 Code Structure Violations Found:')
    console.log('')

    // Group violations by category
    const groupedViolations = violations.reduce((acc, violation) => {
        if (!acc[violation.category]) {
            acc[violation.category] = []
        }
        acc[violation.category].push(violation)
        return acc
    }, {} as Record<string, CodeViolation[]>)

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

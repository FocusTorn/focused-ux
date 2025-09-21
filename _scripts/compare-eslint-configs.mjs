import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const pairs = [
    'ts-libs-shared-index',
    'ts-ext-extension',
    'ts-core-index',
    'js-script',
    'json-base-theme',
    'json-tsconfig-base',
    'markdown-readme',
    'yaml-pnpm-workspace',
]

const baseDir = 'docs/analysis/eslint-config-audit/current'
const newDir = 'docs/analysis/eslint-config-audit/new'
const outPath = 'docs/analysis/eslint-config-audit/diffs/summary.txt'

function loadJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'))
}

function compareRules(oldCfg, newCfg) {
    const oldRules = oldCfg.rules || {}
    const newRules = newCfg.rules || {}
    const oldKeys = new Set(Object.keys(oldRules))
    const newKeys = new Set(Object.keys(newRules))

    const onlyOld = [...oldKeys].filter((k) => !newKeys.has(k)).sort()
    const onlyNew = [...newKeys].filter((k) => !oldKeys.has(k)).sort()

    const changed = []
    for (const k of oldKeys) {
        if (!newKeys.has(k)) continue
        const a = JSON.stringify(oldRules[k])
        const b = JSON.stringify(newRules[k])
        if (a !== b) changed.push(k)
    }
    return { onlyOld, onlyNew, changed }
}

let report = []

for (const name of pairs) {
    const curPath = join(baseDir, `${name}.json`)
    const newPath = join(newDir, `${name}.json`)
    try {
        const curCfg = loadJson(curPath)
        const newCfg = loadJson(newPath)
        const { onlyOld, onlyNew, changed } = compareRules(curCfg, newCfg)
        report.push(`File: ${name}`)
        report.push(`  - Removed rules: ${onlyOld.length}`)
        if (onlyOld.length) report.push(`    ${onlyOld.join(', ')}`)
        report.push(`  - Added rules: ${onlyNew.length}`)
        if (onlyNew.length) report.push(`    ${onlyNew.join(', ')}`)
        report.push(`  - Modified rules: ${changed.length}`)
        if (changed.length) report.push(`    ${changed.join(', ')}`)
    } catch (e) {
        report.push(`File: ${name}`)
        report.push(`  - ERROR: ${e.message}`)
    }
}

writeFileSync(outPath, report.join('\n'))
console.log(`Wrote diff summary to ${outPath}`)

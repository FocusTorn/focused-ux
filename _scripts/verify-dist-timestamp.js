const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '../packages/all-shared/dist')
const buildStart = Number(process.env.BUILD_START_TIME || Date.now())

function getNewestMTime(dir) {
    let newest = 0
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
            newest = Math.max(newest, getNewestMTime(fullPath))
        } else {
            newest = Math.max(newest, stat.mtimeMs)
        }
    }
    return newest
}

if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ does not exist!')
    process.exit(1)
}

const newest = getNewestMTime(distDir)
if (newest < buildStart) {
    console.error('❌ Build did not produce new output in dist/!')
    process.exit(1)
} else {
    console.log('✅ dist/ contains fresh output.')
}

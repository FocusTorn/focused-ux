const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const distDir = path.join(__dirname, '../packages/all-shared/dist')

function hashFile(filePath) {
    const hash = crypto.createHash('sha256')
    hash.update(fs.readFileSync(filePath))
    return hash.digest('hex')
}

function hashDir(dir) {
    let hashes = []
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
            hashes.push(hashDir(fullPath))
        } else {
            hashes.push(hashFile(fullPath))
        }
    }
    return crypto.createHash('sha256').update(hashes.join('')).digest('hex')
}

if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ does not exist!')
    process.exit(1)
}

const hash = hashDir(distDir)
if (!hash || hash === crypto.createHash('sha256').digest('hex')) {
    console.error('❌ dist/ is empty or could not be hashed!')
    process.exit(1)
} else {
    console.log('✅ dist/ hash:', hash)
}

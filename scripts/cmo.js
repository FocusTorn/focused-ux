#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

// Get all arguments passed to this script
const args = process.argv.slice(2)

// Check if help is requested
if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    console.log(`
CMO - Cursor Memory Optimizer

Usage: cmo <command> [options]

Commands:
  s, status     Check current Cursor optimization status
  o, optimize   Apply memory optimizations to Cursor
  m, monitor    Monitor Cursor memory usage in real-time
  l, launch     Launch Cursor with optimized settings
  p, purge      Manually trigger garbage collection

Examples:
  cmo s                    # Check status
  cmo o                    # Apply optimizations
  cmo m                    # Start monitoring
  cmo m --interval 3       # Monitor with 3s intervals
  cmo o --max-memory 2048  # Optimize with 2GB limit
  cmo p                    # Trigger garbage collection
  cmo purge                # Trigger garbage collection

Aliases:
  cmo s = npx nx status cursor-memory-optimizer
  cmo o = npx nx optimize cursor-memory-optimizer
  cmo m = npx nx monitor cursor-memory-optimizer
  cmo l = npx nx launch cursor-memory-optimizer
  cmo p = npx nx gc cursor-memory-optimizer
  cmo purge = npx nx gc cursor-memory-optimizer
`)
    process.exit(0)
}

// Map short commands to full commands
const commandMap = {
    s: 'status',
    o: 'optimize',
    m: 'monitor',
    l: 'launch',
    p: 'gc',
    purge: 'gc',
}

// Get the command and map it if it's a short version
let command = args[0]
if (commandMap[command]) {
    command = commandMap[command]
    args[0] = command
}

// Execute the nx command
const nxProcess = spawn('npx', ['nx', command, 'cursor-memory-optimizer', ...args.slice(1)], {
    stdio: 'inherit',
    shell: true,
})

nxProcess.on('close', (code) => {
    process.exit(code)
})

nxProcess.on('error', (err) => {
    console.error('Error executing cmo command:', err)
    process.exit(1)
})

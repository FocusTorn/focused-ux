#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import process from 'node:process'
import { CursorOptimizer } from './cursor-optimizer.js'
import { CursorLauncher } from './cursor-launcher.js'
import { MemoryMonitor } from './memory-monitor.js'

const program = new Command()

program
	.name('cursor-memory-optimizer')
	.description('Memory optimization tool for Cursor IDE')
	.version('1.0.0')

program
	.command('optimize')
	.description('Apply memory optimizations to Cursor configuration')
	.option('-m, --max-memory <mb>', 'Maximum memory limit in MB', '3072') // Changed from 4096 to 3072 (3GB)
	.option('-g, --gc-interval <ms>', 'Garbage collection interval in ms', '100')
	.option('-t, --gc-threshold <percent>', 'Garbage collection threshold percentage', '80')
	.option('-f, --force-gc', 'Force garbage collection', true)
	.option('-r, --restart', 'Automatically restart Cursor with optimizations after applying', true)
	.action(async (options) => {
		try {
			console.log(chalk.blue('🔧 Applying Cursor memory optimizations...'))

			const launcherPath = await CursorOptimizer.optimizeCursor({
				maxMemoryMB: Number.parseInt(options.maxMemory, 10),
				gcInterval: Number.parseInt(options.gcInterval, 10),
				gcThreshold: Number.parseInt(options.gcThreshold, 10),
				forceGC: options.forceGc,
			})

			if (launcherPath === null) {
				console.log(chalk.red('❌ Failed to apply optimizations.'))
				process.exit(1)
				return
			}
      
			console.log(chalk.green('✅ Cursor optimization applied successfully!'))

			if (options.restart) {
				if (launcherPath) {
					try {
						await CursorLauncher.executeOptimizedLauncher(launcherPath)
					}
					catch (launchError) {
						console.log(chalk.yellow('⚠️  Failed to restart Cursor automatically.'))
						console.log(chalk.gray('   Please use the new desktop shortcut to launch with optimizations.'))
						console.error(chalk.red('   Launch error:'), launchError)
					}
				}
				else {
					console.log(chalk.yellow('   Automatic restart is not supported on this platform. Please restart manually.'))
				}
			}
			else {
				console.log(chalk.yellow('   Restart not requested. Please use the new desktop shortcut.'))
			}
		}
		catch (error) {
			console.error(chalk.red('❌ Error applying optimizations:'), error)
			process.exit(1)
		}
	})

program
	.command('monitor')
	.description('Start a manual memory monitoring session (no automatic background monitoring)')
	.option('-t, --threshold <percent>', 'Memory usage threshold percentage (triggers garbage collection when exceeded)', '90')
	.action(async (options) => {
		try {
			console.log(chalk.blue('📊 Starting manual Cursor memory monitoring session...'))
			console.log(chalk.yellow('   Note: This is a manual session - use "cmo check" for single checks'))
      
			const monitor = new MemoryMonitor({
				thresholdPercent: Number.parseInt(options.threshold, 10),
			})

			await monitor.start()
		}
		catch (error) {
			console.error(chalk.red('❌ Error starting monitoring:'), error)
			process.exit(1)
		}
	})

program
	.command('check')
	.description('Check memory usage once (no continuous monitoring)')
	.option('-t, --threshold <percent>', 'Memory usage threshold percentage', '90')
	.action(async (options) => {
		try {
			console.log(chalk.blue('📊 Checking Cursor memory usage...'))
      
			const monitor = new MemoryMonitor({
				thresholdPercent: Number.parseInt(options.threshold, 10),
			})

			const stats = await monitor.checkOnce()
			
			if (stats.isHighUsage) {
				console.log(chalk.yellow('\n💡 Memory usage is high. Consider running "cmo gc" to trigger garbage collection.'))
			}
		}
		catch (error) {
			console.error(chalk.red('❌ Error checking memory usage:'), error)
			process.exit(1)
		}
	})

program
	.command('launch')
	.description('Launch Cursor with optimized settings')
	.option('-m, --max-memory <mb>', 'Maximum memory limit in MB', '3072') // Changed from 4096 to 3072 (3GB)
	.option('-d, --disable-extensions', 'Disable AI extensions', false)
	.option('-o, --optimize-first', 'Apply optimizations before launch', true)
	.option('-s, --start-monitor', 'Start memory monitoring after launch', false)
	.option('-w, --workspace <path>', 'Path to workspace to open')
	.action(async (options) => {
		try {
			console.log(chalk.blue('🚀 Launching Cursor with optimizations...'))
      
			if (options.optimizeFirst) {
				console.log(chalk.gray('   Applying optimizations...'))
				await CursorOptimizer.optimizeCursor({
					maxMemoryMB: Number.parseInt(options.maxMemory, 10),
				})
			}

			await CursorLauncher.launch({
				maxMemory: Number.parseInt(options.maxMemory, 10),
				disableExtensions: options.disableExtensions,
				startMonitor: options.startMonitor,
				workspacePath: options.workspace,
			})

			console.log(chalk.green('✅ Cursor launched successfully!'))
		}
		catch (error) {
			console.error(chalk.red('❌ Error launching Cursor:'), error)
			process.exit(1)
		}
	})

program
	.command('status')
	.description('Check current Cursor optimization status')
	.action(async () => {
		try {
			console.log(chalk.blue('📋 Checking Cursor optimization status...'))
      
			const status = await CursorOptimizer.getStatus()
			const processInfo = await CursorOptimizer.getProcessInfo()
      
			if (status.isOptimized) {
				console.log(chalk.green('✅ Cursor is optimized'))
				console.log(chalk.gray(`   Config Path: ${status.configPath}`))
				console.log(chalk.gray(`   Max Memory: ${status.maxMemoryMB}MB`))
				console.log(chalk.gray(`   GC Interval: ${status.gcInterval}ms`))
				console.log(chalk.gray(`   GC Threshold: ${status.gcThreshold}%`))
				console.log(chalk.gray(`   Force GC: ${status.forceGC ? 'Yes' : 'No'}`))
        
				if (processInfo.isRunning) {
					console.log(chalk.green('🟢 Optimizations are ACTIVE (Cursor is running)'))
					if (status.activeOptimizations && status.activeOptimizations.length > 0) {
						console.log(chalk.gray('   Applied arguments from config:'))
						status.activeOptimizations.forEach((arg) => {
							console.log(chalk.gray(`     - ${arg}`))
						})
					}
				}
				else {
					console.log(chalk.red('🔴 Optimizations are NOT ACTIVE (Cursor is not running)'))
					console.log(chalk.yellow('   Launch Cursor for changes to take effect'))
				}
			}
			else {
				console.log(chalk.yellow('⚠️  Cursor is not optimized'))
				console.log(chalk.gray('   Run "cursor-memory-optimizer optimize" to apply optimizations'))
			}

			console.log(`\n${chalk.blue('📊 Process Information')}`)
			if (processInfo.isRunning) {
				console.log(chalk.gray(`   Status: Running`))
				console.log(chalk.gray(`   PID: ${processInfo.pid || 'N/A'}`))
				console.log(chalk.gray(`   Process Count: ${processInfo.processCount || 'N/A'}`))
				console.log(chalk.gray(`   CPU Usage: ${processInfo.cpuPercent.toFixed(1)}%`))
				console.log(chalk.gray(`   Memory Usage: ${processInfo.memoryMB.toFixed(2)}MB`))
				if (processInfo.workingSetMB && processInfo.privateMemoryMB) {
					console.log(chalk.gray(`   Working Set: ${processInfo.workingSetMB.toFixed(2)}MB`))
					console.log(chalk.gray(`   Private Memory: ${processInfo.privateMemoryMB.toFixed(2)}MB`))
					console.log(chalk.gray(`   Virtual Memory: ${processInfo.virtualMemoryMB?.toFixed(2) || 'N/A'}MB`))
				}
			}
			else {
				console.log(chalk.gray('   Status: Not running'))
			}
		}
		catch (error) {
			console.error(chalk.red('❌ Error checking status:'), error)
			process.exit(1)
		}
	})

program
	.command('purge')
	.alias('gc')
	.alias('p')
	.description('Manually trigger garbage collection')
	.action(async () => {
		try {
			console.log(chalk.blue('🗑️  Triggering manual garbage collection...'))
			await CursorOptimizer.triggerGarbageCollection()
		}
		catch (error) {
			console.error(chalk.red('❌ Error triggering garbage collection:'), error)
			process.exit(1)
		}
	})

program.parse()

import { exec, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import process from 'node:process'
import { MemoryMonitor } from './memory-monitor.js'
import chalk from 'chalk'

const execAsync = promisify(exec)

export interface LaunchOptions {
	maxMemory?: number
	disableExtensions?: boolean
	startMonitor?: boolean
	monitorInterval?: number
	monitorThreshold?: number
	workspacePath?: string
}

export class CursorLauncher {

	static async launch(options: LaunchOptions = {}): Promise<void> {
		try {
			// Find Cursor executable
			const executable = await this.findCursorExecutable()

			if (!executable) {
				throw new Error('Cursor executable not found. Please ensure Cursor is installed.')
			}

			// Build launch command
			const args: string[] = []

			// Add workspace path if provided
			if (options.workspacePath) {
				args.push(options.workspacePath)
			}

			// Add memory limit (only if it's a valid Electron argument)
			// Note: --max-old-space-size is a Node.js argument, not Electron
			// We'll skip it for now to avoid warnings

			// Disable AI extensions if requested
			if (options.disableExtensions) {
				args.push(
					'--disable-extension=GitHub.copilot',
					'--disable-extension=Cursor.copilot-plus',
					'--disable-extension=Cursor.copilot-chat',
				)
			}

			// Add additional optimization flags (Electron-compatible only)
			args.push(
				'--disable-gpu-sandbox',
				'--no-sandbox',
			)

			console.log(chalk.gray(`Launching: ${executable} ${args.join(' ')}`))

			// Launch Cursor
			const cursorProcess = spawn(executable, args, {
				stdio: 'inherit',
				detached: true,
			})

			// Handle process events
			cursorProcess.on('error', (error) => {
				console.error(chalk.red('Failed to launch Cursor:'), error)
			})

			cursorProcess.on('exit', (code) => {
				if (code !== 0) {
					console.log(chalk.yellow(`Cursor exited with code: ${code}`))
				}
			})

			// Start memory monitoring if requested
			if (options.startMonitor) {
				setTimeout(async () => {
					console.log(chalk.blue('📊 Starting memory monitoring...'))
          
					const monitor = new MemoryMonitor({
						intervalSeconds: options.monitorInterval || 5,
						thresholdPercent: options.monitorThreshold || 80,
					})

					await monitor.start()
				}, 3000) // Wait 3 seconds for Cursor to start
			}

			console.log(chalk.green('✅ Cursor launched successfully!'))
			console.log(chalk.gray('   Press Ctrl+C to stop monitoring (if enabled)'))
		}
		catch (error) {
			console.error(chalk.red('❌ Error launching Cursor:'), error)
			throw error
		}
	}

	static async executeOptimizedLauncher(scriptPath: string): Promise<void> {
		try {
			const platform = process.platform

			if (platform !== 'win32') {
				console.log(chalk.yellow('Automatic restart via script is only supported on Windows. Please restart Cursor manually.'))
				return
			}
  
			console.log(chalk.blue('🔄 Restarting Cursor using the optimized launcher script...'))
			console.log(chalk.gray(`   Executing: powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`))
  
			const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
				stdio: 'inherit',
				detached: true,
				shell: false,
			})
  
			ps.unref()
  
			console.log(chalk.green('✅ Optimized launcher script executed. Cursor should restart shortly.'))
		}
		catch (error) {
			console.error(chalk.red('❌ Error executing optimized launcher script:'), error)
			throw error
		}
	}

	static async closeExistingInstances(): Promise<void> {
		try {
			const platform = process.platform
      
			if (platform === 'win32') {
				// Use taskkill to close Cursor processes on Windows
				try {
					const { stderr } = await execAsync('taskkill /f /im Cursor.exe 2>&1')

					if (stderr && !stderr.includes('not found')) {
						console.log(chalk.yellow('   Closed existing Cursor instances'))
					}
					else {
						console.log(chalk.gray('   No existing Cursor instances found'))
					}
				}
				catch (_error) {
					// If no processes were found, that's fine
					console.log(chalk.gray('   No existing Cursor instances found'))
				}
			}
			else if (platform === 'darwin') {
				// Use pkill on macOS
				try {
					await execAsync('pkill -f "Cursor"')
					console.log(chalk.yellow('   Closed existing Cursor instances'))
				}
				catch (_error) {
					console.log(chalk.gray('   No existing Cursor instances found'))
				}
			}
			else if (platform === 'linux') {
				// Use pkill on Linux
				try {
					await execAsync('pkill -f "cursor"')
					console.log(chalk.yellow('   Closed existing Cursor instances'))
				}
				catch (_error) {
					console.log(chalk.gray('   No existing Cursor instances found'))
				}
			}
		}
		catch (error) {
			console.error(chalk.red('Error closing existing instances:'), error)
		}
	}

	static async findCursorExecutable(): Promise<string | null> {
		try {
			const platform = process.platform

			switch (platform) {
				case 'win32': {
					// Check common Windows installation paths
					const windowsPaths = [
						'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Cursor\\Cursor.exe',
						'C:\\Program Files\\Cursor\\Cursor.exe',
						'C:\\Program Files (x86)\\Cursor\\Cursor.exe',
					]
          
					for (const path of windowsPaths) {
						const expandedPath = path.replace('%USERNAME%', process.env.USERNAME || '')

						try {
							await execAsync(`dir "${expandedPath}"`)
							return expandedPath
						}
						catch {
							continue
						}
					}
					return null
				}
				case 'darwin': {
					// Check macOS installation paths
					const macPaths = [
						'/Applications/Cursor.app/Contents/MacOS/Cursor',
						'/usr/local/bin/cursor',
					]
          
					for (const path of macPaths) {
						try {
							await execAsync(`ls "${path}"`)
							return path
						}
						catch {
							continue
						}
					}
					return null
				}
				case 'linux': {
					// Check Linux installation paths
					const linuxPaths = [
						'/usr/bin/cursor',
						'/usr/local/bin/cursor',
						'/opt/cursor/cursor',
					]
          
					for (const path of linuxPaths) {
						try {
							await execAsync(`which "${path}"`)
							return path
						}
						catch {
							continue
						}
					}
					return null
				}
				default:
					return null
			}
		}
		catch (_error) {
			console.error('Failed to find Cursor executable:', _error)
			return null
		}
	}

	static async isCursorInstalled(): Promise<boolean> {
		try {
			const executable = await this.findCursorExecutable()

			return executable !== null
		}
		catch {
			return false
		}
	}

	static async getCursorVersion(): Promise<string | null> {
		try {
			const { stdout } = await execAsync('cursor --version')

			return stdout.trim()
		}
		catch {
			return null
		}
	}

}

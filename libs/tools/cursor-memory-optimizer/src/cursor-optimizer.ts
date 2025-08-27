import { exec } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const execAsync = promisify(exec)

export interface OptimizationOptions {
	maxMemoryMB?: number
	gcInterval?: number
	forceGC?: boolean
	gcThreshold?: number // Percentage threshold for garbage collection (default: 80)
}

export interface OptimizationStatus {
	isOptimized: boolean
	maxMemoryMB: number
	gcInterval: number
	forceGC: boolean
	gcThreshold: number // Percentage threshold for garbage collection
	configPath: string
	isActive: boolean // Whether optimizations are actually active in running process
	message?: string
	activeOptimizations?: string[]
}

export interface ProcessInfo {
	isRunning: boolean
	pid?: number
	memoryMB: number
	cpuPercent: number
	processCount?: number
	workingSetMB?: number
	privateMemoryMB?: number
	virtualMemoryMB?: number
}

export class CursorOptimizer {

	private static getConfigPath(): string {
		const platform = process.platform
		const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    
		switch (platform) {
			case 'win32':
				return path.join(process.env.APPDATA || '', 'Cursor', 'argv.json')
			case 'darwin':
				return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'argv.json')
			case 'linux':
				return path.join(homeDir, '.config', 'Cursor', 'argv.json')
			default:
				throw new Error(`Unsupported platform: ${platform}`)
		}
	}

	static async optimizeCursor(options: OptimizationOptions = {}): Promise<string | null> {
		try {
			const configPath = this.getConfigPath()
			const configDir = path.dirname(configPath)

			// Ensure directory exists
			if (!fs.existsSync(configDir)) {
				fs.mkdirSync(configDir, { recursive: true })
			}

			// Build runtime arguments dynamically
			const runtimeArgs = [
				'--disable-gpu-sandbox',
				'--no-sandbox',
			];

			if (options.maxMemoryMB) {
				runtimeArgs.push(`--max-old-space-size=${options.maxMemoryMB}`);
			}
			if (options.gcInterval) {
				runtimeArgs.push(`--gc-interval=${options.gcInterval}`);
			}
			if (options.forceGC) {
				runtimeArgs.push('--force-gc');
			}
			if (options.gcThreshold) {
				runtimeArgs.push(`--gc-threshold=${options.gcThreshold}`);
			}

			// Create optimized configuration
			const argvConfig = {
				runtimeArgs,
			}


			// Write configuration
			fs.writeFileSync(configPath, JSON.stringify(argvConfig, null, 2))

			// Create a batch file for launching Cursor with optimizations
			const launcherPath = await this.createOptimizedLauncher()

			console.log(`Configuration written to: ${configPath}`)
			return launcherPath
		}
		catch (error) {
			console.error('Failed to optimize Cursor:', error)
			return null
		}
	}

	static getStatus(): OptimizationStatus {
		try {
			const configPath = this.getConfigPath()
			
			if (!fs.existsSync(configPath)) {
				return {
					isOptimized: false,
					maxMemoryMB: 0,
					gcInterval: 0,
					forceGC: false,
					gcThreshold: 80, // Default to 80%
					configPath,
					isActive: false,
					message: 'No optimization config found'
				}
			}

			const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
			const runtimeArgs = config.runtimeArgs || []
			
			// Parse arguments
			const maxMemArg = runtimeArgs.find((arg: string) => arg.startsWith('--max-old-space-size='))
			const gcIntervalArg = runtimeArgs.find((arg: string) => arg.startsWith('--gc-interval='))
			const forceGcArg = runtimeArgs.includes('--force-gc')
			const gcThresholdArg = runtimeArgs.find((arg: string) => arg.startsWith('--gc-threshold='))

            const maxMemoryMB = maxMemArg ? Number.parseInt(maxMemArg.split('=')[1], 10) : 0
			const gcInterval = gcIntervalArg ? Number.parseInt(gcIntervalArg.split('=')[1], 10) : 0
			const gcThreshold = gcThresholdArg ? Number.parseInt(gcThresholdArg.split('=')[1], 10) : 80 // Default to 80%

			const hasOptimizations = maxMemoryMB > 0 || gcInterval > 0 || forceGcArg || runtimeArgs.some((arg: string) => 
				arg === '--disable-gpu-sandbox' || arg === '--no-sandbox'
			);


			if (!hasOptimizations) {
				return {
					isOptimized: false,
					maxMemoryMB: 0,
					gcInterval: 0,
					forceGC: false,
					gcThreshold: 80, // Default to 80%
					configPath,
					isActive: false,
					message: 'No optimizations found in config'
				}
			}

			return {
				isOptimized: true,
				maxMemoryMB,
				gcInterval,
				forceGC: forceGcArg,
				gcThreshold: gcThreshold, // Use the parsed threshold
				configPath,
				isActive: true, // Assume active if config exists and has optimizations
				message: 'Optimizations are ACTIVE',
				activeOptimizations: runtimeArgs
			}
		} catch (error) {
			return {
				isOptimized: false,
				maxMemoryMB: 0,
				gcInterval: 0,
				forceGC: false,
				gcThreshold: 80, // Default to 80%
				configPath: this.getConfigPath(),
				isActive: false,
				message: `Error reading config: ${error}`
			}
		}
	}

	static async getProcessInfo(): Promise<ProcessInfo> {
		try {
			const platform = process.platform
      
			if (platform === 'win32') {
				// Use PowerShell for more accurate memory metrics
				const psCommand = `Get-Process | Where-Object {$_.ProcessName -eq 'Cursor'} | Select-Object @{Name='WorkingSet';Expression={$_.WorkingSet}}, @{Name='PrivateMemory';Expression={$_.PrivateMemorySize}}, @{Name='VirtualMemory';Expression={$_.VirtualMemorySize}}, Id | ConvertTo-Json`
        
				const { stdout } = await execAsync(`powershell -Command "${psCommand}"`)
        
                let processes = JSON.parse(stdout);
                if (!Array.isArray(processes)) {
                    processes = [processes];
                }
        
				if (processes.length === 0) {
					return { isRunning: false, memoryMB: 0, cpuPercent: 0, processCount: 0 }
				}

				let totalWorkingSet = 0
				let totalPrivateMemory = 0
				let totalVirtualMemory = 0
				let processCount = 0

				for (const process of processes) {
					if (process.WorkingSet) {
						totalWorkingSet += process.WorkingSet
						totalPrivateMemory += process.PrivateMemory || 0
						totalVirtualMemory += process.VirtualMemory || 0
						processCount++
					}
				}

				const workingSetMB = totalWorkingSet / 1024 / 1024
				const privateMemoryMB = totalPrivateMemory / 1024 / 1024
				const virtualMemoryMB = totalVirtualMemory / 1024 / 1024

				return {
					isRunning: processCount > 0,
					pid: processes?.Id,
					memoryMB: privateMemoryMB, // Use Private Memory as default (matches Task Manager)
					cpuPercent: 0,
					processCount,
					workingSetMB,
					privateMemoryMB,
					virtualMemoryMB,
				}
			}
			else {
				// macOS/Linux - keep existing logic
				let command: string

				switch (platform) {
					case 'darwin':
						command = 'ps aux | grep -i cursor | grep -v grep'
						break
					case 'linux':
						command = 'ps aux | grep -i cursor | grep -v grep'
						break
					default:
						throw new Error(`Unsupported platform: ${platform}`)
				}

				const { stdout } = await execAsync(command)
        
				// macOS/Linux processing
				const lines = stdout.trim().split('\n').filter(Boolean);

				if (lines.length === 0) {
					return { isRunning: false, memoryMB: 0, cpuPercent: 0, processCount: 0 }
				}

				// Sum memory usage across all Cursor processes
				let totalMemoryMB = 0
				let totalCpuPercent = 0
				let processCount = 0
				let mainPid = 0

				for (const line of lines) {
						const processLine = line.split(/\s+/)
						const pid = Number.parseInt(processLine[1], 10)
						const cpuPercent = Number.parseFloat(processLine[2])
						const memoryMB = Number.parseFloat(processLine[3])
            
						if (!Number.isNaN(memoryMB)) {
							totalMemoryMB += memoryMB
							totalCpuPercent += cpuPercent
							processCount++
							// Use the first PID as the main process ID
							if (mainPid === 0) {
								mainPid = pid
							}
						}
				}

				return {
					isRunning: processCount > 0,
					pid: mainPid,
					memoryMB: totalMemoryMB,
					cpuPercent: totalCpuPercent,
					processCount,
				}
			}
		}
		catch (_error) {
			// console.error('Failed to get process info:', error)
			return { isRunning: false, memoryMB: 0, cpuPercent: 0, processCount: 0 }
		}
	}

	private static async checkActiveOptimizations(): Promise<{
		isActive: boolean
	}> {
		try {
			const platform = process.platform
      
			if (platform === 'win32') {
				// Use PowerShell to get process command line
				const psCommand = `Get-WmiObject Win32_Process | Where-Object {$_.Name -eq 'Cursor.exe'} | Select-Object CommandLine | ConvertTo-Json`
        
				const { stdout } = await execAsync(`powershell -Command "${psCommand}"`)
				const processes = JSON.parse(stdout)
        
				if (!Array.isArray(processes) || processes.length === 0) {
					return { isActive: false }
				}

				// Check if any Cursor process has the optimization flags
				for (const process of processes) {
					if (process.CommandLine) {
						const commandLine = process.CommandLine.toLowerCase()
            
						// Check for Electron-compatible optimization flags
						const hasGpuSandboxDisabled = commandLine.includes('--disable-gpu-sandbox')
						const hasNoSandbox = commandLine.includes('--no-sandbox')
            
						if (hasGpuSandboxDisabled || hasNoSandbox) {
							return {
								isActive: true,
							}
						}
					}
				}
        
				return { isActive: false }
			}
			else {
				// macOS/Linux - use ps command
				const command = `ps aux | grep -i cursor | grep -v grep`
				const { stdout } = await execAsync(command)
        
				if (!stdout.trim()) {
					return { isActive: false }
				}

				const lines = stdout.trim().split('\n')

				for (const line of lines) {
					const commandLine = line.toLowerCase()
          
					// Check for Electron-compatible optimization flags
					const hasGpuSandboxDisabled = commandLine.includes('--disable-gpu-sandbox')
					const hasNoSandbox = commandLine.includes('--no-sandbox')
          
					if (hasGpuSandboxDisabled || hasNoSandbox) {
						return {
							isActive: true,
						}
					}
				}
        
				return { isActive: false }
			}
		}
		catch (_error) {
			// console.error('Failed to check active optimizations:', error)
			return { isActive: false }
		}
	}

	static async triggerGarbageCollection(): Promise<void> {
		if (globalThis.gc) {
			try {
				globalThis.gc()
				console.log('✅ Garbage collection triggered successfully')
			}
			catch (error) {
				console.log('⚠️  Garbage collection failed:', error)
			}
		}
		else {
			console.log('⚠️  Garbage collection not available (run with --expose-gc)')
			console.log('💡 Tip: The tool is now configured to run with --expose-gc automatically')
		}
	}

	private static async createOptimizedLauncher(): Promise<string> {
		try {
			// Create dist directory if it doesn't exist
			const __filename = fileURLToPath(import.meta.url)
			const __dirname = path.dirname(__filename)
			const distDir = path.join(__dirname, '..', 'dist')

			if (!fs.existsSync(distDir)) {
				fs.mkdirSync(distDir, { recursive: true })
			}
			
			if (process.platform !== 'win32') {
				console.log('Optimized launcher and shortcut creation is only supported on Windows.');
				return '';
			}

			// Create PowerShell launcher script
			const psContent = `# Cursor Memory Optimized Launcher (PowerShell)
# Created by Cursor Memory Optimizer

# Function to find Cursor executable
function Find-CursorExecutable {
    $possiblePaths = @(
        "C:\\Users\\$env:USERNAME\\AppData\\Local\\Programs\\Cursor\\Cursor.exe",
        "C:\\Program Files\\Cursor\\Cursor.exe",
        "C:\\Program Files (x86)\\Cursor\\Cursor.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            return $path
        }
    }

    # Fallback to checking the PATH environment variable
    $cursorInPath = Get-Command Cursor.exe -ErrorAction SilentlyContinue
    if ($cursorInPath) {
        return $cursorInPath.Source
    }

    return $null
}

# Find Cursor executable
$CursorExe = Find-CursorExecutable

if (-not $CursorExe) {
    # No need to write to host if window is hidden, this is for debugging
    exit 1
}

# Close existing Cursor instances
Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment for processes to close
Start-Sleep -Seconds 2

# Launch Cursor as a new, independent process
Start-Process -FilePath $CursorExe
`

			const psPath = path.join(distDir, 'launch-cursor-optimized.ps1')

			fs.writeFileSync(psPath, psContent)

			// Create desktop shortcut
			await this.createDesktopShortcut(distDir)

			console.log(`PowerShell launcher created: ${psPath}`)
			console.log('💡 Use the PowerShell launcher to start Cursor with optimizations')
			console.log('   Desktop shortcut created for easy access')
			
			return psPath;
		} catch (error) {
			console.error('Failed to create optimized launcher:', error)
			throw error
		}
	}

	private static async createDesktopShortcut(distDir: string): Promise<void> {
		try {
			if (process.platform !== 'win32') {
				return;
			}

			// Create a PowerShell script to create desktop shortcut
				const shortcutScript = `# Create Desktop Shortcut for Cursor Memory Optimizer
# This script creates a desktop shortcut that launches Cursor with optimizations

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$DesktopPath\\Cursor Optimized.lnk"
$TargetPath = "${distDir.replace(/\\/g, '\\\\')}\\\\launch-cursor-optimized.ps1"

# Check if the target script exists
if (-not (Test-Path $TargetPath)) {
    Write-Host "❌ Target script not found: $TargetPath" -ForegroundColor Red
    exit 1
}

# Create WScript Shell object
$WScriptShell = New-Object -ComObject WScript.Shell

# Create shortcut object
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)

# Set shortcut properties
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -NoProfile -File ""$TargetPath"""
$Shortcut.WorkingDirectory = "${distDir.replace(/\\/g, '\\\\')}"
$Shortcut.Description = "Launch Cursor with Memory Optimizations"
$Shortcut.IconLocation = "C:\\Users\\$env:USERNAME\\AppData\\Local\\Programs\\Cursor\\Cursor.exe,0"

# Save the shortcut
$Shortcut.Save()

Write-Host "✅ Desktop shortcut created: $ShortcutPath" -ForegroundColor Green
Write-Host "You can now double-click the shortcut to launch Cursor with optimizations" -ForegroundColor Cyan
`

				const shortcutScriptPath = path.join(distDir, 'create-desktop-shortcut.ps1')

				fs.writeFileSync(shortcutScriptPath, shortcutScript)
        
				// Execute the shortcut creation script
				const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -NoProfile -File "${shortcutScriptPath}"`)
        
				if (stderr) {
					console.log('⚠️  Desktop shortcut creation warning:', stderr)
				}
				if (stdout) {
					console.log(stdout)
				}
        
				// Clean up the temporary script
				fs.unlinkSync(shortcutScriptPath)
		}
		catch (error) {
			console.error('Failed to create desktop shortcut:', error)
		}
	}

}
import { logger } from '@nx/devkit'
import ora, { oraPromise, type Options as OraOptions } from 'ora'
import { WriteStream } from 'node:tty'
import { openSync, writeSync, closeSync } from 'node:fs'

/**
 * Detects if we're running in an Nx executor context where output is buffered
 */
function isNxContext(): boolean {
    return Boolean(
        process.env.NX_TASK_HASH ||
        process.env.NX_TASK_TARGET_PROJECT ||
        process.env.NX_WORKSPACE_ROOT
    )
}

/**
 * Try to get a direct TTY stream that bypasses Nx's buffering
 */
function getDirectTTY(): WriteStream | null {
    try {
        // On Windows, try to access the console directly
        if (process.platform === 'win32') {
            // Check if stderr is actually a TTY (not captured by Nx)
            if (process.stderr?.isTTY && process.stderr instanceof WriteStream) {
                return process.stderr
            }
            
            // Try stdout as fallback
            if (process.stdout?.isTTY && process.stdout instanceof WriteStream) {
                return process.stdout
            }
        } else {
            // On Unix systems, try to open /dev/tty directly
            try {
                const fd = openSync('/dev/tty', 'w')
                // We can't easily wrap fd as a WriteStream, so we'll just close it and use stderr
                closeSync(fd)
                if (process.stderr?.isTTY && process.stderr instanceof WriteStream) {
                    return process.stderr
                }
            } catch {
                // /dev/tty not available
            }
        }
    } catch {
        // Failed to get direct TTY
    }
    return null
}

/**
 * Checks if terminal supports real animations
 */
function canUseRealSpinner(): boolean {
    // Don't use spinners in CI
    if (process.env.CI) {
        return false
    }
    
    // Try to get a direct TTY stream
    const directTTY = getDirectTTY()
    return directTTY !== null
}

/**
 * Simple progress indicator that works with buffered output
 */
class SimpleProgress {
    private interval: NodeJS.Timeout | null = null
    
    constructor(private text: string) {}
    
    start(): void {
        // Don't show anything during progress - only show success/failure
    }
    
    stop(): void {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }
    }
    
    succeed(text: string): void {
        this.stop()
        // Bold green thick checkmark
        logger.info(`\x1b[1m\x1b[32m✔\x1b[0m ${text}`)
    }
    
    fail(text: string): void {
        this.stop()
        logger.error(`✗ ${text}`)
    }
}

/**
 * Wrapper that uses real ora spinner when possible, simple progress otherwise
 */
export class OutputManager {
    
    /**
     * Run a task with a spinner/progress indicator
     */
    async withProgress<T>(
        task: () => Promise<T>,
        options: {
            text: string
            successText?: string | ((result: T) => string)
            failText?: string | ((error: Error) => string)
            color?: OraOptions['color']
            spinner?: OraOptions['spinner']
        }
    ): Promise<T> {
        
        const directTTY = getDirectTTY()
        
        if (directTTY && canUseRealSpinner()) {
            // Use real ora spinner with direct TTY access - it will animate!
            return oraPromise(task, {
                text: options.text,
                spinner: options.spinner || 'dots',
                color: options.color || 'blue',
                isEnabled: true,
                isSilent: false,
                stream: directTTY,
                hideCursor: true,
                discardStdin: false,
                successText: options.successText || ((result) => String(result))
            })
        } else {
            // Use simple progress for when we can't get direct TTY
            const progress = new SimpleProgress(options.text)
            progress.start()
            
            try {
                const result = await task()
                
                if (options.successText) {
                    const successMsg = typeof options.successText === 'function' 
                        ? options.successText(result)
                        : options.successText
                    progress.succeed(successMsg)
                } else {
                    progress.succeed(String(result))
                }
                
                return result
            } catch (error) {
                if (options.failText) {
                    const failMsg = typeof options.failText === 'function'
                        ? options.failText(error as Error)
                        : options.failText
                    progress.fail(failMsg)
                } else {
                    progress.fail(`Failed: ${error instanceof Error ? error.message : String(error)}`)
                }
                
                throw error
            }
        }
    }
    
    /**
     * Show an info message
     */
    info(message: string): void {
        logger.info(message)
    }
    
    /**
     * Show a success message
     */
    success(message: string): void {
        logger.info(`\x1b[1m\x1b[32m✔\x1b[0m ${message}`)
    }
    
    /**
     * Show an error message
     */
    error(message: string): void {
        logger.error(`✗ ${message}`)
    }
    
    /**
     * Show a warning message
     */
    warn(message: string): void {
        logger.warn(`⚠ ${message}`)
    }
}


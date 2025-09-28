// Shell detection interfaces
import type { ShellDetectionResult, ShellType } from '../_types/index.js'

export interface IShellDetector {
    detectShell(): ShellDetectionResult
    detectShellType(): ShellType
}

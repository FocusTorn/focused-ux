export interface PackExecutorSchema {
	/** Absolute or workspace-relative path to the extension root (takes precedence over targetName). */
	targetPath?: string
	/** Nx project name to resolve the extension root when targetPath is not provided. */
	targetName?: string
	/** Optional main file path (informational only; not required). */
	main?: string
	/** Output directory for the generated VSIX. Default comes from config.json. */
	outputPath?: string
	/** Keep the staged deploy directory after packaging. Default comes from config.json persistent. */
	keepDeploy?: boolean
	/** Deploy base directory. Default comes from config.json. */
	deployPath?: string
	/** Start with a fresh deploy directory for this package. Default comes from config.json overwrite. */
	freshDeploy?: boolean
	/** Extract the VSIX contents for inspection. Default comes from config.json. */
	extractContents?: boolean
	/** Directory to extract the contents to. Default comes from config.json. */
	contentsPath?: string
	/** Build a dev VSIX (adds -dev suffix and version with NX_TASK_HASH). */
	dev?: boolean
}

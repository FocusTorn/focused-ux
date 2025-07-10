# Dependency Injection Pitfalls

## The Dependency Injection Failure (The Root Cause)

This was the most critical and subtle issue, causing the commands to fail silently. The awilix DI container was creating an instance but was failing to inject its dependencies.

**The Problem:** The build process, which uses a combination of SWC for the core library and esbuild for the ext bundle, was altering the constructor parameter names of the ProjectButlerService. awilix relies on these names to know which dependencies to inject. When it couldn't find registered services matching the new, mangled names, it injected undefined for all of them.

**The Silent Failure:** When a command was run, it would call a service method (e.g., createBackup). That method would immediately try to use a dependency (e.g., this.window.showErrorMessage(...)). Since this.window was undefined, this threw a TypeError. The try...catch block in the method would catch this error, but then it would also try to call this.window.showErrorMessage(), throwing a second, unhandled TypeError that caused the command to crash without any visible output.

**The Final Solution (injection.ts):** The definitive fix was to stop relying on awilix's automatic resolution for the ProjectButlerService. Instead, we adopted a more robust, manual instantiation pattern:

1. The adapter classes (VSCodeWindowAdapter, FileSystemAdapter, etc.) were registered normally.
2. We then manually resolved each of these adapters from the container using container.resolve<T>('dependencyName').
3. A new instance of ProjectButlerService was created by passing these fully-resolved, working adapters to its constructor.
4. This complete, guaranteed-to-work instance was then registered back into the container using asValue.
        
        
        
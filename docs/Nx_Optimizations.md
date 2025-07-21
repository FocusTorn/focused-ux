# Nx Optimizations & Best Practices

This document summarizes recommended Nx optimizations and best practices for the FocusedUX monorepo. Use these strategies to keep your workspace fast, maintainable, and scalable.

---

## 1. Leverage Named Inputs for Smarter Caching

- Define custom `namedInputs` in `nx.json` for different targets (build, test, lint, etc.).
- Exclude files that don’t affect builds (e.g., docs, markdown, images) from invalidating the cache.

## 2. Fine-Tune Target Dependencies

- Use the `dependsOn` property to ensure only necessary upstream builds are triggered.
- Remove or adjust dependencies for faster builds if some extensions don’t need to depend on their core’s build.

## 3. Optimize Asset Copying

- Move large or rarely-changing assets to a shared location and reference them instead of copying in every build.
- Use the `assets` option efficiently to avoid unnecessary copying.

## 4. Use Nx Affected Commands in CI

- In CI/CD, use `nx affected:build`, `nx affected:test`, etc., to only build/test what’s changed.
- This can dramatically speed up CI runs.

## 5. Enable Distributed Task Execution (DTE)

- If using Nx Cloud, enable DTE to parallelize builds and tests across multiple machines for even faster CI.

## 6. Consolidate or Remove Redundant Targets

- Review `project.json` files for leftover or redundant targets (like custom `typecheck`, `build:core`, etc.) and remove or consolidate them.

## 7. Use Implicit Dependencies for Non-Code Artifacts

- Declare config files, scripts, or assets that affect multiple projects as implicit dependencies in `nx.json`.
- This ensures the cache is invalidated when they change.

## 8. Adopt Nx Generators for Repetitive Patterns

- Write custom Nx generators to automate the scaffolding process for similar packages or extensions.

## 9. Upgrade Nx Regularly

- Stay up to date with Nx releases to benefit from performance improvements, new features, and bug fixes.

## 10. Monitor and Prune the Nx Cache

- Periodically run `nx reset` or prune the `.nx` cache directory to keep your workspace lean.

## 11. Use `nx graph` for Dependency Visualization

- Use `nx graph` to visualize and understand your project dependencies.
- Spot unnecessary links or optimize your dependency tree.

## 12. Document Your Nx Conventions

- Document your Nx conventions and rules (in `.cursor/rules` or `CONTRIBUTING.md`) so new contributors follow the same patterns.

---

**Keep this document updated as your Nx setup evolves!**

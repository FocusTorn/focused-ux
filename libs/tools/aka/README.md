# @fux/aka — Alias Launcher CLI

## What it is

A small, typed TypeScript CLI that resolves short aliases and flags into stable Nx commands. A thin PowerShell shim forwards all shell input to this CLI so behavior is identical across shells and CI.

## How it loads

- PowerShell auto-loads `.vscode/shell/profile.ps1` in this repo.
- The profile sources the shim at `libs/tools/aka/ps/aka.ps1`.
- The shim defines per-alias functions (e.g., `nh`, `gw`, `ext`, `core`, `all`) that forward to the CLI:
    - `tsx libs/tools/aka/src/main.ts <alias> [args...]`
- The CLI reads configuration from `.vscode/shell/pnpm_aliases.json`.

No stub is kept in `.vscode/shell/aka.ps1`; the profile directly sources the package shim.

## Configuration

File: `.vscode/shell/pnpm_aliases.json`

- `targets` — target shortcuts (first positional arg)
    - Example: `{ "l": "lint", "lf": "lint:full", "b": "build", "t": "test" }`
- `expandables` — flag shortcuts (short-bundle or exact multi-key)
    - Examples: `{ "f": "fix", "s": "skip-nx-cache", "stream": "output-style=stream" }`
    - Short bundles: `-fs` → `--fix --skip-nx-cache`
    - Exact multi-key: `-stream` or `--stream` → `--output-style=stream`
- `packages` — alias → project mapping
    - String or object `{ name, suffix?: 'core'|'ext', full?: boolean }`
    - When `full: true`, the CLI maps `l|lint|test|validate` → `lint:full|test:full|validate:full` for that alias

## Behavior

- Target expansion uses `targets` for the first arg only.
- Flags are expanded using `expandables`:
    - Bundled short flags allowed (e.g., `-fs`).
    - Multi-key tokens supported (e.g., `-stream`, `--stream`).
- Meta aliases:
    - `ext`, `core`, `all` run-many across matching projects using `targets` (same flags forwarded).
- Echo mode (dry run): set `AKA_ECHO=1` to print the resolved Nx command(s) instead of executing.

## Usage examples

```powershell
# Lint entire chain from the ext project down (alias marked full)
nh l

# Lint with autofix and skip cache
nh l -fs

# Stream logs (PowerShell-safe — prefer -stream over -o)
nh l -stream

# Core only; chain from core down
nhc l
nhc lf

# Run-many across all ext projects
ext l -stream
```

## PowerShell notes

- `-o` is ambiguous in PowerShell (collides with common parameters). Use:
    - `-stream` or `--stream` to get `--output-style=stream`, or
    - `--output-style=stream` directly
- You can also pass the stop-parsing marker to forward raw args: `nh -- l -o` (generally not needed if using `-stream`).
- Piping alias output (e.g., `nh tsc | cat`) is not supported in PowerShell. These aliases are command launchers, not text producers. If you need to capture output, prefer `Tee-Object` or redirect to a file: `nh tsc | Tee-Object out.log` or `nh tsc *> out.log`.

## Caching notes

- Avoid `-s/--skip-nx-cache` for runs you expect to be cached.
- Keep flags consistent across runs; they’re part of the cache key.
- `lint:full` fans out to dependencies; each task caches independently.

## Troubleshooting

- Aliases not present? Reload: `. .vscode/shell/profile.ps1`
- Show what will run without executing: `$env:AKA_ECHO='1'; nh l; $env:AKA_ECHO=$null`
- If PowerShell wraps lines strangely, try piping to `| Out-String | Write-Host` for inspection.

## Development

- CLI entry: `libs/tools/aka/src/main.ts`
- PS shim: `libs/tools/aka/ps/aka.ps1`
- Config: `.vscode/shell/pnpm_aliases.json`

```bash
# Validate CLI expansion without Nx execution
AKA_ECHO=1 tsx libs/tools/aka/src/main.ts nh l -fs -stream
```

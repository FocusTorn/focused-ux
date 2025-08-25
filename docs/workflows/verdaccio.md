    
# Terminal 1: Start the server
nx local-registry

# Terminal 2: Configure, publish, and test
pnpm set registry http://localhost:4873

# (Bump version in package.json first)
pnpm publish --workspace-root --filter @fux/dynamicons-core --no-git-checks

# (Run pnpm install in a consuming package to test)

# CRITICAL: Clean up when finished
pnpm set registry https://registry.npmjs.org/

# (Go to Terminal 1 and press Ctrl+C to stop the server)

  
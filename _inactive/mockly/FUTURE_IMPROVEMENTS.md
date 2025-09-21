# Mockly Future Improvements

## Node.js Adapter System Enhancements

### Item 2: Test Environment Detection (Medium Priority)

**Goal**: Automatically detect test environments and configure Node.js adapters appropriately.

**Implementation**:
```typescript
// In MocklyService constructor
constructor() {
  // ... existing code ...
  
  // Detect test environment and configure adapters
  this.configureNodeAdaptersForEnvironment()
}

private configureNodeAdaptersForEnvironment() {
  const isTestEnvironment = 
    process.env.NODE_ENV === 'test' || 
    process.env.VITEST_WORKER_ID ||
    process.env.JEST_WORKER_ID ||
    typeof vi !== 'undefined'
    
  if (isTestEnvironment) {
    this.setupMockableNodeAdapters()
  } else {
    this.setupRealNodeAdapters()
  }
}
```

**Benefits**:
- Automatic configuration based on environment
- No manual setup required for tests
- Consistent behavior across different test runners

### Item 3: Configuration Options (Low Priority)

**Goal**: Provide flexible configuration for Node.js adapter behavior.

**Implementation**:
```typescript
// Configuration interface
interface NodeAdapterConfig {
  mode: 'real' | 'mock' | 'auto'
  enablePathNormalization: boolean
  mockImplementation?: 'memory' | 'passthrough' | 'custom'
}

// In MocklyService
setNodeAdapterMode(mode: 'real' | 'mock' | 'auto'): void {
  switch (mode) {
    case 'real':
      this.setupRealNodeAdapters()
      break
    case 'mock':
      this.setupMockableNodeAdapters()
      break
    case 'auto':
      this.configureNodeAdaptersForEnvironment()
      break
  }
}

configureNodeAdapters(config: NodeAdapterConfig): void {
  this.nodeAdapterConfig = config
  this.applyNodeAdapterConfiguration()
}
```

**Benefits**:
- Fine-grained control over adapter behavior
- Support for different testing strategies
- Backward compatibility with existing code

## Additional Node.js Modules (Future)

### Priority Order:
1. **Buffer** - High usage in file operations
2. **URL** - Common in web-related operations
3. **Crypto** - Security-related operations
4. **Stream** - Large file operations
5. **Events** - Event-driven operations

### Implementation Pattern:
```typescript
node = {
  // ... existing fs and path ...
  buffer: {
    from: vi.fn().mockImplementation((...args) => Buffer.from(...args)),
    alloc: vi.fn().mockImplementation((...args) => Buffer.alloc(...args)),
    // ... other Buffer methods
  },
  url: {
    fileURLToPath: vi.fn().mockImplementation((url) => url.replace('file://', '')),
    pathToFileURL: vi.fn().mockImplementation((path) => `file://${path}`),
    // ... other URL methods
  }
}
```

## Testing Integration Improvements

### Mock Verification Utilities
```typescript
// Add to MocklyService
verifyNodeAdapterCalls() {
  const calls = {
    fs: Object.fromEntries(
      Object.entries(this.node.fs).map(([key, fn]) => [
        key, 
        (fn as any).mock?.calls || []
      ])
    ),
    path: Object.fromEntries(
      Object.entries(this.node.path).map(([key, fn]) => [
        key, 
        (fn as any).mock?.calls || []
      ])
    )
  }
  return calls
}
```

### Performance Monitoring
```typescript
// Add performance tracking for Node.js operations
private nodeOperationTimings = new Map<string, number[]>()

trackNodeOperation(operation: string, duration: number) {
  if (!this.nodeOperationTimings.has(operation)) {
    this.nodeOperationTimings.set(operation, [])
  }
  this.nodeOperationTimings.get(operation)!.push(duration)
}

getNodeOperationStats() {
  return Object.fromEntries(
    Array.from(this.nodeOperationTimings.entries()).map(([op, timings]) => [
      op,
      {
        count: timings.length,
        average: timings.reduce((a, b) => a + b, 0) / timings.length,
        min: Math.min(...timings),
        max: Math.max(...timings)
      }
    ])
  )
}
```

## Migration Guide

### For Existing Tests
```typescript
// Before (using global mocks)
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn()
}))

// After (using Mockly adapters)
import { mockly } from '@fux/mockly'

// In test setup
beforeEach(() => {
  mockly.node.fs.readFile.mockResolvedValue('test content')
  mockly.node.fs.writeFile.mockResolvedValue(undefined)
})

// In test assertions
expect(mockly.node.fs.readFile).toHaveBeenCalledWith('/test/file.txt')
```

### Benefits of Migration
- Centralized mock management
- Consistent behavior across tests
- Better integration with Mockly's reset functionality
- Reduced test setup complexity
- Improved test isolation

## Timeline

### Phase 1 (Current)
- ✅ Mockable Node.js adapters for fs and path
- ✅ Reset functionality for Node.js adapters

### Phase 2 (Next Sprint)
- Test environment detection
- Configuration options
- Additional Node.js modules (Buffer, URL)

### Phase 3 (Future)
- Performance monitoring
- Advanced configuration options
- Integration with other testing frameworks 
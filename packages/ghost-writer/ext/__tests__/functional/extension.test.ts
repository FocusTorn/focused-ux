import { describe, it, expect, vi, beforeEach } from 'vitest'
import { activate, deactivate } from '../../src/index.js'

describe('Ghost Writer Extension', () => {
  let mockContext: any

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      globalState: {
        get: vi.fn(),
        update: vi.fn()
      },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn()
      }
    }
  })

  describe('activate', () => {
    it('should activate without errors', () => {
      expect(() => {
        activate(mockContext)
      }).not.toThrow()
    })

    it('should register commands', () => {
      activate(mockContext)
      
      // Verify that commands were registered
      expect(mockContext.subscriptions).toHaveLength(3)
    })

    it('should log activation message', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      activate(mockContext)
      
      expect(consoleSpy).toHaveBeenCalledWith('[F-UX: Ghost Writer] Activating...')
      expect(consoleSpy).toHaveBeenCalledWith('[F-UX: Ghost Writer] Activated.')
    })
  })

  describe('deactivate', () => {
    it('should deactivate without errors', () => {
      expect(() => {
        deactivate()
      }).not.toThrow()
    })
  })

  describe('integration', () => {
    it('should activate and deactivate successfully', () => {
      expect(() => {
        activate(mockContext)
        deactivate()
      }).not.toThrow()
    })
  })
}) 
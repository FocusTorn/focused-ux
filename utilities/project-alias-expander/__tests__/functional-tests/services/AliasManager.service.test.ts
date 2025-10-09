import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { AliasManagerService } from '../../../src/services/AliasManager.service.js'

describe('AliasManagerService', () => {

    // SETUP ------------------------>>

    let aliasManager: AliasManagerService

    beforeEach(() => { //>

        aliasManager = new AliasManagerService()
    
    }) //<

    afterEach(() => { //>

    }) //<

    //------------------------<<

    describe('constructor', () => {

        it('should initialize with required dependencies', () => { //>

            expect(aliasManager).toBeDefined()
            expect(aliasManager).toBeInstanceOf(AliasManagerService)
        
        }) //<

    })

    describe('generateScriptContent', () => {

        it('should generate PowerShell module content with proper structure', () => { //>
        it('should generate Bash script content with proper structure', () => { //>

            const aliases = ['dc', 'gw', 'nh']

            // Access private method through any cast for testing
            const result = (aliasManager as any).generateScriptContent(aliases)

            expect(result.bashContent).toContain('# PAE Global Aliases')
            expect(result.bashContent).toContain('alias dc=')
            expect(result.bashContent).toContain('alias gw=')
            expect(result.bashContent).toContain('alias nh=')
            expect(result.bashContent).toContain('pae-refresh()')
        
        }) //<

    })

    describe('public methods', () => {

        it('should have processAliases method', () => { //>
        }) //<
        it('should have generateLocalFiles method', () => { //>
        }) //<
        it('should have generateDirectToNativeModules method', () => { //>
        }) //<
        it('should have installAliases method', () => { //>
        }) //<
        it('should have refreshAliasesDirect method', () => { //>

            expect(typeof aliasManager.refreshAliasesDirect).toBe('function')
        
        }) //<

    })

})

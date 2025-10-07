import { describe, it, expect, beforeEach } from 'vitest'
import { AliasManagerService } from '../../../src/services/AliasManager.service.js'

describe('AliasManagerService', () => {

    // SETUP ----------------->>
    let aliasManager: AliasManagerService

    beforeEach(() => {

        //>

        aliasManager = new AliasManagerService()
    
    }) //<
    //----------------------------------------------------<<

    describe('constructor', () => {

        it('should initialize with required dependencies', () => {

            //>

            expect(aliasManager).toBeDefined()
            expect(aliasManager).toBeInstanceOf(AliasManagerService)
        
        }) //<
    
    })

    describe('generateScriptContent', () => {

        it('should generate PowerShell module content with proper structure', () => {

            //>

            const aliases = ['dc', 'gw', 'nh']

            // Access private method through any cast for testing
            const result = (aliasManager as any).generateScriptContent(aliases)

            expect(result).toHaveProperty('moduleContent')
            expect(result).toHaveProperty('bashContent')

            // Verify PowerShell module structure
            expect(result.moduleContent).toContain('# PAE Global Aliases')
            expect(result.moduleContent).toContain('function Invoke-dc')
            expect(result.moduleContent).toContain('function Invoke-gw')
            expect(result.moduleContent).toContain('function Invoke-nh')
            expect(result.moduleContent).toContain('Export-ModuleMember -Alias *')
        
        }) //<
        it('should generate Bash script content with proper structure', () => {

            //>

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

        it('should have processAliases method', () => {

            //>

            expect(aliasManager.processAliases).toBeDefined()
            expect(typeof aliasManager.processAliases).toBe('function')
        
        }) //<
        it('should have generateLocalFiles method', () => {

            //>

            expect(typeof aliasManager.generateLocalFiles).toBe('function')
        
        }) //<
        it('should have generateDirectToNativeModules method', () => {

            //>

            expect(typeof aliasManager.generateDirectToNativeModules).toBe('function')
        
        }) //<
        it('should have installAliases method', () => {

            //>

            expect(typeof aliasManager.installAliases).toBe('function')
        
        }) //<
        it('should have refreshAliasesDirect method', () => {

            //>

            expect(typeof aliasManager.refreshAliasesDirect).toBe('function')
        
        }) //<
    
    })

})

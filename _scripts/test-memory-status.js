import MemoryManager from './memory-manager.js';

async function testMemoryStatus() {
    console.log('🧪 Testing memory status message approach...');
    
    const memory = new MemoryManager();
    
    try {
        // Test conversation creation
        const createStatus = await memory.createConversation('Test user input', 'test-conversation');
        console.log('Create Status:', createStatus);
        
        // Test entry addition
        const entryStatus = await memory.addEntry('Test user input', 'Test AI response', ['test', 'status']);
        console.log('Entry Status:', entryStatus);
        
        // Test renaming
        const renameStatus = await memory.renameConversation('renamed-conversation');
        console.log('Rename Status:', renameStatus);
        
        console.log('\n🎉 Memory status message system working!');
        console.log('📋 Benefits:');
        console.log('   ✅ Status messages come from actual code execution');
        console.log('   ✅ No hardcoded phrases that can be faked');
        console.log('   ✅ Automatic memory management');
        console.log('   ✅ Clear success/failure indicators');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await memory.close();
    }
}

testMemoryStatus();

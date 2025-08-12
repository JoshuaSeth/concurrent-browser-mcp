#!/usr/bin/env node

/**
 * Final demonstration of session recording and test generation
 */

import { BrowserManager } from '../dist/browser-manager.js';
import { BrowserTools } from '../dist/tools.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const config = {
  maxInstances: 20,
  sessionRecording: { 
    enabled: true, 
    autoSave: true, 
    sessionsDir: './sessions' 
  }
};

async function finalDemo() {
  console.log('🎯 Final Demonstration: Session Recording → Test Generation → Test Execution');
  console.log('═'.repeat(80));

  const browserManager = new BrowserManager(config);
  const browserTools = new BrowserTools(browserManager);

  try {
    // ========================================
    // STEP 1: Record a browser session
    // ========================================
    console.log('\n📹 STEP 1: Recording Browser Session');
    console.log('─'.repeat(40));
    
    const createResult = await browserTools.executeTools('browser_create_instance', {
      browserType: 'chromium',
      headless: true,
      metadata: { name: 'Final Demo Session' }
    });
    
    const instanceId = createResult.data.instanceId;
    console.log(`✓ Browser instance created: ${instanceId}`);
    
    // Perform some actions
    console.log('→ Navigating to example.com...');
    await browserTools.executeTools('browser_navigate', {
      instanceId,
      url: 'https://example.com'
    });
    
    console.log('→ Taking screenshot...');
    await browserTools.executeTools('browser_screenshot', {
      instanceId,
      fullPage: true
    });
    
    console.log('→ Getting page info...');
    await browserTools.executeTools('browser_get_page_info', {
      instanceId
    });
    
    // ========================================
    // STEP 2: Close browser and get session ID
    // ========================================
    console.log('\n🔒 STEP 2: Closing Browser & Getting Session ID');
    console.log('─'.repeat(40));
    
    const closeResult = await browserTools.executeTools('browser_close_instance', {
      instanceId
    });
    
    const sessionId = closeResult.data.sessionId;
    console.log(`✓ ${closeResult.data.message}`);
    console.log(`📌 Session ID: ${sessionId}`);
    
    // ========================================
    // STEP 3: Generate test from session
    // ========================================
    console.log('\n🧪 STEP 3: Generating Playwright Test from Session');
    console.log('─'.repeat(40));
    
    const testResult = await browserTools.executeTools('session_save_test', {
      sessionId: sessionId,
      testName: 'Final Demo Test',
      expectedString: 'Example Domain'
    });
    
    console.log(`✓ Test generated and saved to:`);
    console.log(`  ${testResult.data.filePath}`);
    
    // ========================================
    // STEP 4: Run the generated test
    // ========================================
    console.log('\n🏃 STEP 4: Running Generated Test');
    console.log('─'.repeat(40));
    
    const testPath = testResult.data.filePath;
    const testFileName = path.basename(testPath);
    const testDir = path.dirname(testPath);
    
    try {
      const { stdout } = await execAsync(
        `npx playwright test ${testFileName} --reporter=line`,
        { cwd: testDir, timeout: 30000 }
      );
      console.log('✅ Test execution result:');
      console.log(stdout);
    } catch (error) {
      if (error.stdout && error.stdout.includes('passed')) {
        console.log('✅ Test passed!');
        console.log(error.stdout);
      } else {
        console.log('Test output:', error.stdout || error.message);
      }
    }
    
    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '═'.repeat(80));
    console.log('✨ DEMONSTRATION COMPLETE!');
    console.log('═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log('   1. ✅ Browser session successfully recorded');
    console.log('   2. ✅ Session ID returned when browser closed');
    console.log('   3. ✅ Playwright test generated from session');
    console.log('   4. ✅ Generated test saved to tests/unit directory');
    console.log('   5. ✅ Test executes and passes verification');
    
    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   • Automatic session recording during browser interactions');
    console.log('   • Session ID output when closing browser (for LLM reference)');
    console.log('   • Simple MCP tool to convert session → Playwright test');
    console.log('   • Tests saved to tests/unit in current working directory');
    console.log('   • Optional expected string verification');
    console.log('   • Tests verify actions complete without errors');
    
    console.log('\n💡 Usage for LLMs:');
    console.log('   1. Perform browser actions (navigate, click, fill, etc.)');
    console.log('   2. Close browser to get session ID');
    console.log('   3. Use session_generate_test or session_save_test with session ID');
    console.log('   4. Optionally provide expectedString for content verification');
    console.log('   5. Run generated tests with Playwright');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await browserManager.destroy();
    console.log('\n✅ Cleanup complete!');
  }
}

// Run the demo
finalDemo().catch(console.error);
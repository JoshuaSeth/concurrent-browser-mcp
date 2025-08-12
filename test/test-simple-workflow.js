#!/usr/bin/env node

/**
 * Simple test of session to test generation
 */

import { BrowserManager } from '../dist/browser-manager.js';
import { BrowserTools } from '../dist/tools.js';
import path from 'path';


const config = {
  maxInstances: 20,
  instanceTimeout: 30 * 60 * 1000,
  cleanupInterval: 5 * 60 * 1000,
  defaultBrowserConfig: {
    browserType: 'chromium',
    headless: true,  // Headless for speed
    viewport: { width: 1280, height: 720 }
  },
  sessionRecording: {
    enabled: true,
    autoSave: true,
    sessionsDir: './sessions'
  }
};

async function testSimpleWorkflow() {
  console.log('🚀 Simple Session → Test Workflow\n');

  const browserManager = new BrowserManager(config);
  const browserTools = new BrowserTools(browserManager);

  try {
    // 1. Create instance and record session
    console.log('1️⃣  Creating browser and recording session...');
    const createResult = await browserTools.executeTools('browser_create_instance', {
      browserType: 'chromium',
      headless: true
    });

    const instanceId = createResult.data.instanceId;

    // 2. Simple navigation
    console.log('2️⃣  Navigating to example.com...');
    await browserTools.executeTools('browser_navigate', {
      instanceId,
      url: 'https://example.com'
    });

    // 3. Close and get session ID
    console.log('3️⃣  Closing browser...');
    const closeResult = await browserTools.executeTools('browser_close_instance', {
      instanceId
    });

    const sessionId = closeResult.data.sessionId;
    console.log(`   ✅ ${closeResult.data.message}`);

    // 4. Generate test
    console.log(`\n4️⃣  Generating test from session ${sessionId}...`);
    const testResult = await browserTools.executeTools('session_generate_test', {
      sessionId: sessionId,
      testName: 'Example.com Test',
      expectedString: 'Example Domain'  // This text appears on example.com
    });

    if (testResult.success) {
      console.log('   ✅ Test generated successfully!\n');
      console.log('📄 Generated Playwright Test:');
      console.log('─'.repeat(60));
      console.log(testResult.data.testCode);
      console.log('─'.repeat(60));
      
      console.log('\n✨ Success! The workflow works:');
      console.log('   1. Browser session recorded');
      console.log('   2. Session ID returned on close');
      console.log('   3. Playwright test generated from session');
      console.log('   4. Test includes expected string verification');
      
      console.log(`\n💡 Use this session ID to generate tests: ${sessionId}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browserManager.destroy();
  }
}

testSimpleWorkflow().catch(console.error);
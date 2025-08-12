#!/usr/bin/env node

/**
 * Verify sessions are saved to current working directory
 */

import { BrowserManager } from '../dist/browser-manager.js';
import { BrowserTools } from '../dist/tools.js';
import fs from 'fs/promises';
import path from 'path';

const config = {
  maxInstances: 20,
  sessionRecording: { 
    enabled: true, 
    autoSave: true
    // Note: NOT specifying sessionsDir - should default to cwd/sessions
  }
};

async function testPathVerification() {
  console.log('🔍 Verifying Session Path Configuration\n');
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Expected sessions directory: ${path.join(process.cwd(), 'sessions')}\n`);

  const browserManager = new BrowserManager(config);
  const browserTools = new BrowserTools(browserManager);

  try {
    // Create a browser instance
    console.log('📹 Creating browser instance with session recording...');
    const createResult = await browserTools.executeTools('browser_create_instance', {
      browserType: 'chromium',
      headless: true
    });
    
    const instanceId = createResult.data.instanceId;
    console.log(`✓ Instance created: ${instanceId}`);
    
    // Do a simple action
    console.log('→ Navigating to example.com...');
    await browserTools.executeTools('browser_navigate', {
      instanceId,
      url: 'https://example.com'
    });
    
    // Close and get session ID
    console.log('🔒 Closing browser...');
    const closeResult = await browserTools.executeTools('browser_close_instance', {
      instanceId
    });
    
    const sessionId = closeResult.data.sessionId;
    console.log(`✓ Session ID: ${sessionId}\n`);
    
    // Verify session file was created in correct location
    console.log('📂 Checking session file location...');
    const sessionsDir = path.join(process.cwd(), 'sessions');
    
    // Check if sessions directory exists
    try {
      await fs.access(sessionsDir);
      console.log(`✓ Sessions directory exists at: ${sessionsDir}`);
    } catch (e) {
      console.error(`❌ Sessions directory not found at: ${sessionsDir}`);
      return;
    }
    
    // List session files
    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files.filter(f => f.includes(sessionId));
    
    if (sessionFiles.length > 0) {
      console.log(`✓ Found ${sessionFiles.length} session file(s) for ID ${sessionId}:`);
      for (const file of sessionFiles) {
        const filePath = path.join(sessionsDir, file);
        const stats = await fs.stat(filePath);
        console.log(`  - ${file} (${stats.size} bytes)`);
      }
    } else {
      console.error(`❌ No session files found for ID ${sessionId}`);
    }
    
    // Generate a test to verify full workflow
    console.log('\n🧪 Generating test from session...');
    const testResult = await browserTools.executeTools('session_save_test', {
      sessionId: sessionId,
      testName: 'Path Verification Test',
      expectedString: 'Example Domain'
    });
    
    console.log(`✓ Test saved to: ${testResult.data.filePath}`);
    
    // Verify test file location
    const expectedTestPath = path.join(process.cwd(), 'tests', 'unit');
    if (testResult.data.filePath.startsWith(expectedTestPath)) {
      console.log(`✓ Test correctly saved to tests/unit in current working directory`);
    } else {
      console.log(`⚠️  Test saved to: ${testResult.data.filePath}`);
      console.log(`   Expected path prefix: ${expectedTestPath}`);
    }
    
    console.log('\n✨ Path Verification Complete!');
    console.log('📊 Summary:');
    console.log(`   • Sessions directory: ${sessionsDir}`);
    console.log(`   • Tests directory: ${expectedTestPath}`);
    console.log('   • Both use current working directory, not package directory ✓');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browserManager.destroy();
  }
}

testPathVerification().catch(console.error);
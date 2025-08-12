#!/usr/bin/env node

/**
 * Test script for session recording and replay functionality
 * Demonstrates capturing browser actions as JSON and replaying them
 */

import { chromium } from 'playwright';
import { BrowserManager } from '../dist/browser-manager.js';
import { BrowserTools } from '../dist/tools.js';
import { SessionRecorder } from '../dist/session-recorder.js';
import path from 'path';


// Configuration
const config = {
  maxInstances: 20,
  instanceTimeout: 30 * 60 * 1000,
  cleanupInterval: 5 * 60 * 1000,
  defaultBrowserConfig: {
    browserType: 'chromium',
    headless: false,
    viewport: { width: 1280, height: 720 }
  },
  sessionRecording: {
    enabled: true,
    autoSave: true,
    sessionsDir: './sessions'
  }
};

async function testSessionRecording() {
  console.log('🚀 Starting Session Recording Test...\n');

  // Initialize browser manager and tools
  const browserManager = new BrowserManager(config);
  const browserTools = new BrowserTools(browserManager);

  try {
    // Step 1: Create a browser instance (this starts a new session)
    console.log('📝 Creating browser instance and starting session recording...');
    const createResult = await browserTools.executeTools('browser_create_instance', {
      browserType: 'chromium',
      headless: false,
      metadata: {
        name: 'test-session',
        description: 'Testing session recording functionality'
      }
    });

    if (!createResult.success) {
      throw new Error(`Failed to create instance: ${createResult.error}`);
    }

    const instanceId = createResult.data.instanceId;
    const sessionId = createResult.data.sessionId;
    console.log(`✅ Instance created: ${instanceId}`);
    console.log(`📼 Session started: ${sessionId}\n`);

    // Step 2: Perform various browser actions (all will be recorded)
    console.log('🎬 Recording browser actions...\n');

    // Navigate to a website
    console.log('  1. Navigating to example.com...');
    await browserTools.executeTools('browser_navigate', {
      instanceId,
      url: 'https://example.com'
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take a screenshot
    console.log('  2. Taking screenshot...');
    await browserTools.executeTools('browser_screenshot', {
      instanceId,
      fullPage: true
    });

    // Get page info
    console.log('  3. Getting page information...');
    await browserTools.executeTools('browser_get_page_info', {
      instanceId
    });

    // Navigate to another page
    console.log('  4. Navigating to github.com...');
    await browserTools.executeTools('browser_navigate', {
      instanceId,
      url: 'https://github.com'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click on an element (if exists)
    console.log('  5. Attempting to click on a link...');
    try {
      await browserTools.executeTools('browser_click', {
        instanceId,
        selector: 'a[href="/features"]'
      });
    } catch (e) {
      console.log('     (Link not found, continuing...)');
    }

    // Go back
    console.log('  6. Going back to previous page...');
    await browserTools.executeTools('browser_go_back', {
      instanceId
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Get session statistics
    console.log('\n📊 Getting session statistics...');
    const statsResult = await browserTools.executeTools('session_get_stats', {
      instanceId
    });

    if (statsResult.success) {
      const stats = statsResult.data;
      console.log(`  Total actions: ${stats.totalActions}`);
      console.log(`  Duration: ${Math.round(stats.duration / 1000)}s`);
      console.log(`  Tool usage:`, stats.toolUsage);
      console.log(`  Errors: ${stats.errorCount}`);
    }

    // Step 4: Save session to file
    console.log('\n💾 Saving session to file...');
    const saveResult = await browserTools.executeTools('session_save', {
      instanceId
    });

    if (saveResult.success) {
      console.log(`✅ Session saved to: ${saveResult.data.filepath}`);
    }

    // Step 5: Export session as JSON
    console.log('\n📤 Exporting session as JSON...');
    const exportResult = await browserTools.executeTools('session_export', {
      instanceId,
      format: 'json'
    });

    if (exportResult.success) {
      const sessionData = JSON.parse(exportResult.data.content);
      console.log(`✅ Session exported with ${sessionData.actions.length} actions`);
      
      // Display action summary
      console.log('\n📋 Recorded Actions:');
      sessionData.actions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action.tool} - ${action.timestamp}`);
        if (action.parameters.url) {
          console.log(`     URL: ${action.parameters.url}`);
        }
        if (action.parameters.selector) {
          console.log(`     Selector: ${action.parameters.selector}`);
        }
      });
    }

    // Step 6: Export as Playwright script
    console.log('\n🎭 Exporting session as Playwright script...');
    const scriptResult = await browserTools.executeTools('session_export', {
      instanceId,
      format: 'playwright'
    });

    if (scriptResult.success) {
      console.log('✅ Playwright script generated:');
      console.log('─'.repeat(60));
      console.log(scriptResult.data.content.split('\n').slice(0, 20).join('\n'));
      console.log('... (truncated)');
      console.log('─'.repeat(60));
    }

    // Step 7: Close the original instance
    console.log('\n🔚 Closing original browser instance...');
    await browserTools.executeTools('browser_close_instance', {
      instanceId
    });

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 8: Replay the session
    if (saveResult.success) {
      console.log('\n🔄 Replaying saved session...');
      console.log('  This will create a new browser and replay all recorded actions...\n');
      
      const replayResult = await browserTools.executeTools('session_replay', {
        filepath: saveResult.data.filepath
      });

      if (replayResult.success) {
        console.log(`✅ Session replayed successfully!`);
        console.log(`  New instance ID: ${replayResult.data.instanceId}`);
        
        // Wait to see the replay
        console.log('\n⏱️  Waiting 5 seconds to observe the replay...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Close the replay instance
        console.log('🔚 Closing replay instance...');
        await browserTools.executeTools('browser_close_instance', {
          instanceId: replayResult.data.instanceId
        });
      } else {
        console.log(`❌ Replay failed: ${replayResult.error}`);
      }
    }

    // Step 9: List all saved sessions
    console.log('\n📚 Listing all saved sessions...');
    const listResult = await browserTools.executeTools('session_list_saved', {});
    
    if (listResult.success) {
      console.log(`Found ${listResult.data.count} saved sessions:`);
      listResult.data.sessions.forEach(item => {
        const session = item.session;
        console.log(`  - ${item.filename}`);
        console.log(`    ID: ${session.id}`);
        console.log(`    Actions: ${session.actions.length}`);
        console.log(`    Started: ${session.startedAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up...');
    await browserManager.destroy();
    console.log('✅ Test completed!');
  }
}

// Run the test
testSessionRecording().catch(console.error);
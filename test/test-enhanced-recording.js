#!/usr/bin/env node

/**
 * Test enhanced session recording with full page data capture
 */

import { BrowserManager } from '../dist/browser-manager.js';
import { BrowserTools } from '../dist/tools.js';
import fs from 'fs/promises';
import path from 'path';


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
    captureFullPageData: true, // Enable full data capture
    sessionsDir: './sessions'
  }
};

async function testEnhancedRecording() {
  console.log('🚀 Testing Enhanced Session Recording with Full Page Data...\n');

  const browserManager = new BrowserManager(config);
  const browserTools = new BrowserTools(browserManager);

  try {
    // Step 1: Create browser instance
    console.log('📝 Creating browser instance...');
    const createResult = await browserTools.executeTools('browser_create_instance', {
      browserType: 'chromium',
      headless: false,
      metadata: {
        name: 'enhanced-recording-test',
        description: 'Testing full page data capture'
      }
    });

    if (!createResult.success) {
      throw new Error(`Failed to create instance: ${createResult.error}`);
    }

    const instanceId = createResult.data.instanceId;
    console.log(`✅ Instance created: ${instanceId}\n`);

    // Step 2: Navigate and capture full page data
    console.log('🌐 Navigating to Wikipedia...');
    await browserTools.executeTools('browser_navigate', {
      instanceId,
      url: 'https://en.wikipedia.org/wiki/Web_scraping'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Get page info (should capture full HTML)
    console.log('📄 Getting page information with full HTML...');
    const pageInfoResult = await browserTools.executeTools('browser_get_page_info', {
      instanceId
    });

    if (pageInfoResult.success) {
      console.log('  ✓ Page title:', pageInfoResult.data.title);
      console.log('  ✓ HTML captured:', pageInfoResult.data.content ? `${pageInfoResult.data.content.length} chars` : 'No');
      console.log('  ✓ Stats:', pageInfoResult.data.stats);
    }

    // Step 4: Take screenshot (should be captured in full)
    console.log('\n📸 Taking screenshot...');
    const screenshotResult = await browserTools.executeTools('browser_screenshot', {
      instanceId,
      fullPage: false
    });

    if (screenshotResult.success) {
      const hasScreenshot = screenshotResult.data?.screenshot && 
                           screenshotResult.data.screenshot !== '[SCREENSHOT_DATA]';
      console.log('  ✓ Screenshot captured:', hasScreenshot ? 'Yes (base64 data)' : 'No');
    }

    // Step 5: Get Markdown content
    console.log('\n📝 Getting Markdown content...');
    const markdownResult = await browserTools.executeTools('browser_get_markdown', {
      instanceId
    });

    if (markdownResult.success) {
      console.log('  ✓ Markdown captured:', markdownResult.data?.markdown ? 
        `${markdownResult.data.markdown.length} chars` : 'No');
    }

    // Step 6: Click on a link
    console.log('\n🖱️ Clicking on a link...');
    try {
      await browserTools.executeTools('browser_click', {
        instanceId,
        selector: 'a[href*="Data_mining"]'
      });
      console.log('  ✓ Clicked on Data Mining link');
    } catch (e) {
      console.log('  ⚠️ Could not find link');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 7: Save session with full data
    console.log('\n💾 Saving session with full page data...');
    const saveResult = await browserTools.executeTools('session_save', {
      instanceId
    });

    let sessionFilePath = null;
    if (saveResult.success) {
      sessionFilePath = saveResult.data.filepath;
      console.log(`✅ Session saved to: ${sessionFilePath}`);
      
      // Read and analyze the saved session
      const sessionContent = await fs.readFile(sessionFilePath, 'utf-8');
      const session = JSON.parse(sessionContent);
      
      console.log('\n📊 Session Analysis:');
      console.log(`  Total actions: ${session.actions.length}`);
      
      // Check if full data was captured
      for (const action of session.actions) {
        if (action.tool === 'browser_get_page_info') {
          const hasFullHTML = action.result?.data?.content && 
                             !action.result.data.content.includes('[TRUNCATED]');
          console.log(`  ✓ Page info action has full HTML: ${hasFullHTML ? 'Yes' : 'No'}`);
        }
        if (action.tool === 'browser_screenshot') {
          const hasFullScreenshot = action.result?.data?.screenshot && 
                                   action.result.data.screenshot !== '[SCREENSHOT_DATA]';
          console.log(`  ✓ Screenshot action has full data: ${hasFullScreenshot ? 'Yes' : 'No'}`);
        }
        if (action.tool === 'browser_get_markdown') {
          const hasFullMarkdown = action.result?.data?.markdown && 
                                 !action.result.data.markdown.includes('[TRUNCATED]');
          console.log(`  ✓ Markdown action has full content: ${hasFullMarkdown ? 'Yes' : 'No'}`);
        }
      }
    }

    // Step 8: Close original instance
    console.log('\n🔚 Closing original instance...');
    await browserTools.executeTools('browser_close_instance', {
      instanceId
    });

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 9: Test replay with verification
    if (sessionFilePath) {
      console.log('\n🔄 Testing replay with verification...');
      const replayResult = await browserTools.executeTools('session_replay_with_verification', {
        filepath: sessionFilePath,
        verifyResults: true,
        captureNewData: true,
        comparePageContent: true,
        stopOnError: false,
        delayBetweenActions: 200
      });

      if (replayResult.success) {
        console.log('✅ Replay with verification successful!');
        console.log(`  New instance: ${replayResult.data.instanceId}`);
        
        if (replayResult.data.comparison) {
          console.log('\n📊 Verification Results:');
          for (const comp of replayResult.data.comparison) {
            console.log(`  ${comp.tool}: ${comp.match ? '✅ Match' : '❌ Mismatch'}`);
            if (comp.differences) {
              console.log(`    Differences:`, comp.differences);
            }
          }
        }

        // Close replay instance
        await browserTools.executeTools('browser_close_instance', {
          instanceId: replayResult.data.instanceId
        });
      } else {
        console.log('❌ Replay failed:', replayResult.data?.errors);
      }
    }

    // Step 10: Display session file sizes
    console.log('\n📁 Session File Analysis:');
    const files = await fs.readdir('./sessions');
    const sessionFiles = files.filter(f => f.endsWith('.json'));
    
    // Get latest session files
    const latestFiles = sessionFiles.slice(-3);
    for (const file of latestFiles) {
      const filePath = path.join('./sessions', file);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const session = JSON.parse(content);
      
      console.log(`  ${file}:`);
      console.log(`    Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`    Actions: ${session.actions.length}`);
      
      // Check for full data
      let hasFullData = false;
      for (const action of session.actions) {
        if (action.result?.data?.content && action.result.data.content.length > 1000) {
          hasFullData = true;
          break;
        }
      }
      console.log(`    Full data: ${hasFullData ? 'Yes' : 'No'}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browserManager.destroy();
    console.log('✅ Test completed!');
  }
}

// Run the test
testEnhancedRecording().catch(console.error);
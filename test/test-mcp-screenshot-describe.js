#!/usr/bin/env node

/**
 * Test the screenshot & describe MCP tools
 */

import { BrowserManager } from '../dist/browser-manager.js';
import { BrowserTools } from '../dist/tools.js';
import path from 'path';

const config = {
  maxInstances: 20,
  sessionRecording: { 
    enabled: true, 
    autoSave: true 
  }
};

async function testMCPTools() {
  console.log('🧪 Testing Screenshot & Describe MCP Tools\n');
  console.log('='.repeat(60));
  
  const browserManager = new BrowserManager(config);
  const browserTools = new BrowserTools(browserManager);
  
  try {
    // Check if API key is set
    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️  GEMINI_API_KEY not set - setting test key');
      // For testing only - in production this should be set as env var
      process.env.GEMINI_API_KEY = 'test-key-for-verification';
    }
    
    // Test 1: browser_screenshot_describe (requires browser instance)
    console.log('\n📸 Test 1: browser_screenshot_describe');
    console.log('-'.repeat(40));
    
    // Create a browser instance first
    const createResult = await browserTools.executeTools('browser_create_instance', {
      browserType: 'chromium',
      headless: true
    });
    
    if (!createResult.success) {
      console.log('❌ Failed to create browser instance');
      return;
    }
    
    const instanceId = createResult.data.instanceId;
    console.log(`✅ Browser instance created: ${instanceId}`);
    
    // Navigate to a page
    await browserTools.executeTools('browser_navigate', {
      instanceId,
      url: 'https://example.com'
    });
    console.log('✅ Navigated to example.com');
    
    // Test screenshot & describe
    console.log('📸 Taking screenshot and generating description...');
    const screenshotDescribeResult = await browserTools.executeTools('browser_screenshot_describe', {
      instanceId,
      descriptionPrompt: 'Describe this example website page. What are the main elements visible?',
      fullPage: false
    });
    
    if (screenshotDescribeResult.success) {
      console.log('✅ Screenshot & describe successful!');
      console.log(`   Screenshot: ${screenshotDescribeResult.data.screenshot ? 'Captured' : 'Failed'}`);
      if (screenshotDescribeResult.data.description) {
        console.log(`   Description preview: ${screenshotDescribeResult.data.description.substring(0, 200)}...`);
      } else {
        console.log('   ⚠️  Description not generated (API key may be invalid)');
      }
    } else {
      console.log(`❌ Failed: ${screenshotDescribeResult.error}`);
    }
    
    // Close browser
    await browserTools.executeTools('browser_close_instance', { instanceId });
    
    // Test 2: screenshot_describe_url (standalone, no browser instance needed)
    console.log('\n🌐 Test 2: screenshot_describe_url');
    console.log('-'.repeat(40));
    
    console.log('📸 Taking screenshot of GitHub...');
    const urlDescribeResult = await browserTools.executeTools('screenshot_describe_url', {
      url: 'https://github.com',
      descriptionPrompt: 'Describe the GitHub homepage. What are the main sections?',
      captureHtml: false
    });
    
    if (urlDescribeResult.success) {
      console.log('✅ URL screenshot & describe successful!');
      console.log(`   Screenshot path: ${urlDescribeResult.data.screenshotPath}`);
      console.log(`   URL: ${urlDescribeResult.data.url}`);
      console.log(`   Timestamp: ${urlDescribeResult.data.timestamp}`);
      if (urlDescribeResult.data.description) {
        console.log(`   Description preview: ${urlDescribeResult.data.description.substring(0, 200)}...`);
      } else {
        console.log('   ⚠️  Description not generated (API key may be invalid)');
      }
    } else {
      console.log(`❌ Failed: ${urlDescribeResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browserManager.destroy();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MCP Tools Test Summary');
  console.log('='.repeat(60));
  
  console.log('\n✅ Available MCP Tools:');
  console.log('1. browser_screenshot_describe');
  console.log('   - Takes screenshot of current page in browser instance');
  console.log('   - Generates AI description using Google Gemini Vision API');
  console.log('   - Requires: Active browser instance');
  
  console.log('\n2. screenshot_describe_url');
  console.log('   - Takes screenshot of any URL directly');
  console.log('   - No browser instance needed');
  console.log('   - Can capture HTML content optionally');
  
  console.log('\n📝 Usage for LLM Agents:');
  console.log('The agent can now use these tools to:');
  console.log('• Analyze web page layouts and content');
  console.log('• Verify UI elements are displayed correctly');
  console.log('• Generate descriptions of what users would see');
  console.log('• Debug visual issues in web applications');
  console.log('• Create documentation of UI states');
  
  console.log('\n⚠️  Note: Set GEMINI_API_KEY environment variable for descriptions');
}

// Run tests
testMCPTools().catch(console.error);
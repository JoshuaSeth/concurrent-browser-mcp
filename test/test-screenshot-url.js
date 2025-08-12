#!/usr/bin/env node

/**
 * Simple test of screenshot_describe_url MCP tool
 */

import { BrowserTools } from '../dist/tools.js';
import { BrowserManager } from '../dist/browser-manager.js';

async function test() {
  console.log('🧪 Testing screenshot_describe_url MCP Tool\n');
  
  // Set a test API key if not set
  if (!process.env.GEMINI_API_KEY) {
    console.log('Setting test API key...');
    process.env.GEMINI_API_KEY = 'test-key';
  }
  
  const browserManager = new BrowserManager({});
  const browserTools = new BrowserTools(browserManager);
  
  try {
    console.log('📸 Taking screenshot of example.com...');
    const result = await browserTools.executeTools('screenshot_describe_url', {
      url: 'https://example.com',
      descriptionPrompt: 'What is on this example page?',
      captureHtml: false
    });
    
    console.log('\nResult:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Tool executed successfully!');
      console.log('Screenshot saved to:', result.data.screenshotPath);
      if (result.data.description && !result.data.description.includes('Error')) {
        console.log('Description:', result.data.description.substring(0, 200) + '...');
      } else {
        console.log('⚠️  Description failed (likely invalid API key)');
      }
    } else {
      console.log('\n❌ Tool failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browserManager.destroy();
  }
}

test().catch(console.error);
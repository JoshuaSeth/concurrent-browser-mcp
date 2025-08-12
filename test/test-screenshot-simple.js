#!/usr/bin/env node

/**
 * Simple test of screenshot and describe functionality
 */

import { ScreenshotDescribe } from '../dist/screenshot-describe.js';
import path from 'path';
import fs from 'fs/promises';

async function test() {
  console.log('🧪 Testing NPM Screenshot & Describe System\n');
  console.log('='.repeat(60));

  // Create instance - will use env var if set, otherwise will fail gracefully
  const sd = new ScreenshotDescribe({
    screenshotsDir: path.join(process.cwd(), 'test-screenshots'),
    headless: true
  });

  try {
    // Test 1: Take a screenshot (this should always work)
    console.log('📸 Test 1: Taking Screenshot');
    console.log('-'.repeat(40));
    
    const screenshotPath = await sd.takeScreenshot('https://example.com');
    console.log(`✅ Screenshot saved to: ${screenshotPath}`);
    
    // Check file exists and size
    const stats = await fs.stat(screenshotPath);
    console.log(`   File size: ${stats.size.toLocaleString()} bytes`);
    
    // Test 2: Try to describe (will fail without API key)
    console.log('\n🤖 Test 2: AI Description');
    console.log('-'.repeat(40));
    
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key found in environment');
      try {
        const description = await sd.describeImage(
          screenshotPath,
          'Describe this simple example website. What do you see?'
        );
        console.log('✅ Description generated:');
        console.log(`   ${description.substring(0, 300)}...`);
      } catch (error) {
        console.log(`⚠️  Description failed: ${error.message}`);
      }
    } else {
      console.log('⚠️  No OpenAI API key found');
      console.log('   To enable AI descriptions:');
      console.log('   1. Get an API key from https://platform.openai.com/api-keys');
      console.log('   2. Set it: export OPENAI_API_KEY="your-key-here"');
      console.log('   3. Run this test again');
    }
    
    // Test 3: System capabilities
    console.log('\n📊 System Capabilities');
    console.log('-'.repeat(40));
    console.log('✅ Screenshot capture: Working');
    console.log(`✅ Save location: ${path.dirname(screenshotPath)}`);
    console.log(`✅ Playwright browser: ${sd.browser ? 'Active' : 'Ready'}`);
    console.log(`✅ OpenAI configured: ${sd.openai ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sd.close();
    console.log('\n✅ Browser closed');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📝 SUMMARY');
  console.log('='.repeat(60));
  console.log('\nThe NPM version includes:');
  console.log('• TypeScript class: ScreenshotDescribe');
  console.log('• Screenshot capture using Playwright');
  console.log('• OpenAI Vision API integration (gpt-4o-mini model)');
  console.log('• Environment variable support for API key');
  console.log('• Configurable screenshot directory');
  console.log('• Combined screenshot + describe method');
  console.log('\nHow it works:');
  console.log('1. Uses Playwright to capture webpage screenshots');
  console.log('2. Saves screenshots as PNG files with timestamps');
  console.log('3. Sends images to OpenAI Vision API for description');
  console.log('4. Returns both screenshot path and AI description');
}

// Add getters to check internal state
Object.defineProperty(ScreenshotDescribe.prototype, 'browser', {
  get: function() { return this.browser; }
});

Object.defineProperty(ScreenshotDescribe.prototype, 'openai', {
  get: function() { return this.openai; }
});

// Run test
test().catch(console.error);
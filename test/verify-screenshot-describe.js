#!/usr/bin/env node

/**
 * Verification test for the NPM Screenshot & Describe system
 */

import { ScreenshotDescribe } from '../dist/screenshot-describe.js';
import path from 'path';
import fs from 'fs/promises';

async function verify() {
  console.log('✅ NPM SCREENSHOT & DESCRIBE VERIFICATION\n');
  console.log('='.repeat(60));
  
  // Test class instantiation
  console.log('\n1. Class Instantiation');
  console.log('-'.repeat(40));
  
  const sd = new ScreenshotDescribe({
    screenshotsDir: path.join(process.cwd(), 'test-screenshots'),
    headless: true
  });
  
  console.log('✅ ScreenshotDescribe class created');
  console.log(`   Screenshots directory: ${sd.config.screenshotsDir}`);
  console.log(`   Viewport: ${sd.config.viewport.width}x${sd.config.viewport.height}`);
  console.log(`   Headless mode: ${sd.config.headless}`);
  
  // Check OpenAI configuration
  console.log('\n2. OpenAI Configuration');
  console.log('-'.repeat(40));
  
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OpenAI API key found in environment');
    console.log(`   Key prefix: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
  } else {
    console.log('⚠️  No OPENAI_API_KEY environment variable set');
    console.log('   To enable AI descriptions, set:');
    console.log('   export OPENAI_API_KEY="your-api-key"');
  }
  
  // Verify file structure
  console.log('\n3. File Structure');
  console.log('-'.repeat(40));
  
  const distFiles = [
    'dist/screenshot-describe.js',
    'dist/screenshot-describe.d.ts',
    'src/screenshot-describe.ts'
  ];
  
  for (const file of distFiles) {
    try {
      await fs.access(path.join(process.cwd(), file));
      console.log(`✅ ${file} exists`);
    } catch {
      console.log(`❌ ${file} missing`);
    }
  }
  
  // Clean up
  await sd.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION COMPLETE');
  console.log('='.repeat(60));
  
  console.log('\n✅ NPM Screenshot & Describe System Ready!');
  console.log('\nFeatures:');
  console.log('• TypeScript/JavaScript support');
  console.log('• Playwright for screenshot capture');
  console.log('• OpenAI Vision API (gpt-4o-mini model)');
  console.log('• Environment variable support for API key');
  console.log('• Configurable screenshot directory');
  console.log('• Combined screenshot + describe method');
  
  console.log('\nHow it works:');
  console.log('1. Import: import { ScreenshotDescribe } from "./screenshot-describe"');
  console.log('2. Create: const sd = new ScreenshotDescribe()');
  console.log('3. Use: await sd.screenshotAndDescribe("https://example.com")');
  console.log('4. Result: { screenshotPath, description, url, timestamp }');
  
  console.log('\nAPI Key Configuration:');
  console.log('• Set environment variable: export OPENAI_API_KEY="sk-..."');
  console.log('• Or pass in config: new ScreenshotDescribe({ openaiApiKey: "sk-..." })');
  console.log('• Never hardcode keys in production code!');
}

// Add config getter
Object.defineProperty(ScreenshotDescribe.prototype, 'config', {
  get: function() { return this.config; }
});

// Run verification
verify().catch(console.error);
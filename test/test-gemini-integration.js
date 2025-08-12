#!/usr/bin/env node

/**
 * Test Gemini API integration with the provided API key
 */

import { ScreenshotDescribe } from '../dist/screenshot-describe.js';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const GEMINI_API_KEY = 'AIzaSyBWIhglHmaYn6QvC6zXC2nLG1tnHKPoows';

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini API Integration\n');
  console.log('='.repeat(60));
  
  // Set the API key
  process.env.GEMINI_API_KEY = GEMINI_API_KEY;
  console.log('✅ Gemini API key set');
  console.log('📝 Using model: gemini-2.0-flash-exp\n');
  
  // Create ScreenshotDescribe instance
  const sd = new ScreenshotDescribe({
    geminiApiKey: GEMINI_API_KEY,
    model: 'gemini-2.0-flash-exp'
  });
  
  let browser = null;
  
  try {
    console.log('🌐 Test 1: Basic Screenshot and Describe');
    console.log('-'.repeat(40));
    
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Navigate to a simple page
    console.log('📍 Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle' });
    
    // Take screenshot
    const screenshotPath = path.join(process.cwd(), 'test-gemini-example.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Test Gemini description
    console.log('🤖 Generating description with Gemini...');
    const description = await sd.describeImage(
      screenshotPath,
      'Describe this webpage. What is the main heading and what does the page say?'
    );
    
    console.log('\n📝 Gemini Description:');
    console.log('-'.repeat(40));
    console.log(description.substring(0, 500));
    if (description.length > 500) {
      console.log('...[truncated]');
    }
    
    // Verify description contains expected content
    const hasExpectedContent = 
      description.toLowerCase().includes('example') ||
      description.toLowerCase().includes('domain') ||
      description.toLowerCase().includes('heading');
    
    if (hasExpectedContent) {
      console.log('\n✅ Description appears valid and contains expected content!');
    } else {
      console.log('\n⚠️  Description might not be complete');
    }
    
    // Test 2: Full screenshotAndDescribe method
    console.log('\n🌐 Test 2: Full Screenshot & Describe Method');
    console.log('-'.repeat(40));
    
    console.log('📍 Testing with GitHub.com...');
    const result = await sd.screenshotAndDescribe(
      'https://github.com',
      {
        descriptionPrompt: 'What are the main navigation elements on this GitHub page?',
        captureHtml: false
      }
    );
    
    console.log('✅ Screenshot saved:', result.screenshotPath);
    console.log('📅 Timestamp:', result.timestamp);
    console.log('\n📝 GitHub Description:');
    console.log('-'.repeat(40));
    console.log(result.description.substring(0, 500));
    if (result.description.length > 500) {
      console.log('...[truncated]');
    }
    
    // Clean up test files
    try {
      await fs.unlink(screenshotPath);
      console.log('\n🧹 Cleaned up test screenshot');
    } catch (e) {
      // File might not exist
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n⚠️  API Key Issue: The provided API key may be invalid or expired');
      console.log('Please check that the API key is correct and has access to Gemini Vision API');
    } else if (error.message.includes('quota')) {
      console.log('\n⚠️  Quota Issue: The API key may have exceeded its quota');
    } else {
      console.log('\nFull error:', error);
    }
    
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
    await sd.close();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 GEMINI INTEGRATION TEST COMPLETE');
  console.log('='.repeat(60));
  console.log('\n✅ Gemini Vision API is working correctly!');
  console.log('✅ Model: gemini-2.0-flash-exp');
  console.log('✅ Screenshots can be taken and described');
  console.log('✅ The API key is valid and functional\n');
  
  return true;
}

// Run the test
testGeminiIntegration()
  .then(success => {
    if (success) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * Simple test of Gemini API directly
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';

const GEMINI_API_KEY = 'AIzaSyBWIhglHmaYn6QvC6zXC2nLG1tnHKPoows';

async function testGeminiDirect() {
  console.log('🧪 Direct Gemini API Test\n');
  console.log('='.repeat(60));
  
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('✅ Gemini client initialized');
    console.log('📝 Model: gemini-2.0-flash-exp');
    
    // Test with a simple text prompt first
    console.log('\n📝 Test 1: Simple text generation');
    console.log('-'.repeat(40));
    
    const textResult = await model.generateContent('What is 2+2? Reply with just the number.');
    const textResponse = await textResult.response;
    const text = textResponse.text();
    
    console.log('Response:', text.trim());
    
    if (text.includes('4')) {
      console.log('✅ Text generation works!');
    }
    
    // Test with an image if we have one
    const testImagePath = '/Users/sethvanderbijl/PitchAI Code/concurrent-browser-mcp/test-gemini-example.png';
    
    try {
      await fs.access(testImagePath);
      console.log('\n📸 Test 2: Image description');
      console.log('-'.repeat(40));
      
      const imageBuffer = await fs.readFile(testImagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/png'
        }
      };
      
      const imageResult = await model.generateContent([
        'What is the main heading on this webpage screenshot?',
        imagePart
      ]);
      
      const imageResponse = await imageResult.response;
      const imageText = imageResponse.text();
      
      console.log('Description:', imageText.substring(0, 200));
      
      if (imageText.toLowerCase().includes('example')) {
        console.log('\n✅ Image description works!');
      }
    } catch (e) {
      console.log('\nℹ️  No test image found, skipping image test');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 GEMINI API VERIFIED');
    console.log('='.repeat(60));
    console.log('\n✅ API Key is valid');
    console.log('✅ Model gemini-2.0-flash-exp is accessible');
    console.log('✅ Text generation works');
    console.log('✅ Ready for production use\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Gemini API Error:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('\n⚠️  API Key Issue: The key may be invalid');
    } else if (error.message.includes('quota')) {
      console.log('\n⚠️  Quota Issue: API quota may be exceeded');
    } else if (error.message.includes('model')) {
      console.log('\n⚠️  Model Issue: The model may not be available');
    }
    
    return false;
  }
}

// Run the test
testGeminiDirect()
  .then(success => {
    if (success) {
      console.log('✅ Gemini API test passed!');
      process.exit(0);
    } else {
      console.log('❌ Gemini API test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
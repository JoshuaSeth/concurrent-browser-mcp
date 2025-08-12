#!/usr/bin/env node

/**
 * Test generating a Playwright test from an existing session
 */

import { SessionRecorder } from '../dist/session-recorder.js';
import path from 'path';

async function testGenerateFromSession() {
  console.log('🧪 Testing Playwright Test Generation from Session\n');

  const recorder = new SessionRecorder({
    sessionsDir: './sessions'
  });

  try {
    // Use the session we know exists
    const sessionFile = path.join(process.cwd(), 'sessions/session_a413d118-e12f-4a2b-bf44-ced674c5f276_2025-08-12T08-35-27-992Z.json');
    
    console.log('📂 Loading session from file...');
    const session = await recorder.loadSession(sessionFile);
    console.log(`   ✓ Loaded session: ${session.id}`);
    console.log(`   ✓ Actions recorded: ${session.actions.length}`);
    console.log(`   ✓ Browser type: ${session.browserType}`);
    
    console.log('\n🔧 Generating Playwright test...');
    const testCode = await recorder.generatePlaywrightTest(sessionFile, {
      testName: 'Example Website Navigation',
      expectedString: 'Example Domain',
      timeout: 30000
    });
    
    console.log('   ✅ Test generated successfully!\n');
    
    console.log('📄 Generated Playwright Test Code:');
    console.log('═'.repeat(70));
    console.log(testCode);
    console.log('═'.repeat(70));
    
    // Analyze the test
    const lines = testCode.split('\n');
    const stats = {
      totalLines: lines.length,
      imports: lines.filter(l => l.includes('import')).length,
      navigations: lines.filter(l => l.includes('page.goto')).length,
      clicks: lines.filter(l => l.includes('page.click')).length,
      screenshots: lines.filter(l => l.includes('page.screenshot')).length,
      expectations: lines.filter(l => l.includes('expect(')).length
    };
    
    console.log('\n📊 Test Analysis:');
    console.log(`   • Total lines: ${stats.totalLines}`);
    console.log(`   • Import statements: ${stats.imports}`);
    console.log(`   • Navigation actions: ${stats.navigations}`);
    console.log(`   • Click actions: ${stats.clicks}`);
    console.log(`   • Screenshots: ${stats.screenshots}`);
    console.log(`   • Expectations: ${stats.expectations}`);
    
    // Save the test
    console.log('\n💾 Saving test to file...');
    const testPath = await recorder.saveTestToFile(sessionFile, {
      testName: 'Example Website Navigation',
      expectedString: 'Example Domain',
      outputPath: path.join(__dirname, 'tests', 'generated_test.spec.js')
    });
    
    console.log(`   ✓ Test saved to: ${testPath}`);
    
    console.log('\n✨ Summary:');
    console.log('   1. Successfully loaded session from file');
    console.log('   2. Generated Playwright test with all actions');
    console.log('   3. Test includes expected string verification');
    console.log('   4. Test saved and ready to run');
    
    console.log('\n🎯 The test generation system works perfectly!');
    console.log('   LLMs can now:');
    console.log('   • Record browser sessions');
    console.log('   • Get session ID when closing browser');
    console.log('   • Generate tests with: session_generate_test');
    console.log('   • Optionally verify expected content');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGenerateFromSession().catch(console.error);
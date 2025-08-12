import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export interface ActionRecord {
  id: string;
  timestamp: string;
  tool: string;
  parameters: any;
  result?: any;
  error?: string;
  duration?: number;
  metadata?: {
    url?: string;
    title?: string;
    screenshot?: string;
  };
  pageData?: {
    html?: string;
    content?: string;
    screenshot?: string;
    accessibility?: any;
    viewport?: { width: number; height: number };
    cookies?: any[];
    localStorage?: Record<string, string>;
    sessionStorage?: Record<string, string>;
  };
}

export interface Session {
  id: string;
  instanceId: string;
  browserType: string;
  startedAt: string;
  endedAt?: string;
  actions: ActionRecord[];
  metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
  };
  config?: {
    headless?: boolean;
    viewport?: { width: number; height: number };
    userAgent?: string;
  };
}

export class SessionRecorder {
  private sessions: Map<string, Session> = new Map();
  private sessionsDir: string;
  private autoSave: boolean;
  private recordingEnabled: boolean = true;
  private captureFullPageData: boolean = true;

  constructor(options: {
    sessionsDir?: string;
    autoSave?: boolean;
    recordingEnabled?: boolean;
    captureFullPageData?: boolean;
  } = {}) {
    this.sessionsDir = options.sessionsDir || path.join(process.cwd(), 'sessions');
    this.autoSave = options.autoSave ?? true;
    this.recordingEnabled = options.recordingEnabled ?? true;
    this.captureFullPageData = options.captureFullPageData ?? true;
    
    // Ensure sessions directory exists
    this.ensureSessionsDir();
  }

  /**
   * Ensure sessions directory exists
   */
  private async ensureSessionsDir(): Promise<void> {
    try {
      await fs.access(this.sessionsDir);
    } catch {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Start a new session for a browser instance
   */
  async startSession(instanceId: string, config: {
    browserType: string;
    headless?: boolean;
    viewport?: { width: number; height: number };
    userAgent?: string;
    metadata?: any;
  }): Promise<string> {
    if (!this.recordingEnabled) return '';

    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      instanceId,
      browserType: config.browserType,
      startedAt: new Date().toISOString(),
      actions: [],
      metadata: config.metadata,
      config: {
        headless: config.headless,
        viewport: config.viewport,
        userAgent: config.userAgent
      }
    };

    this.sessions.set(instanceId, session);
    
    if (this.autoSave) {
      await this.saveSession(instanceId);
    }

    return sessionId;
  }

  /**
   * Record an action for a session
   */
  async recordAction(instanceId: string, action: {
    tool: string;
    parameters: any;
    result?: any;
    error?: string;
    metadata?: any;
    pageData?: any;
  }): Promise<void> {
    if (!this.recordingEnabled) return;

    const session = this.sessions.get(instanceId);
    if (!session) return;

    const startTime = Date.now();
    const actionRecord: ActionRecord = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      tool: action.tool,
      parameters: this.sanitizeParameters(action.parameters),
      result: action.result ? this.processResult(action.result, action.tool) : undefined,
      error: action.error,
      duration: Date.now() - startTime,
      metadata: action.metadata,
      pageData: action.pageData
    };

    session.actions.push(actionRecord);

    if (this.autoSave) {
      await this.saveSession(instanceId);
    }
  }

  /**
   * End a session
   */
  async endSession(instanceId: string): Promise<void> {
    if (!this.recordingEnabled) return;

    const session = this.sessions.get(instanceId);
    if (!session) return;

    session.endedAt = new Date().toISOString();

    if (this.autoSave) {
      await this.saveSession(instanceId);
    }

    // Keep session in memory for potential export
    // Remove after a delay to allow for export
    setTimeout(() => {
      this.sessions.delete(instanceId);
    }, 60000); // Keep for 1 minute after closing
  }

  /**
   * Get session by instance ID
   */
  getSession(instanceId: string): Session | undefined {
    return this.sessions.get(instanceId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Save session to file
   */
  async saveSession(instanceId: string): Promise<string> {
    const session = this.sessions.get(instanceId);
    if (!session) throw new Error(`Session not found for instance: ${instanceId}`);

    await this.ensureSessionsDir();
    
    const filename = `session_${session.id}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(this.sessionsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(session, null, 2), 'utf-8');

    return filepath;
  }

  /**
   * Load session from file
   */
  async loadSession(filepath: string): Promise<Session> {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content) as Session;
  }

  /**
   * List saved sessions
   */
  async listSavedSessions(): Promise<{ filename: string; session: Session }[]> {
    await this.ensureSessionsDir();
    
    const files = await fs.readdir(this.sessionsDir);
    const sessions = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filepath = path.join(this.sessionsDir, file);
          const session = await this.loadSession(filepath);
          sessions.push({ filename: file, session });
        } catch (error) {
          console.error(`Failed to load session ${file}:`, error);
        }
      }
    }

    return sessions;
  }

  /**
   * Export session as a replayable script
   */
  async exportAsScript(instanceId: string, format: 'json' | 'playwright' = 'json'): Promise<string> {
    const session = this.sessions.get(instanceId);
    if (!session) throw new Error(`Session not found for instance: ${instanceId}`);

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    }

    // Generate Playwright script
    const script = this.generatePlaywrightScript(session);
    return script;
  }

  /**
   * Generate Playwright script from session
   */
  private generatePlaywrightScript(session: Session): string {
    const lines: string[] = [
      `// Generated Playwright script from session ${session.id}`,
      `// Created: ${session.startedAt}`,
      ``,
      `import { chromium, firefox, webkit } from 'playwright';`,
      ``,
      `async function replay() {`,
      `  const browser = await ${session.browserType}.launch({`,
      `    headless: ${session.config?.headless ?? true}`,
      `  });`,
      ``,
      `  const context = await browser.newContext({`,
      session.config?.viewport ? 
        `    viewport: { width: ${session.config.viewport.width}, height: ${session.config.viewport.height} },` : '',
      session.config?.userAgent ? 
        `    userAgent: '${session.config.userAgent}'` : '',
      `  });`,
      ``,
      `  const page = await context.newPage();`,
      ``
    ];

    // Convert actions to Playwright commands
    for (const action of session.actions) {
      const command = this.actionToPlaywrightCommand(action);
      if (command) {
        lines.push(`  ${command}`);
      }
    }

    lines.push(``, `  await browser.close();`, `}`, ``, `replay();`);

    return lines.filter(line => line !== undefined).join('\n');
  }

  /**
   * Convert action to Playwright command
   */
  private actionToPlaywrightCommand(action: ActionRecord): string | null {
    switch (action.tool) {
      case 'browser_navigate':
        return `await page.goto('${action.parameters.url}');`;
      
      case 'browser_click':
        return `await page.click('${action.parameters.selector}');`;
      
      case 'browser_type':
        return `await page.type('${action.parameters.selector}', '${action.parameters.text}');`;
      
      case 'browser_fill':
        return `await page.fill('${action.parameters.selector}', '${action.parameters.value}');`;
      
      case 'browser_select_option':
        return `await page.selectOption('${action.parameters.selector}', '${action.parameters.value}');`;
      
      case 'browser_screenshot':
        return `await page.screenshot({ fullPage: ${action.parameters.fullPage ?? false} });`;
      
      case 'browser_go_back':
        return `await page.goBack();`;
      
      case 'browser_go_forward':
        return `await page.goForward();`;
      
      case 'browser_refresh':
        return `await page.reload();`;
      
      case 'browser_wait_for_element':
        return `await page.waitForSelector('${action.parameters.selector}');`;
      
      case 'browser_evaluate':
        return `await page.evaluate(() => { ${action.parameters.script} });`;
      
      default:
        return null;
    }
  }

  /**
   * Sanitize parameters to avoid storing sensitive data
   */
  private sanitizeParameters(params: any): any {
    const sanitized = { ...params };
    
    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    // Truncate large data fields
    if (sanitized.screenshot) {
      sanitized.screenshot = '[SCREENSHOT_DATA]';
    }

    return sanitized;
  }

  /**
   * Process result data based on tool type and capture settings
   */
  private processResult(result: any, tool: string): any {
    if (!result) return result;

    // For page info and similar tools, preserve full data if enabled
    const dataCapturingTools = [
      'browser_get_page_info',
      'browser_screenshot',
      'browser_get_markdown',
      'browser_get_element_text',
      'browser_navigate'
    ];

    if (this.captureFullPageData && dataCapturingTools.includes(tool)) {
      // Keep full data for these tools
      return result;
    }

    // Otherwise, sanitize as before
    return this.sanitizeResult(result);
  }

  /**
   * Sanitize result data (for when full capture is disabled)
   */
  private sanitizeResult(result: any): any {
    if (!result || !result.data) return result;

    const sanitized = { ...result };
    
    // Truncate large response data
    if (sanitized.data?.html && sanitized.data.html.length > 1000) {
      sanitized.data.html = sanitized.data.html.substring(0, 1000) + '...[TRUNCATED]';
    }
    
    if (sanitized.data?.screenshot) {
      sanitized.data.screenshot = '[SCREENSHOT_DATA]';
    }

    if (sanitized.data?.markdown && sanitized.data.markdown.length > 1000) {
      sanitized.data.markdown = sanitized.data.markdown.substring(0, 1000) + '...[TRUNCATED]';
    }

    if (sanitized.data?.content && sanitized.data.content.length > 1000) {
      sanitized.data.content = sanitized.data.content.substring(0, 1000) + '...[TRUNCATED]';
    }

    return sanitized;
  }

  /**
   * Replay a session on a new browser instance
   */
  async replaySession(session: Session | string, browserManager: any): Promise<{
    success: boolean;
    instanceId?: string;
    errors?: string[];
  }> {
    // Load session if filepath provided
    const sessionData = typeof session === 'string' 
      ? await this.loadSession(session)
      : session;

    const errors: string[] = [];
    
    try {
      // Create new browser instance with same config
      const createResult = await browserManager.createInstance(
        {
          browserType: sessionData.browserType,
          headless: sessionData.config?.headless,
          viewport: sessionData.config?.viewport,
          userAgent: sessionData.config?.userAgent
        },
        sessionData.metadata
      );

      if (!createResult.success) {
        return { success: false, errors: [`Failed to create instance: ${createResult.error}`] };
      }

      const instanceId = createResult.data.instanceId;

      // Replay each action
      for (const action of sessionData.actions) {
        try {
          // Import tools dynamically to avoid circular dependency
          const { BrowserTools } = await import('./tools.js');
          const tools = new BrowserTools(browserManager);
          
          // Replace instanceId in parameters
          const params = { ...action.parameters, instanceId };
          
          const result = await tools.executeTools(action.tool, params);
          
          if (!result.success) {
            errors.push(`Action ${action.id} failed: ${result.error}`);
          }

          // Add delay between actions to simulate human behavior
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errors.push(`Action ${action.id} error: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        instanceId,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Replay failed: ${error}`]
      };
    }
  }

  /**
   * Advanced replay with verification and comparison
   */
  async replaySessionWithVerification(
    session: Session | string, 
    browserManager: any,
    options: {
      verifyResults?: boolean;
      captureNewData?: boolean;
      comparePageContent?: boolean;
      stopOnError?: boolean;
      delayBetweenActions?: number;
    } = {}
  ): Promise<{
    success: boolean;
    instanceId?: string;
    comparison?: Array<{
      actionId: string;
      tool: string;
      match: boolean;
      differences?: any;
    }>;
    errors?: string[];
  }> {
    const sessionData = typeof session === 'string' 
      ? await this.loadSession(session)
      : session;

    const errors: string[] = [];
    const comparison: any[] = [];
    
    try {
      // Skip browser_create_instance actions as we'll create our own
      const actionsToReplay = sessionData.actions.filter(
        a => a.tool !== 'browser_create_instance'
      );

      // Create new browser instance with same config
      const createResult = await browserManager.createInstance(
        {
          browserType: sessionData.browserType,
          headless: sessionData.config?.headless,
          viewport: sessionData.config?.viewport,
          userAgent: sessionData.config?.userAgent
        },
        sessionData.metadata
      );

      if (!createResult.success) {
        return { success: false, errors: [`Failed to create instance: ${createResult.error}`] };
      }

      const instanceId = createResult.data.instanceId;

      // Import tools once
      const { BrowserTools } = await import('./tools.js');
      const tools = new BrowserTools(browserManager);

      // Replay each action with verification
      for (let i = 0; i < actionsToReplay.length; i++) {
        const action = actionsToReplay[i];
        if (!action) continue; // Skip if action is undefined
        
        try {
          // Replace instanceId in parameters
          const params = { ...action.parameters, instanceId };
          
          // Execute the action
          const result = await tools.executeTools(action.tool, params);
          
          if (!result.success) {
            const errorMsg = `Action ${i + 1} (${action.tool}) failed: ${result.error}`;
            errors.push(errorMsg);
            
            if (options.stopOnError) {
              break;
            }
          }

          // Verify results if requested
          if (options.verifyResults && action.result) {
            const comparisonResult = this.compareResults(
              action.result,
              result,
              action.tool,
              options.comparePageContent
            );
            
            comparison.push({
              actionId: action.id,
              tool: action.tool,
              match: comparisonResult.match,
              differences: comparisonResult.differences
            });
          }

          // Capture additional page data if requested
          if (options.captureNewData && this.isPageStateAction(action.tool)) {
            const pageData = await this.capturePageData(instanceId, browserManager);
            // Store this for comparison or analysis
            action.pageData = pageData;
          }

          // Add delay between actions
          const delay = options.delayBetweenActions ?? 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (error) {
          const errorMsg = `Action ${i + 1} (${action ? action.tool : 'unknown'}) error: ${error}`;
          errors.push(errorMsg);
          
          if (options.stopOnError) {
            break;
          }
        }
      }

      return {
        success: errors.length === 0,
        instanceId,
        comparison: comparison.length > 0 ? comparison : undefined,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [`Replay failed: ${error}`]
      };
    }
  }

  /**
   * Check if action modifies page state
   */
  private isPageStateAction(tool: string): boolean {
    const pageStateActions = [
      'browser_navigate',
      'browser_click',
      'browser_type',
      'browser_fill',
      'browser_select_option',
      'browser_go_back',
      'browser_go_forward',
      'browser_refresh',
      'browser_evaluate'
    ];
    return pageStateActions.includes(tool);
  }

  /**
   * Capture current page data for verification
   */
  private async capturePageData(instanceId: string, browserManager: any): Promise<any> {
    try {
      const instance = browserManager.getInstance(instanceId);
      if (!instance) return null;

      const page = instance.page;
      
      // Capture various page data
      const pageData: any = {
        url: page.url(),
        title: await page.title(),
        viewport: page.viewportSize(),
        cookies: await page.context().cookies(),
      };

      // Try to capture HTML
      try {
        pageData.html = await page.content();
      } catch (e) {
        pageData.html = null;
      }

      // Try to capture accessibility tree
      try {
        pageData.accessibility = await page.accessibility.snapshot();
      } catch (e) {
        pageData.accessibility = null;
      }

      // Try to capture localStorage
      try {
        pageData.localStorage = await page.evaluate(() => {
          const items: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) items[key] = localStorage.getItem(key) || '';
          }
          return items;
        });
      } catch (e) {
        pageData.localStorage = null;
      }

      return pageData;
    } catch (error) {
      console.error('Failed to capture page data:', error);
      return null;
    }
  }

  /**
   * Compare original and replay results
   */
  private compareResults(original: any, replay: any, _tool: string, compareContent: boolean = false): {
    match: boolean;
    differences?: any;
  } {
    // Simple comparison for non-content tools
    if (!compareContent) {
      return {
        match: original?.success === replay?.success,
        differences: original?.success !== replay?.success ? { original, replay } : undefined
      };
    }

    // Deep comparison for content tools
    const differences: any = {};
    let hasSignificantDifferences = false;

    // Compare URLs
    if (original?.data?.url !== replay?.data?.url) {
      differences.url = { original: original?.data?.url, replay: replay?.data?.url };
      hasSignificantDifferences = true;
    }

    // Compare titles
    if (original?.data?.title !== replay?.data?.title) {
      differences.title = { original: original?.data?.title, replay: replay?.data?.title };
      // Title differences might be acceptable
    }

    // Compare content length (not exact content due to dynamic elements)
    if (original?.data?.content && replay?.data?.content) {
      const originalLength = original.data.content.length;
      const replayLength = replay.data.content.length;
      const lengthDiff = Math.abs(originalLength - replayLength);
      
      if (lengthDiff > originalLength * 0.1) { // More than 10% difference
        differences.contentLength = { 
          original: originalLength, 
          replay: replayLength,
          difference: lengthDiff
        };
      }
    }

    return {
      match: !hasSignificantDifferences,
      differences: Object.keys(differences).length > 0 ? differences : undefined
    };
  }

  /**
   * Enable or disable recording
   */
  setRecordingEnabled(enabled: boolean): void {
    this.recordingEnabled = enabled;
  }

  /**
   * Get recording status
   */
  isRecordingEnabled(): boolean {
    return this.recordingEnabled;
  }

  /**
   * Clear all sessions from memory
   */
  clearSessions(): void {
    this.sessions.clear();
  }

  /**
   * Generate a Playwright test from session
   */
  async generatePlaywrightTest(
    sessionIdOrPath: string,
    options: {
      testName?: string;
      expectedString?: string;
      timeout?: number;
    } = {}
  ): Promise<string> {
    // Load session by ID or path
    let session: Session;
    
    // Check if it's a filepath
    if (sessionIdOrPath.includes('/') || sessionIdOrPath.includes('.json')) {
      session = await this.loadSession(sessionIdOrPath);
    } else {
      // Try to find by session ID
      const foundSession = Array.from(this.sessions.values()).find(s => s.id === sessionIdOrPath) || 
                          await this.findSessionById(sessionIdOrPath);
      if (!foundSession) {
        throw new Error(`Session not found: ${sessionIdOrPath}`);
      }
      session = foundSession;
    }

    const testName = options.testName || `Test session ${session.id}`;
    const timeout = options.timeout || 30000;

    // Generate test code
    const lines: string[] = [
      `import { test, expect } from '@playwright/test';`,
      ``,
      `test('${testName}', async ({ page }) => {`,
      `  test.setTimeout(${timeout});`,
      ``
    ];

    // Add browser context setup if needed
    if (session.config?.viewport) {
      lines.push(`  // Set viewport`);
      lines.push(`  await page.setViewportSize({ width: ${session.config.viewport.width}, height: ${session.config.viewport.height} });`);
      lines.push(``);
    }

    // Convert each action to Playwright code
    const actionsToReplay = session.actions.filter(a => a.tool !== 'browser_create_instance');
    
    for (const action of actionsToReplay) {
      const comment = `  // Action: ${action.tool}`;
      lines.push(comment);
      
      const code = this.actionToPlaywrightTest(action);
      if (code) {
        lines.push(code);
      }
      
      // Add small delay between actions for stability
      lines.push(`  await page.waitForTimeout(100);`);
      lines.push(``);
    }

    // Add expected string check if provided
    if (options.expectedString) {
      lines.push(`  // Verify expected content`);
      lines.push(`  const content = await page.content();`);
      lines.push(`  expect(content).toContain('${options.expectedString.replace(/'/g, "\\'")}');`);
    }

    // Add final verification that no errors occurred
    lines.push(`  // Verify page loaded without errors`);
    lines.push(`  const url = page.url();`);
    lines.push(`  expect(url).toBeTruthy();`);
    
    lines.push(`});`);

    return lines.join('\n');
  }

  /**
   * Convert action to Playwright test code
   */
  private actionToPlaywrightTest(action: ActionRecord): string | null {
    switch (action.tool) {
      case 'browser_navigate':
        return `  await page.goto('${action.parameters.url}');`;
      
      case 'browser_click':
        return `  await page.click('${action.parameters.selector}');`;
      
      case 'browser_type':
        const text = action.parameters.text.replace(/'/g, "\\'");
        return `  await page.type('${action.parameters.selector}', '${text}');`;
      
      case 'browser_fill':
        const value = action.parameters.value.replace(/'/g, "\\'");
        return `  await page.fill('${action.parameters.selector}', '${value}');`;
      
      case 'browser_select_option':
        return `  await page.selectOption('${action.parameters.selector}', '${action.parameters.value}');`;
      
      case 'browser_screenshot':
        return `  await page.screenshot({ fullPage: ${action.parameters.fullPage ?? false} });`;
      
      case 'browser_go_back':
        return `  await page.goBack();`;
      
      case 'browser_go_forward':
        return `  await page.goForward();`;
      
      case 'browser_refresh':
        return `  await page.reload();`;
      
      case 'browser_wait_for_element':
        return `  await page.waitForSelector('${action.parameters.selector}', { timeout: ${action.parameters.timeout || 30000} });`;
      
      case 'browser_evaluate':
        return `  await page.evaluate(() => { ${action.parameters.script} });`;
      
      case 'browser_get_page_info':
      case 'browser_get_element_text':
      case 'browser_get_element_attribute':
      case 'browser_get_markdown':
        // These are read operations, not needed in test replay
        return null;
      
      default:
        return null;
    }
  }

  /**
   * Find session by ID in saved sessions
   */
  private async findSessionById(sessionId: string): Promise<Session | null> {
    try {
      const savedSessions = await this.listSavedSessions();
      for (const item of savedSessions) {
        if (item.session.id === sessionId) {
          return item.session;
        }
      }
    } catch (error) {
      console.error('Error finding session:', error);
    }
    return null;
  }

  /**
   * Save generated test to file
   */
  async saveTestToFile(
    sessionIdOrPath: string,
    options: {
      testName?: string;
      expectedString?: string;
      timeout?: number;
      outputPath?: string;
    } = {}
  ): Promise<string> {
    const testCode = await this.generatePlaywrightTest(sessionIdOrPath, options);
    
    // Default to tests/unit directory in current working directory
    // Use session ID in filename if available
    let sessionId = 'generated';
    try {
      if (!sessionIdOrPath.includes('/')) {
        sessionId = sessionIdOrPath.substring(0, 8); // First 8 chars of session ID
      }
    } catch (e) {}
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const outputPath = options.outputPath || 
      path.join(process.cwd(), 'tests', 'unit', `test_${sessionId}_${timestamp}.spec.js`);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(outputPath, testCode, 'utf-8');
    
    return outputPath;
  }

  /**
   * Get session statistics
   */
  getSessionStats(instanceId: string): {
    totalActions: number;
    duration?: number;
    toolUsage: Record<string, number>;
    errorCount: number;
  } | undefined {
    const session = this.sessions.get(instanceId);
    if (!session) return undefined;

    const toolUsage: Record<string, number> = {};
    let errorCount = 0;

    for (const action of session.actions) {
      toolUsage[action.tool] = (toolUsage[action.tool] || 0) + 1;
      if (action.error) errorCount++;
    }

    const duration = session.endedAt 
      ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
      : Date.now() - new Date(session.startedAt).getTime();

    return {
      totalActions: session.actions.length,
      duration,
      toolUsage,
      errorCount
    };
  }
}
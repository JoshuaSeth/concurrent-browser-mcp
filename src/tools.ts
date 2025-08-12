import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './browser-manager.js';
import { 
  ToolResult, 
  NavigationOptions, 
  ClickOptions, 
  TypeOptions, 
  ScreenshotOptions
} from './types.js';
import { ScreenshotDescribe, screenshotAndDescribe } from './screenshot-describe.js';

export class BrowserTools {
  constructor(private browserManager: BrowserManager) {}

  /**
   * Record action to session
   */
  private async recordAction(instanceId: string, action: {
    tool: string;
    parameters: any;
    result?: any;
    error?: string;
    metadata?: any;
  }): Promise<void> {
    const recorder = this.browserManager.getSessionRecorder();
    await recorder.recordAction(instanceId, action);
  }

  /**
   * Get all tool definitions
   */
  getTools(): Tool[] {
    return [
      // Instance management tools
      {
        name: 'browser_create_instance',
        description: 'Create a new browser instance',
        inputSchema: {
          type: 'object',
          properties: {
            browserType: {
              type: 'string',
              enum: ['chromium', 'firefox', 'webkit'],
              description: 'Browser type',
              default: 'chromium'
            },
            headless: {
              type: 'boolean',
              description: 'Whether to run in headless mode',
              default: true
            },
            viewport: {
              type: 'object',
              properties: {
                width: { type: 'number', default: 1280 },
                height: { type: 'number', default: 720 }
              },
              description: 'Viewport size'
            },
            userAgent: {
              type: 'string',
              description: 'User agent string'
            },
            metadata: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Instance name' },
                description: { type: 'string', description: 'Instance description' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Tags' }
              },
              description: 'Instance metadata'
            }
          }
        }
      },
      {
        name: 'browser_list_instances',
        description: 'List all browser instances',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'browser_close_instance',
        description: 'Close the specified browser instance',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'browser_close_all_instances',
        description: 'Close all browser instances',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // Navigation tools
      {
        name: 'browser_navigate',
        description: 'Navigate to a specified URL',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            url: {
              type: 'string',
              description: 'Target URL',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            },
            waitUntil: {
              type: 'string',
              enum: ['load', 'domcontentloaded', 'networkidle'],
              description: 'Wait condition',
              default: 'load'
            }
          },
          required: ['instanceId', 'url']
        }
      },
      {
        name: 'browser_go_back',
        description: 'Go back to the previous page',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'browser_go_forward',
        description: 'Go forward to the next page',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'browser_refresh',
        description: 'Refresh the current page',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            }
          },
          required: ['instanceId']
        }
      },

      // Page interaction tools
      {
        name: 'browser_click',
        description: 'Click on a page element',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            selector: {
              type: 'string',
              description: 'Element selector',
            },
            button: {
              type: 'string',
              enum: ['left', 'right', 'middle'],
              description: 'Mouse button',
              default: 'left'
            },
            clickCount: {
              type: 'number',
              description: 'Number of clicks',
              default: 1
            },
            delay: {
              type: 'number',
              description: 'Click delay in milliseconds',
              default: 0
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            }
          },
          required: ['instanceId', 'selector']
        }
      },
      {
        name: 'browser_type',
        description: 'Type text into an element',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            selector: {
              type: 'string',
              description: 'Element selector',
            },
            text: {
              type: 'string',
              description: 'Text to input',
            },
            delay: {
              type: 'number',
              description: 'Input delay in milliseconds',
              default: 0
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            }
          },
          required: ['instanceId', 'selector', 'text']
        }
      },
      {
        name: 'browser_fill',
        description: 'Fill a form field',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            selector: {
              type: 'string',
              description: 'Element selector',
            },
            value: {
              type: 'string',
              description: 'Value to fill',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            }
          },
          required: ['instanceId', 'selector', 'value']
        }
      },
      {
        name: 'browser_select_option',
        description: 'Select an option from a dropdown',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            selector: {
              type: 'string',
              description: 'Element selector',
            },
            value: {
              type: 'string',
              description: 'Value to select',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            }
          },
          required: ['instanceId', 'selector', 'value']
        }
      },

      // Page information tools
      {
        name: 'browser_get_page_info',
        description: 'Get detailed page information including full HTML content, page statistics, and metadata',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'browser_get_element_text',
        description: 'Get element text content',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            selector: {
              type: 'string',
              description: 'Element selector',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            }
          },
          required: ['instanceId', 'selector']
        }
      },
      {
        name: 'browser_get_element_attribute',
        description: 'Get element attribute value',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            selector: {
              type: 'string',
              description: 'Element selector',
            },
            attribute: {
              type: 'string',
              description: 'Attribute name',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            }
          },
          required: ['instanceId', 'selector', 'attribute']
        }
      },

      // Screenshot tool
      {
        name: 'browser_screenshot',
        description: 'Take a screenshot of the page or element',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            fullPage: {
              type: 'boolean',
              description: 'Whether to capture the full page',
              default: false
            },
            selector: {
              type: 'string',
              description: 'Element selector (capture specific element)'
            },
            type: {
              type: 'string',
              enum: ['png', 'jpeg'],
              description: 'Image format',
              default: 'png'
            },
            quality: {
              type: 'number',
              description: 'Image quality (1-100, JPEG only)',
              minimum: 1,
              maximum: 100,
              default: 80
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'browser_screenshot_describe',
        description: 'Take a screenshot of a page and get an AI-generated description of what is visible. Uses OpenAI Vision API to analyze the screenshot and provide detailed descriptions of the UI, content, layout, and visual elements.',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            descriptionPrompt: {
              type: 'string',
              description: 'Custom prompt for the AI description (optional). If not provided, will generate a comprehensive description of all visible elements.'
            },
            fullPage: {
              type: 'boolean',
              description: 'Whether to capture the full page',
              default: false
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'screenshot_describe_url',
        description: 'Take a screenshot of any URL and get an AI-generated description without needing a browser instance. Useful for quick analysis of external websites. Uses OpenAI Vision API to provide detailed descriptions.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to screenshot and describe'
            },
            descriptionPrompt: {
              type: 'string',
              description: 'Custom prompt for the AI description (optional)'
            },
            captureHtml: {
              type: 'boolean',
              description: 'Whether to also capture the HTML content',
              default: false
            }
          },
          required: ['url']
        }
      },

      // Wait tools
      {
        name: 'browser_wait_for_element',
        description: 'Wait for an element to appear',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            selector: {
              type: 'string',
              description: 'Element selector',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            }
          },
          required: ['instanceId', 'selector']
        }
      },
      {
        name: 'browser_wait_for_navigation',
        description: 'Wait for page navigation to complete',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds',
              default: 30000
            }
          },
          required: ['instanceId']
        }
      },

      // JavaScript execution tool
      {
        name: 'browser_evaluate',
        description: 'Execute JavaScript code in the page context',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            script: {
              type: 'string',
              description: 'JavaScript code to execute',
            }
          },
          required: ['instanceId', 'script']
        }
      },

      // Content extraction tool
      {
        name: 'browser_get_markdown',
        description: 'Get page content in Markdown format, optimized for large language models',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            includeLinks: {
              type: 'boolean',
              description: 'Whether to include links',
              default: true
            },
            maxLength: {
              type: 'number',
              description: 'Maximum content length in characters',
              default: 10000
            },
            selector: {
              type: 'string',
              description: 'Optional CSS selector to extract content from specific element only'
            }
          },
          required: ['instanceId']
        }
      },

      // Session management tools
      {
        name: 'session_get_current',
        description: 'Get the current session for a browser instance',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'session_list_all',
        description: 'List all active sessions',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'session_save',
        description: 'Save a session to file',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'session_export',
        description: 'Export session as JSON or Playwright script',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            },
            format: {
              type: 'string',
              enum: ['json', 'playwright'],
              description: 'Export format',
              default: 'json'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'session_list_saved',
        description: 'List all saved session files',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'session_load',
        description: 'Load a saved session from file',
        inputSchema: {
          type: 'object',
          properties: {
            filepath: {
              type: 'string',
              description: 'Path to session file'
            }
          },
          required: ['filepath']
        }
      },
      {
        name: 'session_replay',
        description: 'Replay a saved session on a new browser instance',
        inputSchema: {
          type: 'object',
          properties: {
            filepath: {
              type: 'string',
              description: 'Path to session file or session ID'
            }
          },
          required: ['filepath']
        }
      },
      {
        name: 'session_replay_with_verification',
        description: 'Replay a session with result verification and comparison',
        inputSchema: {
          type: 'object',
          properties: {
            filepath: {
              type: 'string',
              description: 'Path to session file'
            },
            verifyResults: {
              type: 'boolean',
              description: 'Verify that results match original session',
              default: true
            },
            captureNewData: {
              type: 'boolean',
              description: 'Capture additional page data during replay',
              default: false
            },
            comparePageContent: {
              type: 'boolean',
              description: 'Compare page content between original and replay',
              default: false
            },
            stopOnError: {
              type: 'boolean',
              description: 'Stop replay if an action fails',
              default: false
            },
            delayBetweenActions: {
              type: 'number',
              description: 'Delay in milliseconds between actions',
              default: 100
            }
          },
          required: ['filepath']
        }
      },
      {
        name: 'session_get_stats',
        description: 'Get statistics for a session',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'Instance ID'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'session_toggle_recording',
        description: 'Enable or disable session recording',
        inputSchema: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
              description: 'Whether to enable recording'
            }
          },
          required: ['enabled']
        }
      },
      {
        name: 'session_generate_test',
        description: 'Generate a Playwright test from a recorded browser session. This powerful tool converts any successful browser interaction sequence into a permanent, automated test that can be run repeatedly to ensure the UI continues working correctly. Perfect for turning exploratory testing or bug reproductions into regression tests. Use this after successfully completing any important user workflow to create a standardized test that will catch if that workflow breaks in the future.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID returned when closing browser (or filepath to saved session JSON). This ID represents all the actions you performed during the browser session.'
            },
            testName: {
              type: 'string',
              description: 'Descriptive name for the test that explains what user workflow or feature it validates (e.g., "User Login Flow", "Search Feature", "Checkout Process")',
              default: 'Generated test'
            },
            expectedString: {
              type: 'string',
              description: 'Optional string to verify appears in the final page content. Use this to ensure the workflow reached the expected end state (e.g., "Welcome" after login, "Order Confirmed" after checkout). If omitted, test only verifies no errors occurred.'
            },
            timeout: {
              type: 'number',
              description: 'Test timeout in milliseconds',
              default: 30000
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'session_save_test',
        description: 'Generate and save a Playwright test to file from a recorded browser session. This is the primary tool for converting successful browser interactions into permanent automated tests. After you successfully navigate a website, fill forms, click buttons, or complete any user workflow, use this tool with the session ID to create a test that will run that exact sequence automatically in the future. This enables continuous testing - what you manually verify today becomes an automated regression test forever. The generated test can be added to CI/CD pipelines to ensure the UI never breaks. Essential for: (1) Converting bug reproductions into regression tests, (2) Turning successful user journeys into automated checks, (3) Creating tests from exploratory testing sessions, (4) Building a test suite without writing code.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID returned when closing browser (you get this in the close message). This contains the full recording of all actions performed.'
            },
            testName: {
              type: 'string',
              description: 'Clear, descriptive name for what this test validates (e.g., "User Can Complete Purchase", "Search Returns Results", "Form Validation Works")'
            },
            expectedString: {
              type: 'string',
              description: 'Optional text that should appear if the workflow succeeds (e.g., "Payment successful", "Search results", "Form submitted"). Omit to only check for no errors.'
            },
            outputPath: {
              type: 'string',
              description: 'Path where to save the test file (defaults to tests/unit/ in current directory)'
            }
          },
          required: ['sessionId']
        }
      }
    ];
  }

  /**
   * Execute tools
   */
  async executeTools(name: string, args: any): Promise<ToolResult> {
    let result: ToolResult;
    
    try {
      switch (name) {
        case 'browser_create_instance':
          result = await this.browserManager.createInstance(
            {
              browserType: args.browserType || 'chromium',
              headless: args.headless ?? true,
              viewport: args.viewport || { width: 1280, height: 720 },
              userAgent: args.userAgent
            },
            args.metadata
          );
          // Record creation action to the new instance's session
          if (result.success && result.data?.instanceId) {
            await this.recordAction(result.data.instanceId, {
              tool: name,
              parameters: args,
              result: result.data
            });
          }
          return result;

        case 'browser_list_instances':
          return this.browserManager.listInstances();

        case 'browser_close_instance':
          result = await this.browserManager.closeInstance(args.instanceId);
          // Recording happens before closing in closeInstance method
          return result;

        case 'browser_close_all_instances':
          return await this.browserManager.closeAllInstances();

        case 'browser_navigate':
          result = await this.navigate(args.instanceId, args.url, {
            timeout: args.timeout || 30000,
            waitUntil: args.waitUntil || 'load'
          });
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_go_back':
          result = await this.goBack(args.instanceId);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_go_forward':
          result = await this.goForward(args.instanceId);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_refresh':
          result = await this.refresh(args.instanceId);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_click':
          result = await this.click(args.instanceId, args.selector, {
            button: args.button || 'left',
            clickCount: args.clickCount || 1,
            delay: args.delay || 0,
            timeout: args.timeout || 30000
          });
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_type':
          result = await this.type(args.instanceId, args.selector, args.text, {
            delay: args.delay || 0,
            timeout: args.timeout || 30000
          });
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_fill':
          result = await this.fill(args.instanceId, args.selector, args.value, args.timeout || 30000);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_select_option':
          result = await this.selectOption(args.instanceId, args.selector, args.value, args.timeout || 30000);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_get_page_info':
          result = await this.getPageInfo(args.instanceId);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_get_element_text':
          result = await this.getElementText(args.instanceId, args.selector, args.timeout || 30000);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_get_element_attribute':
          result = await this.getElementAttribute(args.instanceId, args.selector, args.attribute, args.timeout || 30000);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_screenshot':
          result = await this.screenshot(args.instanceId, {
            fullPage: args.fullPage || false,
            type: args.type || 'png',
            quality: args.quality || 80
          }, args.selector);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? { screenshot: '[SCREENSHOT_DATA]' } : undefined,
            error: result.error
          });
          return result;

        case 'browser_wait_for_element':
          result = await this.waitForElement(args.instanceId, args.selector, args.timeout || 30000);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_wait_for_navigation':
          result = await this.waitForNavigation(args.instanceId, args.timeout || 30000);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_evaluate':
          result = await this.evaluate(args.instanceId, args.script);
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? result.data : undefined,
            error: result.error
          });
          return result;

        case 'browser_get_markdown':
          result = await this.getMarkdown(args.instanceId, {
            includeLinks: args.includeLinks ?? true,
            maxLength: args.maxLength || 10000,
            selector: args.selector
          });
          await this.recordAction(args.instanceId, {
            tool: name,
            parameters: args,
            result: result.success ? { markdown: '[TRUNCATED]' } : undefined,
            error: result.error
          });
          return result;

        // Session management tools
        case 'session_get_current':
          const session = this.browserManager.getSessionRecorder().getSession(args.instanceId);
          return {
            success: !!session,
            data: session,
            error: session ? undefined : `No session found for instance ${args.instanceId}`
          };

        case 'session_list_all':
          const sessions = this.browserManager.getSessionRecorder().getAllSessions();
          return {
            success: true,
            data: { sessions, count: sessions.length }
          };

        case 'session_save':
          try {
            const filepath = await this.browserManager.getSessionRecorder().saveSession(args.instanceId);
            return {
              success: true,
              data: { filepath }
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to save session: ${error}`
            };
          }

        case 'session_export':
          try {
            const exported = await this.browserManager.getSessionRecorder().exportAsScript(
              args.instanceId,
              args.format || 'json'
            );
            return {
              success: true,
              data: { format: args.format || 'json', content: exported }
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to export session: ${error}`
            };
          }

        case 'session_list_saved':
          try {
            const savedSessions = await this.browserManager.getSessionRecorder().listSavedSessions();
            return {
              success: true,
              data: { sessions: savedSessions, count: savedSessions.length }
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to list saved sessions: ${error}`
            };
          }

        case 'session_load':
          try {
            const loadedSession = await this.browserManager.getSessionRecorder().loadSession(args.filepath);
            return {
              success: true,
              data: loadedSession
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to load session: ${error}`
            };
          }

        case 'session_replay':
          try {
            const replayResult = await this.browserManager.getSessionRecorder().replaySession(
              args.filepath,
              this.browserManager
            );
            return {
              success: replayResult.success,
              data: replayResult.success ? { instanceId: replayResult.instanceId } : undefined,
              error: replayResult.errors ? replayResult.errors.join(', ') : undefined
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to replay session: ${error}`
            };
          }

        case 'session_replay_with_verification':
          try {
            const replayResult = await this.browserManager.getSessionRecorder().replaySessionWithVerification(
              args.filepath,
              this.browserManager,
              {
                verifyResults: args.verifyResults ?? true,
                captureNewData: args.captureNewData ?? false,
                comparePageContent: args.comparePageContent ?? false,
                stopOnError: args.stopOnError ?? false,
                delayBetweenActions: args.delayBetweenActions ?? 100
              }
            );
            return {
              success: replayResult.success,
              data: {
                instanceId: replayResult.instanceId,
                comparison: replayResult.comparison,
                errors: replayResult.errors
              }
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to replay session with verification: ${error}`
            };
          }

        case 'session_get_stats':
          const stats = this.browserManager.getSessionRecorder().getSessionStats(args.instanceId);
          return {
            success: !!stats,
            data: stats,
            error: stats ? undefined : `No session found for instance ${args.instanceId}`
          };

        case 'session_toggle_recording':
          this.browserManager.getSessionRecorder().setRecordingEnabled(args.enabled);
          return {
            success: true,
            data: { recordingEnabled: args.enabled }
          };

        case 'session_generate_test':
          try {
            const testCode = await this.browserManager.getSessionRecorder().generatePlaywrightTest(
              args.sessionId,
              {
                testName: args.testName,
                expectedString: args.expectedString,
                timeout: args.timeout
              }
            );
            return {
              success: true,
              data: { 
                testCode,
                message: `Test generated successfully for session ${args.sessionId}`
              }
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to generate test: ${error}`
            };
          }

        case 'session_save_test':
          try {
            const filePath = await this.browserManager.getSessionRecorder().saveTestToFile(
              args.sessionId,
              {
                testName: args.testName,
                expectedString: args.expectedString,
                outputPath: args.outputPath
              }
            );
            return {
              success: true,
              data: { 
                filePath,
                message: `Test saved to ${filePath}`
              }
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to save test: ${error}`
            };
          }

        case 'browser_screenshot_describe':
          try {
            // First take a screenshot
            const screenshotResult = await this.screenshot(args.instanceId, {
              fullPage: args.fullPage || false,
              type: 'png'
            });
            
            if (!screenshotResult.success || !screenshotResult.data?.data) {
              return {
                success: false,
                error: 'Failed to take screenshot'
              };
            }
            
            // Create ScreenshotDescribe instance
            const sd = new ScreenshotDescribe();
            
            // Convert base64 to buffer and save temporarily
            const tempPath = `/tmp/screenshot_${Date.now()}.png`;
            const base64Data = screenshotResult.data.data.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            await require('fs').promises.writeFile(tempPath, buffer);
            
            // Get AI description
            const description = await sd.describeImage(
              tempPath,
              args.descriptionPrompt
            );
            
            // Clean up temp file
            await require('fs').promises.unlink(tempPath);
            await sd.close();
            
            // Record action
            await this.recordAction(args.instanceId, {
              tool: name,
              parameters: args,
              result: { description: description.substring(0, 500) + '...' },
              error: undefined
            });
            
            return {
              success: true,
              data: {
                screenshot: screenshotResult.data.data,
                description,
                message: 'Screenshot taken and described successfully'
              }
            };
          } catch (error: any) {
            return {
              success: false,
              error: `Failed to screenshot and describe: ${error.message}`
            };
          }
          
        case 'screenshot_describe_url':
          try {
            // Use the standalone function for URL screenshot & describe
            const result = await screenshotAndDescribe(
              args.url,
              {}, // config (will use env var for API key)
              {
                captureHtml: args.captureHtml || false,
                descriptionPrompt: args.descriptionPrompt
              }
            );
            
            return {
              success: true,
              data: {
                screenshotPath: result.screenshotPath,
                description: result.description,
                url: result.url,
                timestamp: result.timestamp,
                html: result.html,
                message: 'URL screenshot and description completed successfully'
              }
            };
          } catch (error: any) {
            return {
              success: false,
              error: `Failed to screenshot and describe URL: ${error.message}`
            };
          }

        default:
          return {
            success: false,
            error: `Unknown tool: ${name}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Tool execution failed: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  // Implementation of specific tool methods
  private async navigate(instanceId: string, url: string, options: NavigationOptions): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      const gotoOptions: any = {
        waitUntil: options.waitUntil
      };
      if (options.timeout) {
        gotoOptions.timeout = options.timeout;
      }
      await instance.page.goto(url, gotoOptions);
      return {
        success: true,
        data: { url: instance.page.url(), title: await instance.page.title() },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Navigation failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async goBack(instanceId: string): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      await instance.page.goBack();
      return {
        success: true,
        data: { url: instance.page.url() },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Go back failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async goForward(instanceId: string): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      await instance.page.goForward();
      return {
        success: true,
        data: { url: instance.page.url() },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Go forward failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async refresh(instanceId: string): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      await instance.page.reload();
      return {
        success: true,
        data: { url: instance.page.url() },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Refresh failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async click(instanceId: string, selector: string, options: ClickOptions): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      const clickOptions: any = {
        button: options.button
      };
      if (options.clickCount) clickOptions.clickCount = options.clickCount;
      if (options.delay) clickOptions.delay = options.delay;
      if (options.timeout) clickOptions.timeout = options.timeout;
      await instance.page.click(selector, clickOptions);
      return {
        success: true,
        data: { selector, clicked: true },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Click failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async type(instanceId: string, selector: string, text: string, options: TypeOptions): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      const typeOptions: any = {};
      if (options.delay) typeOptions.delay = options.delay;
      if (options.timeout) typeOptions.timeout = options.timeout;
      await instance.page.type(selector, text, typeOptions);
      return {
        success: true,
        data: { selector, text, typed: true },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Type failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async fill(instanceId: string, selector: string, value: string, timeout: number): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      await instance.page.fill(selector, value, { timeout });
      return {
        success: true,
        data: { selector, value, filled: true },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Fill failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async selectOption(instanceId: string, selector: string, value: string, timeout: number): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      await instance.page.selectOption(selector, value, { timeout });
      return {
        success: true,
        data: { selector, value, selected: true },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Select option failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async getPageInfo(instanceId: string): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      const url = instance.page.url();
      const title = await instance.page.title();
      const content = await instance.page.content();
      
      // Get additional page information
      const viewport = instance.page.viewportSize();
      const loadState = await instance.page.evaluate(() => document.readyState);
      
      // Get basic page statistics
      const pageStats = await instance.page.evaluate(() => {
        const links = document.querySelectorAll('a[href]').length;
        const images = document.querySelectorAll('img').length;
        const forms = document.querySelectorAll('form').length;
        const scripts = document.querySelectorAll('script').length;
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]').length;
        
        return {
          linksCount: links,
          imagesCount: images,
          formsCount: forms,
          scriptsCount: scripts,
          stylesheetsCount: stylesheets
        };
      });
      
      return {
        success: true,
        data: { 
          url, 
          title, 
          content,  // Return complete HTML content
          contentLength: content.length,
          viewport,
          loadState,
          stats: pageStats,
          timestamp: new Date().toISOString()
        },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Get page info failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async getElementText(instanceId: string, selector: string, timeout: number): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      const text = await instance.page.textContent(selector, { timeout });
      return {
        success: true,
        data: { selector, text },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Get element text failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async getElementAttribute(instanceId: string, selector: string, attribute: string, timeout: number): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      const value = await instance.page.getAttribute(selector, attribute, { timeout });
      return {
        success: true,
        data: { selector, attribute, value },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Get element attribute failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async screenshot(instanceId: string, options: ScreenshotOptions, selector?: string): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      let screenshotData: Buffer;
      
      if (selector) {
        const element = await instance.page.$(selector);
        if (!element) {
          return { success: false, error: `Element not found: ${selector}`, instanceId };
        }
        screenshotData = await element.screenshot({
          type: options.type,
          quality: options.type === 'jpeg' ? options.quality : undefined
        });
      } else {
        screenshotData = await instance.page.screenshot({
          fullPage: options.fullPage,
          type: options.type,
          quality: options.type === 'jpeg' ? options.quality : undefined,
          clip: options.clip
        });
      }

      return {
        success: true,
        data: { 
          screenshot: screenshotData.toString('base64'),
          type: options.type,
          selector
        },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Screenshot failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async waitForElement(instanceId: string, selector: string, timeout: number): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      await instance.page.waitForSelector(selector, { timeout });
      return {
        success: true,
        data: { selector, found: true },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Wait for element failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async waitForNavigation(instanceId: string, timeout: number): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      await instance.page.waitForNavigation({ timeout });
      return {
        success: true,
        data: { url: instance.page.url() },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Wait for navigation failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async evaluate(instanceId: string, script: string): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      const result = await instance.page.evaluate(script);
      return {
        success: true,
        data: { script, result },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Evaluate failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }

  private async getMarkdown(instanceId: string, options: {
    includeLinks: boolean;
    maxLength: number;
    selector?: string;
  }): Promise<ToolResult> {
    const instance = this.browserManager.getInstance(instanceId);
    if (!instance) {
      return { success: false, error: `Instance ${instanceId} not found` };
    }

    try {
      // JavaScript function to extract page content and convert to Markdown
      const markdownContent = await instance.page.evaluate((opts) => {
        const { includeLinks, maxLength, selector } = opts;
        
        // Select the root element to process
        const rootElement = selector ? document.querySelector(selector) : document.body;
        if (!rootElement) {
          return 'Specified element or page content not found';
        }

        // HTML to Markdown conversion function
        function htmlToMarkdown(element: any, depth = 0) {
          let markdown = '';
          const indent = '  '.repeat(depth);
          
          for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent?.trim();
              if (text) {
                markdown += text + ' ';
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              const tagName = el.tagName.toLowerCase();
              
              switch (tagName) {
                case 'h1':
                  markdown += `\n\n# ${el.textContent?.trim()}\n\n`;
                  break;
                case 'h2':
                  markdown += `\n\n## ${el.textContent?.trim()}\n\n`;
                  break;
                case 'h3':
                  markdown += `\n\n### ${el.textContent?.trim()}\n\n`;
                  break;
                case 'h4':
                  markdown += `\n\n#### ${el.textContent?.trim()}\n\n`;
                  break;
                case 'h5':
                  markdown += `\n\n##### ${el.textContent?.trim()}\n\n`;
                  break;
                case 'h6':
                  markdown += `\n\n###### ${el.textContent?.trim()}\n\n`;
                  break;
                case 'p':
                  const pText = htmlToMarkdown(el, depth);
                  if (pText.trim()) {
                    markdown += `\n\n${pText.trim()}\n`;
                  }
                  break;
                case 'br':
                  markdown += '\n';
                  break;
                case 'strong':
                case 'b':
                  markdown += `**${el.textContent?.trim()}**`;
                  break;
                case 'em':
                case 'i':
                  markdown += `*${el.textContent?.trim()}*`;
                  break;
                case 'code':
                  markdown += `\`${el.textContent?.trim()}\``;
                  break;
                case 'pre':
                  markdown += `\n\`\`\`\n${el.textContent?.trim()}\n\`\`\`\n`;
                  break;
                case 'a':
                  const href = el.getAttribute('href');
                  const linkText = el.textContent?.trim();
                  if (includeLinks && href && linkText) {
                    if (href.startsWith('http')) {
                      markdown += `[${linkText}](${href})`;
                    } else {
                      markdown += linkText;
                    }
                  } else {
                    markdown += linkText || '';
                  }
                  break;
                case 'ul':
                case 'ol':
                  markdown += '\n';
                  const listItems = el.querySelectorAll('li');
                  listItems.forEach((li, index) => {
                    const bullet = tagName === 'ul' ? '-' : `${index + 1}.`;
                    markdown += `${indent}${bullet} ${li.textContent?.trim()}\n`;
                  });
                  markdown += '\n';
                  break;
                case 'blockquote':
                  const quoteText = el.textContent?.trim();
                  if (quoteText) {
                    markdown += `\n> ${quoteText}\n\n`;
                  }
                  break;
                case 'div':
                case 'section':
                case 'article':
                case 'main':
                  // Recursively process container elements
                  markdown += htmlToMarkdown(el, depth);
                  break;
                case 'table':
                  // Simplified table processing
                  const rows = el.querySelectorAll('tr');
                  if (rows.length > 0) {
                    markdown += '\n\n';
                    rows.forEach((row, rowIndex) => {
                      const cells = row.querySelectorAll('td, th');
                      const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');
                      markdown += '| ' + cellTexts.join(' | ') + ' |\n';
                      if (rowIndex === 0) {
                        markdown += '|' + ' --- |'.repeat(cells.length) + '\n';
                      }
                    });
                    markdown += '\n';
                  }
                  break;
                case 'script':
                case 'style':
                case 'nav':
                case 'footer':
                case 'aside':
                  // Ignore these elements
                  break;
                default:
                  // For other elements, continue recursive processing of child elements
                  markdown += htmlToMarkdown(el, depth);
                  break;
              }
            }
          }
          
          return markdown;
        }

        // Extract page title
        const title = document.title;
        const url = window.location.href;
        
        // Generate Markdown content
        let content = `# ${title}\n\n**URL:** ${url}\n\n`;
        content += htmlToMarkdown(rootElement);
        
        // Clean up extra line breaks and spaces
        content = content
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]+/g, ' ')
          .trim();
        
        // Truncate content if exceeds maximum length
        if (content.length > maxLength) {
          content = content.substring(0, maxLength) + '\n\n[Content truncated...]';
        }
        
        return content;
      }, options);

      return {
        success: true,
        data: { 
          markdown: markdownContent,
          length: markdownContent.length,
          truncated: markdownContent.length >= options.maxLength,
          url: instance.page.url(),
          title: await instance.page.title()
        },
        instanceId
      };
    } catch (error) {
      return {
        success: false,
        error: `Get markdown failed: ${error instanceof Error ? error.message : error}`,
        instanceId
      };
    }
  }
} 
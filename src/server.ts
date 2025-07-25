import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { BrowserManager } from './browser-manager.js';
import { BrowserTools } from './tools.js';
import { ServerConfig } from './types.js';

export class ConcurrentBrowserServer {
  private server: Server;
  private browserManager: BrowserManager;
  private browserTools: BrowserTools;

  constructor(config: ServerConfig) {
    this.server = new Server(
      {
        name: 'concurrent-browser-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.browserManager = new BrowserManager(config);
    this.browserTools = new BrowserTools(this.browserManager);

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle tool list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.browserTools.getTools();
      return {
        tools: tools,
      };
    });

    // Handle tool call requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.browserTools.executeTools(name, args || {});
        
        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        } else {
          throw new McpError(ErrorCode.InternalError, result.error || 'Tool execution failed');
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : error}`
        );
      }
    });

    // Handle server shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down server...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down server...');
      await this.shutdown();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Concurrent Browser MCP Server started');
  }

  async shutdown() {
    try {
      await this.browserManager.destroy();
          console.error('Server closed');
  } catch (error) {
    console.error('Error closing server:', error);
    }
  }
}

// Default configuration
export const defaultConfig: ServerConfig = {
  maxInstances: 20,
  defaultBrowserConfig: {
    browserType: 'chromium',
    headless: true,
    viewport: {
      width: 1280,
      height: 720,
    },
    contextOptions: {
      ignoreHTTPSErrors: true,
    },
  },
  instanceTimeout: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  proxy: {
    autoDetect: true, // Enable proxy auto-detection by default
  },
}; 
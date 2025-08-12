# concurrent-browser-mcp-session

A multi-concurrent browser MCP (Model Context Protocol) server built with Playwright, enhanced with session recording and automatic test generation capabilities.

**Fork of [concurrent-browser-mcp](https://github.com/sailaoda/concurrent-browser-mcp) with advanced session recording features**

[中文](docs/README.zh.md) | **English**

## Features

### Core Features (from original)
- 🚀 **Multi-Instance Concurrency**: Support running multiple browser instances simultaneously
- 🎯 **Instance Management**: Dynamically create, manage, and clean up browser instances  
- 🔧 **Flexible Configuration**: Support various browser types and custom configurations
- 🛡️ **Resource Management**: Automatically clean up timed-out instances to prevent resource leaks
- 🌐 **Full Feature Support**: Complete browser automation capabilities (navigation, clicking, input, screenshots, etc.)
- 💻 **Cross-Platform**: Support Chromium, Firefox, WebKit

### New Session Recording Features
- 📹 **Session Recording**: Automatically records all browser actions as JSON sessions
- 🎭 **Session Replay**: Replay recorded sessions exactly as they were performed
- 🧪 **Test Generation**: Convert any successful browser session into a Playwright test
- ✅ **Continuous Testing**: What you manually verify today becomes an automated test forever
- 📝 **Session Management**: Save, load, and manage recorded browser sessions
- 🔄 **CI/CD Ready**: Generated tests can be added to pipelines for regression testing

### AI-Powered Visual Analysis (NEW)
- 🤖 **Screenshot & Describe**: Take screenshots and get AI-generated descriptions using Google Gemini Vision API
- 👁️ **Visual Understanding**: Analyze page layouts, UI elements, content, and visual design automatically
- 🔍 **Instant Analysis**: Describe any URL without creating browser instances
- 📊 **UI Verification**: Perfect for testing, debugging, and documenting UI states

## Installation

### Option 1: Install from npm (Recommended)

```bash
# Global installation
npm install -g concurrent-browser-mcp-session

# Or use npx directly (no installation required)
npx concurrent-browser-mcp-session
```

### Option 2: Build from Source

```bash
# Clone repository
git clone https://github.com/yourusername/concurrent-browser-mcp-session.git
cd concurrent-browser-mcp-session

# Install dependencies
npm install

# Build project
npm run build

# Optional: Global link (for local development)
npm link
```

### Option 3: Quick Install Script

```bash
git clone https://github.com/yourusername/concurrent-browser-mcp-session.git
cd concurrent-browser-mcp-session
./install.sh
```

## Quick Start

### 1. Basic Usage

```bash
# Start server (default configuration with session recording enabled)
npx concurrent-browser-mcp-session

# Custom configuration
npx concurrent-browser-mcp-session --max-instances 25 --browser firefox --headless false
```

### 2. MCP Client Configuration

Choose the appropriate configuration based on your installation method:

#### Using npm global installation or npx

```json
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "npx",
      "args": ["concurrent-browser-mcp-session", "--max-instances", "20"]
    }
  }
}
```

#### Using global installation version

```json
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "concurrent-browser-mcp-session",
      "args": ["--max-instances", "20"]
    }
  }
}
```

#### Using local build version

If you built from source, you can reference the local build version directly:

```json
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "node",
      "args": ["/path/to/concurrent-browser-mcp-session/dist/index.js", "--max-instances", "20"],
      "cwd": "/path/to/concurrent-browser-mcp-session"
    }
  }
}
```

Or use relative path (if config file and project are in the same directory level):

```json
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "node",
      "args": ["./concurrent-browser-mcp-session/dist/index.js", "--max-instances", "20"]
    }
  }
}
```

#### Using npm link version (development mode)

If you used `npm link`:

```json
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "concurrent-browser-mcp-session",
      "args": ["--max-instances", "20"]
    }
  }
}
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-m, --max-instances <number>` | Maximum number of instances | 20 |
| `-t, --instance-timeout <number>` | Instance timeout in minutes | 30 |
| `-c, --cleanup-interval <number>` | Cleanup interval in minutes | 5 |
| `--browser <browser>` | Default browser type (chromium/firefox/webkit) | chromium |
| `--headless` | Default headless mode | true |
| `--width <number>` | Default viewport width | 1280 |
| `--height <number>` | Default viewport height | 720 |
| `--user-agent <string>` | Default user agent | - |
| `--proxy <string>` | Proxy server address (e.g., http://127.0.0.1:7890) | - |
| `--no-proxy-auto-detect` | Disable automatic proxy detection | false |
| `--ignore-https-errors` | Ignore HTTPS errors | false |
| `--bypass-csp` | Bypass CSP | false |

## Proxy Configuration

concurrent-browser-mcp supports flexible proxy configuration to help you use browser automation features in network environments that require proxies.

### Proxy Configuration Methods

#### 1. Specify Proxy via Command Line
```bash
# Use specified proxy server
npx concurrent-browser-mcp --proxy http://127.0.0.1:7890
```

#### 2. Automatic Local Proxy Detection (Enabled by Default)
The system automatically detects proxies in the following order:
- **Environment Variables**: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`
- **Common Proxy Ports**: 7890, 1087, 8080, 3128, 8888, 10809, 20171
- **System Proxy Settings** (macOS): Automatically reads system network settings

```bash
# Auto-detection enabled by default (no additional parameters needed)
npx concurrent-browser-mcp

# Explicitly disable auto-detection
npx concurrent-browser-mcp --no-proxy-auto-detect
```

#### 3. Proxy Settings in MCP Configuration File

**Using specified proxy:**
```json
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "npx",
      "args": ["concurrent-browser-mcp", "--proxy", "http://127.0.0.1:7890"]
    }
  }
}
```

**Disable proxy:**
```json
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "npx", 
      "args": ["concurrent-browser-mcp", "--no-proxy-auto-detect"]
    }
  }
}
```

### Proxy Detection Logs
The proxy detection results will be displayed at startup:
```
🚀 Starting Concurrent Browser MCP Server...
Max instances: 20
Default browser: chromium
Headless mode: yes
Viewport size: 1280x720
Instance timeout: 30 minutes
Cleanup interval: 5 minutes
Proxy: Auto-detection enabled  # or shows detected proxy address
```

### Supported Proxy Types
- HTTP proxy: `http://proxy-server:port`
- HTTPS proxy: `https://proxy-server:port`
- SOCKS5 proxy: `socks5://proxy-server:port`

### Notes
- Proxy configuration applies to all created browser instances
- Authentication with username/password is not supported
- Proxy can be set via environment variables without manual configuration
- Proxy detection is completed automatically at service startup without affecting runtime performance

## AI-Powered Screenshot & Describe

### Overview

The Screenshot & Describe feature uses Google's Gemini Vision API (gemini-2.0-flash-exp) to automatically analyze and describe screenshots of web pages. This is invaluable for:
- Understanding complex UI layouts
- Verifying visual elements are displayed correctly
- Debugging rendering issues
- Creating documentation of UI states
- Accessibility testing

### Configuration

Set your Gemini API key as an environment variable:
```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### Available Tools

#### 1. `browser_screenshot_describe`
Takes a screenshot of the current page in a browser instance and generates an AI description.

```javascript
// With existing browser instance
await callTool('browser_screenshot_describe', {
  instanceId: 'your-instance-id',
  descriptionPrompt: 'Describe the main navigation and content areas',
  fullPage: false
});
```

#### 2. `screenshot_describe_url`
Screenshots and describes any URL directly without needing a browser instance.

```javascript
// Direct URL analysis
await callTool('screenshot_describe_url', {
  url: 'https://example.com',
  descriptionPrompt: 'What is the purpose of this page?',
  captureHtml: true  // Optionally capture HTML too
});
```

### Example Use Cases

```javascript
// Verify UI after navigation
const result = await callTool('screenshot_describe_url', {
  url: 'https://github.com',
  descriptionPrompt: 'List all visible buttons and links in the main navigation'
});
console.log(result.data.description);
// Output: "The main navigation contains: Sign in, Sign up, Product dropdown, Solutions dropdown..."

// Debug rendering issues
const analysis = await callTool('browser_screenshot_describe', {
  instanceId: instanceId,
  descriptionPrompt: 'Are there any visual glitches or misaligned elements?'
});

// Document UI state
const documentation = await callTool('screenshot_describe_url', {
  url: 'https://app.example.com/dashboard',
  descriptionPrompt: 'Create a detailed description for documentation purposes'
});
```

## Session Recording & Test Generation

### How It Works

Every browser interaction is automatically recorded as a session. When you close a browser instance, you receive a session ID that can be used to:
1. Replay the exact same browser actions
2. Generate a Playwright test from the session
3. Add the test to your CI/CD pipeline

### Workflow Example

```javascript
// 1. Perform browser actions (automatically recorded)
const instance = await callTool('browser_create_instance', { browserType: 'chromium' });
await callTool('browser_navigate', { instanceId, url: 'https://example.com' });
await callTool('browser_click', { instanceId, selector: 'button.submit' });

// 2. Close browser and get session ID
const result = await callTool('browser_close_instance', { instanceId });
console.log(result.data.message); // "Browser closed. Session ID: abc123..."

// 3. Generate test from session
await callTool('session_save_test', {
  sessionId: 'abc123...',
  testName: 'User Login Flow',
  expectedString: 'Welcome'  // Optional: verify specific text appears
});
// Test saved to: tests/unit/test_abc123_timestamp.spec.js
```

### Session Tools

- `session_generate_test`: Generate Playwright test code from a session
- `session_save_test`: Generate and save test to file (tests/unit/)
- `session_list`: List all saved sessions
- `session_replay`: Replay a recorded session
- `session_export`: Export session as JSON
- `session_toggle_recording`: Enable/disable session recording

### Test Generation Use Cases

1. **Bug Reproduction → Regression Test**: When you find a bug, the reproduction steps automatically become a test
2. **Exploratory Testing → Automated Test**: Manual exploration converts to automated verification
3. **User Journey → E2E Test**: Successful user workflows become end-to-end tests
4. **No Code Test Creation**: Build comprehensive test suites without writing code

### Generated Test Example

```javascript
import { test, expect } from '@playwright/test';

test('User Login Flow', async ({ page }) => {
  test.setTimeout(30000);
  
  await page.goto('https://example.com');
  await page.click('button.submit');
  
  // Verify expected content
  const content = await page.content();
  expect(content).toContain('Welcome');
});
```

## Available Tools

![Tool Classification](./assets/tools-en.png)

### Instance Management

- `browser_create_instance`: Create a new browser instance
- `browser_list_instances`: List all instances
- `browser_close_instance`: Close a specific instance
- `browser_close_all_instances`: Close all instances

### Page Navigation

- `browser_navigate`: Navigate to a specified URL
- `browser_go_back`: Go back to previous page
- `browser_go_forward`: Go forward to next page
- `browser_refresh`: Refresh current page

### Page Interaction

- `browser_click`: Click on page elements
- `browser_type`: Type text content
- `browser_fill`: Fill form fields
- `browser_select_option`: Select dropdown options

### Page Information

- `browser_get_page_info`: Get detailed page information including full HTML content, page statistics, and metadata
- `browser_get_element_text`: Get element text
- `browser_get_element_attribute`: Get element attributes
- `browser_screenshot`: Take page screenshots
- `browser_get_markdown`: 🆕 Get Markdown content

### AI-Powered Screenshot Analysis (NEW)

- `browser_screenshot_describe`: 🆕 Take a screenshot and get AI-generated description of the current page using Gemini
- `screenshot_describe_url`: 🆕 Screenshot any URL and get AI description without browser instance using Gemini

### Wait Operations

- `browser_wait_for_element`: Wait for element to appear
- `browser_wait_for_navigation`: Wait for page navigation to complete

### JavaScript Execution

- `browser_evaluate`: Execute JavaScript code

## Usage Examples

### 1. Create Browser Instance

```javascript
// Create a new Chrome instance
await callTool('browser_create_instance', {
  browserType: 'chromium',
  headless: false,
  viewport: { width: 1920, height: 1080 },
  metadata: {
    name: 'main-browser',
    description: 'Main browser instance'
  }
});
```

### 2. Navigation and Interaction

```javascript
// Navigate to website
await callTool('browser_navigate', {
  instanceId: 'your-instance-id',
  url: 'https://example.com'
});

// Click element
await callTool('browser_click', {
  instanceId: 'your-instance-id',
  selector: 'button.submit'
});

// Input text
await callTool('browser_type', {
  instanceId: 'your-instance-id',
  selector: 'input[name="search"]',
  text: 'search query'
});
```

### 3. Get Page Information

```javascript
// Take screenshot
await callTool('browser_screenshot', {
  instanceId: 'your-instance-id',
  fullPage: true
});

// Get page information
await callTool('browser_get_page_info', {
  instanceId: 'your-instance-id'
});
```

### 4. Concurrent Operations

```javascript
// Create multiple instances for parallel processing
const instances = await Promise.all([
  callTool('browser_create_instance', { metadata: { name: 'worker-1' } }),
  callTool('browser_create_instance', { metadata: { name: 'worker-2' } }),
  callTool('browser_create_instance', { metadata: { name: 'worker-3' } })
]);

// Navigate to different pages in parallel
await Promise.all(instances.map(async (instance, index) => {
  await callTool('browser_navigate', {
    instanceId: instance.data.instanceId,
    url: `https://example${index + 1}.com`
  });
}));
```

## Architecture Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Client                              │
├─────────────────────────────────────────────────────────────────┤
│                    Concurrent Browser MCP Server                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Browser Tools  │  │ Browser Manager │  │  MCP Server     │  │
│  │                 │  │                 │  │                 │  │
│  │ - Tool Defs     │  │ - Instance Mgmt │  │ - Request       │  │
│  │ - Execution     │  │ - Lifecycle     │  │   Handling      │  │
│  │ - Validation    │  │ - Cleanup       │  │ - Error Mgmt    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        Playwright                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Browser 1     │  │   Browser 2     │  │   Browser N     │  │
│  │   (Chromium)    │  │   (Firefox)     │  │   (WebKit)      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Real Functionality Testing

In addition to simulation demo scripts, we also provide real browser functionality test scripts that let you see actual screenshot results:

### 🧪 Run Real Tests

```bash
# Run real browser screenshot test
node test-real-screenshot.js
```

This test script will:

1. **Start real browser**: Using Chromium engine
2. **Visit websites**: Navigate to example.com and github.com
3. **Save screenshots**: Generate real PNG screenshot files
4. **File output**: Generate screenshot files in current directory

### 📸 Test Output Example

```
🚀 Starting real browser screenshot test...
✅ Browser started
✅ Page created
🌐 Navigating to https://example.com...
✅ Page loaded successfully
📸 Taking screenshot and saving as screenshot-2025-07-19T11-04-18-660Z.png...
✅ Screenshot saved: screenshot-2025-07-19T11-04-18-660Z.png
📊 File size: 23.57 KB
📂 File location: /path/to/screenshot-2025-07-19T11-04-18-660Z.png
🌐 Visiting https://github.com...
✅ github screenshot saved: screenshot-github-2025-07-19T11-04-18-660Z.png (265.99 KB)
🛑 Browser closed
```

### 🖼️ View Screenshot Files

After testing, you can find actual screenshot files in the project directory:

```bash
# View generated screenshot files
ls -la screenshot-*.png

# Open in system default image viewer
open screenshot-*.png    # macOS
start screenshot-*.png   # Windows
xdg-open screenshot-*.png # Linux
```

## Differences from Traditional MCP Browser Servers

| Feature | Traditional MCP Browser Server | Concurrent Browser MCP |
|---------|-------------------------------|----------------------|
| Instance Management | Single instance | Multi-instance concurrency |
| Resource Isolation | None | Complete isolation |
| Concurrent Processing | Serial | Parallel |
| Instance Lifecycle | Manual management | Automatic management |
| Resource Cleanup | Manual | Automatic |
| Scalability | Limited | Highly scalable |

## Development Guide

### Local Development Environment Setup

```bash
# 1. Clone project
git clone https://github.com/yourusername/concurrent-browser-mcp-session.git
cd concurrent-browser-mcp-session

# 2. Install dependencies
npm install

# 3. Build project
npm run build

# 4. Local link (optional, for global command testing)
npm link
```

### Available npm Scripts

```bash
# Build TypeScript project
npm run build

# Development mode (file watching)
npm run dev

# Run code linting
npm run lint

# Fix code formatting issues
npm run lint:fix

# Clean build artifacts
npm run clean

# Run tests
npm test
```

### Project Structure

```
concurrent-browser-mcp-session/
├── src/                    # Source code directory
│   ├── index.ts           # CLI entry point
│   ├── server.ts          # MCP server main logic
│   ├── browser-manager.ts # Browser instance manager
│   ├── session-recorder.ts # Session recording logic
│   └── tools.ts           # MCP tool definitions and implementation
├── dist/                  # Build artifacts directory
├── docs/                  # Documentation
├── test/                  # Test scripts
├── assets/                # Static resources directory
├── examples/              # Example scripts
├── package.json           # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

### Using Local Build Version

After building, you can use the local version in several ways:

#### Option 1: Run build files directly

```bash
# Run built files
node dist/index.js --max-instances 20

# Use absolute path in MCP configuration
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "node",
      "args": ["/absolute/path/to/concurrent-browser-mcp-session/dist/index.js", "--max-instances", "20"]
    }
  }
}
```

#### Option 2: Use npm link (recommended for development)

```bash
# Execute link in project root directory
npm link

# Now you can use it like a global package
concurrent-browser-mcp-session --max-instances 20

# Use in MCP configuration
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "concurrent-browser-mcp-session",
      "args": ["--max-instances", "20"]
    }
  }
}
```

#### Option 3: Use in project directory

```bash
# Run directly in project directory
cd /path/to/concurrent-browser-mcp-session
npm run build
node dist/index.js

# MCP configuration using relative path
{
  "mcpServers": {
    "concurrent-browser": {
      "command": "node",
      "args": ["./concurrent-browser-mcp-session/dist/index.js"],
      "cwd": "/parent/directory/path"
    }
  }
}
```

### Testing and Debugging

```bash
# Run real browser tests
node test-real-screenshot.js

# Run simulated MCP call tests
node examples/demo.js

# Start development server (with debug output)
node dist/index.js --max-instances 5 --browser chromium --headless false
```

### Contributing Guidelines

1. Fork this project
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Credits

This project is a fork of [concurrent-browser-mcp](https://github.com/sailaoda/concurrent-browser-mcp) by sailaoda, enhanced with session recording and test generation capabilities.

## License

MIT License - See LICENSE file for details
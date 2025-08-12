/**
 * Screenshot and Describe functionality for browser automation
 * Takes screenshots of web pages and generates AI descriptions using Google Gemini
 */

import { chromium, Browser } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ScreenshotDescribeConfig {
  geminiApiKey?: string;
  screenshotsDir?: string;
  viewport?: { width: number; height: number };
  headless?: boolean;
  model?: string;
}

export interface ScreenshotDescribeResult {
  screenshotPath: string;
  description: string;
  url: string;
  timestamp: string;
  html?: string;
}

export class ScreenshotDescribe {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private browser: Browser | null = null;
  private config: Required<ScreenshotDescribeConfig>;

  constructor(config: ScreenshotDescribeConfig = {}) {
    // Configure with defaults
    this.config = {
      geminiApiKey: config.geminiApiKey || process.env['GEMINI_API_KEY'] || '',
      screenshotsDir: config.screenshotsDir || path.join(process.cwd(), 'screenshots'),
      viewport: config.viewport || { width: 1280, height: 800 },
      headless: config.headless !== undefined ? config.headless : true,
      model: config.model || 'gemini-2.0-flash-exp'  // Using Gemini 2.0 Flash Express
    };

    // Initialize Gemini if API key is provided
    if (this.config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.config.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: this.config.model 
      });
    }
  }

  /**
   * Initialize the browser instance
   */
  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless
      });
    }
  }

  /**
   * Ensure screenshots directory exists
   */
  private async ensureScreenshotsDir(): Promise<void> {
    try {
      await fs.access(this.config.screenshotsDir);
    } catch {
      await fs.mkdir(this.config.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Take a screenshot of a URL
   */
  async takeScreenshot(url: string): Promise<string> {
    await this.initBrowser();
    await this.ensureScreenshotsDir();

    const page = await this.browser!.newPage({
      viewport: this.config.viewport
    });

    try {
      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });

      // Wait a bit for any dynamic content
      await page.waitForTimeout(2000);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const id = uuidv4().substring(0, 8);
      const filename = `screenshot_${timestamp}_${id}.png`;
      const filepath = path.join(this.config.screenshotsDir, filename);

      // Take screenshot
      await page.screenshot({ 
        path: filepath,
        fullPage: false 
      });

      return filepath;
    } finally {
      await page.close();
    }
  }

  /**
   * Convert image to generative part for Gemini
   */
  private async imageToGenerativePart(imagePath: string): Promise<any> {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    return {
      inlineData: {
        data: base64Image,
        mimeType: 'image/png'
      }
    };
  }

  /**
   * Describe an image using Gemini Vision API
   */
  async describeImage(
    imagePath: string, 
    prompt?: string
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable or pass it in config.');
    }

    const defaultPrompt = `Describe this screenshot of a web page in detail. 
    Include information about:
    - The overall layout and design
    - Navigation elements and menus
    - Main content sections
    - Text content and headings
    - Images, buttons, and interactive elements
    - Color scheme and visual style
    - Any data, tables, or forms visible
    - The apparent purpose of the page`;

    try {
      // Convert image to format Gemini expects
      const imagePart = await this.imageToGenerativePart(imagePath);
      
      // Generate content with Gemini
      const result = await this.model.generateContent([
        prompt || defaultPrompt,
        imagePart
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      return text || 'No description generated';
    } catch (error: any) {
      throw new Error(`Failed to describe image: ${error.message}`);
    }
  }

  /**
   * Take a screenshot and describe it
   */
  async screenshotAndDescribe(
    url: string,
    options: {
      captureHtml?: boolean;
      descriptionPrompt?: string;
    } = {}
  ): Promise<ScreenshotDescribeResult> {
    await this.initBrowser();

    // Take screenshot
    const screenshotPath = await this.takeScreenshot(url);

    // Get HTML if requested
    let html: string | undefined;
    if (options.captureHtml) {
      const page = await this.browser!.newPage({
        viewport: this.config.viewport
      });
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        html = await page.content();
      } finally {
        await page.close();
      }
    }

    // Generate description
    const description = await this.describeImage(
      screenshotPath,
      options.descriptionPrompt
    );

    return {
      screenshotPath,
      description,
      url,
      timestamp: new Date().toISOString(),
      html
    };
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

/**
 * Convenience function for one-off screenshot and describe
 */
export async function screenshotAndDescribe(
  url: string,
  config?: ScreenshotDescribeConfig,
  options?: {
    captureHtml?: boolean;
    descriptionPrompt?: string;
  }
): Promise<ScreenshotDescribeResult> {
  const sd = new ScreenshotDescribe(config);
  try {
    return await sd.screenshotAndDescribe(url, options);
  } finally {
    await sd.close();
  }
}
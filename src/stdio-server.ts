#!/usr/bin/env node
import * as readline from 'readline';
import winston from 'winston';
import { AECommunicator } from './ae-integration/communicator.js';
import { AEFileCommunicator } from './ae-integration/file-communicator.js';
import { projectTools } from './server/tools/projectTools.js';
import { compositionTools } from './server/tools/compositionTools.js';
import { layerTools } from './server/tools/layerTools.js';
import { advancedLayerTools } from './server/tools/advancedLayerTools.js';
import { expressionTools } from './server/tools/expressionTools.js';
import { maskTools } from './server/tools/maskTools.js';
import { textTools } from './server/tools/textTools.js';
import { keyframeTools } from './server/tools/keyframeTools.js';
import { renderTools } from './server/tools/renderTools.js';
import { batchTools } from './server/tools/batchTools.js';
import { systemTools } from './server/tools/systemTools.js';

// Configure logger to file only (no console in stdio mode)
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'ae-mcp-server.log' })
  ],
});

class StdioMCPServer {
  private communicator: AECommunicator | AEFileCommunicator;
  private tools: Map<string, any>;
  private rl: readline.Interface;
  private initialized = false;
  private useFileBridge: boolean;
  private clientPrefix: string | undefined;

  constructor() {
    // Check if we should use file-based communication
    this.useFileBridge = process.env.AE_USE_FILE_BRIDGE === 'true';
    
    // Use environment variable for client prefix if provided, otherwise generate default
    const envPrefix = process.env.MCP_CLIENT_PREFIX;
    const defaultPrefix = envPrefix || `temp_${process.pid}_${Date.now().toString(36)}`;
    
    if (this.useFileBridge) {
      logger.info('Using file-based communication bridge');
      this.communicator = new AEFileCommunicator(logger, defaultPrefix);
    } else {
      logger.info('Using socket-based communication');
      this.communicator = new AECommunicator(logger, defaultPrefix);
    }
    
    if (envPrefix) {
      logger.info(`Using client prefix from environment: ${envPrefix}`);
      this.clientPrefix = envPrefix;
    }
    
    this.tools = new Map();
    
    // Set up stdio interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    this.setupTools();
    this.setupStdioHandler();
  }

  private setupTools() {
    const allTools = [
      ...systemTools,
      ...projectTools,
      ...compositionTools,
      ...layerTools,
      ...advancedLayerTools,
      ...expressionTools,
      ...maskTools,
      ...textTools,
      ...keyframeTools,
      ...renderTools,
      ...batchTools
    ];
    
    allTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
    
    logger.info(`Registered ${this.tools.size} tools`);
  }

  private setupStdioHandler() {
    this.rl.on('line', async (line) => {
      try {
        const message = JSON.parse(line);
        const response = await this.handleMessage(message);
        // Only send response if it's not null (notifications don't get responses)
        if (response !== null) {
          this.sendResponse(response);
        }
      } catch (error: any) {
        logger.error('Error handling message:', error);
        this.sendResponse({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
            data: error.message
          }
        });
      }
    });

    this.rl.on('close', () => {
      logger.info('Stdio connection closed');
      process.exit(0);
    });
  }

  private async handleMessage(message: any): Promise<any> {
    const { jsonrpc, method, params, id } = message;

    if (jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id
      };
    }

    try {
      let result;

      switch (method) {
        case 'initialize':
          result = await this.handleInitialize(params);
          break;
        case 'initialized':
        case 'notifications/initialized':
          this.initialized = true;
          logger.info('Server initialized');
          // If it's a notification (no id), don't return a response
          if (!id) {
            return null;
          }
          return { jsonrpc: '2.0', result: {}, id };
        case 'notifications/cancelled':
          logger.debug('Received cancellation notification');
          // This is a notification, no response needed
          return null;
        case 'tools/list':
          result = await this.handleListTools();
          break;
        case 'tools/call':
          result = await this.handleToolCall(params);
          break;
        case 'resources/list':
          result = await this.handleListResources();
          break;
        case 'resources/read':
          result = await this.handleReadResource(params);
          break;
        default:
          throw { code: -32601, message: `Method not found: ${method}` };
      }

      return { jsonrpc: '2.0', result, id };
    } catch (error: any) {
      logger.error(`Error handling method ${method}:`, error);
      return {
        jsonrpc: '2.0',
        error: error.code ? error : { code: -32603, message: error.message || 'Internal error' },
        id
      };
    }
  }

  private async handleInitialize(params: any) {
    logger.info('Initializing MCP server...', params);
    
    // Extract client info to create unique prefix
    if (params?.clientInfo) {
      const { name, version } = params.clientInfo;
      // Create a more meaningful prefix based on client info
      this.clientPrefix = `${name || 'unknown'}_${version || '0'}_${process.pid}_${Date.now().toString(36)}`
        .replace(/[^a-zA-Z0-9_-]/g, '_'); // Sanitize for filesystem
      
      // Recreate communicator with proper client prefix
      if (this.useFileBridge) {
        await this.communicator.disconnect();
        this.communicator = new AEFileCommunicator(logger, this.clientPrefix);
      } else {
        await this.communicator.disconnect();
        this.communicator = new AECommunicator(logger, this.clientPrefix);
      }
      
      logger.info(`Initialized with client prefix: ${this.clientPrefix}`);
    }
    
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {}
      },
      serverInfo: {
        name: 'adobe-after-effects',
        version: '1.0.0'
      }
    };
  }

  private async handleListTools() {
    return {
      tools: Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  }

  private async handleToolCall(params: any) {
    const { name, arguments: args } = params;
    
    // Log the incoming tool call for debugging
    logger.debug(`Tool call received: ${name}`, { arguments: args });
    
    const tool = this.tools.get(name);
    
    if (!tool) {
      throw { code: -32602, message: `Unknown tool: ${name}` };
    }
    
    try {
      // Validate arguments against the tool's input schema if available
      if (tool.inputSchema && args) {
        // Basic validation - check required fields
        const required = tool.inputSchema.required || [];
        for (const field of required) {
          if (!(field in args)) {
            throw new Error(`Missing required field '${field}' for tool '${name}'`);
          }
        }
      }
      
      // Connect to AE bridge if not connected
      if (this.useFileBridge) {
        await this.communicator.connect();
      } else {
        await (this.communicator as AECommunicator).connect(
          parseInt(process.env.AE_BRIDGE_PORT || '8090'),
          'localhost'
        );
      }
      
      // Special handling for batch_execute
      if (name === 'batch_execute') {
        return await this.handleBatchExecute(args);
      }
      
      const result = await this.communicator.executeCommand(name, args);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error(`Tool execution error for ${name}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  private async handleListResources() {
    return {
      resources: [
        {
          uri: 'ae://project/current',
          name: 'Current Project',
          description: 'Information about the currently open After Effects project',
          mimeType: 'application/json'
        },
        {
          uri: 'ae://compositions',
          name: 'Compositions',
          description: 'List of all compositions in the current project',
          mimeType: 'application/json'
        },
        {
          uri: 'ae://render-queue',
          name: 'Render Queue',
          description: 'Current render queue status and items',
          mimeType: 'application/json'
        }
      ]
    };
  }

  private async handleReadResource(params: any) {
    const { uri } = params;
    
    try {
      // Connect if needed
      if (this.useFileBridge) {
        await this.communicator.connect();
      } else {
        await (this.communicator as AECommunicator).connect(
          parseInt(process.env.AE_BRIDGE_PORT || '8090'),
          'localhost'
        );
      }
      
      let data;
      switch (uri) {
        case 'ae://project/current':
          data = await this.communicator.executeCommand('getProjectInfo', {});
          break;
        case 'ae://compositions':
          data = await this.communicator.executeCommand('listCompositions', {});
          break;
        case 'ae://render-queue':
          data = await this.communicator.executeCommand('getRenderQueue', {});
          break;
        default:
          throw { code: -32602, message: `Unknown resource: ${uri}` };
      }
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    } catch (error: any) {
      logger.error(`Resource read error for ${uri}:`, error);
      throw error;
    }
  }

  private sendResponse(response: any) {
    const message = JSON.stringify(response) + '\n';
    process.stdout.write(message);
  }

  start() {
    logger.info('Adobe After Effects MCP server started in stdio mode');
    if (this.useFileBridge) {
      logger.info('Using file-based bridge - no port conflicts!');
    } else {
      logger.info(`Expecting AE socket bridge on port ${process.env.AE_BRIDGE_PORT || '8090'}`);
    }
  }
  
  private async handleBatchExecute(args: any): Promise<any> {
    // Log the received args for debugging
    logger.debug('handleBatchExecute received args:', JSON.stringify(args));
    
    // Handle case where args might be undefined or null
    if (!args || typeof args !== 'object') {
      throw new Error("Invalid arguments: expected an object with 'commands' array");
    }
    
    const { commands, sequential } = args;
    
    // More detailed validation with better error messages
    if (commands === undefined) {
      throw new Error("Missing 'commands' field in batch_execute arguments");
    }
    
    if (!Array.isArray(commands)) {
      throw new Error(`Commands must be an array, received: ${typeof commands}`);
    }
    
    if (commands.length === 0) {
      throw new Error("Commands array cannot be empty");
    }
    
    // Validate all commands before execution
    const validationErrors: string[] = [];
    commands.forEach((cmd, index) => {
      if (!cmd.tool) {
        validationErrors.push(`Command ${index}: Missing 'tool' field`);
      }
      if (!cmd.params) {
        validationErrors.push(`Command ${index}: Missing 'params' field`);
      }
    });
    
    if (validationErrors.length > 0) {
      throw new Error(`Batch validation failed:\n${validationErrors.join('\n')}`);
    }
    
    logger.info(`Executing batch of ${commands.length} commands (${sequential ? 'sequential' : 'parallel'})`);
    
    const results: any[] = [];
    
    if (sequential) {
      // Execute commands one by one
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        const startTime = Date.now();
        try {
          logger.debug(`Executing command ${i + 1}/${commands.length}: ${cmd.tool}`);
          const result = await this.communicator.executeCommand(cmd.tool, cmd.params);
          const duration = Date.now() - startTime;
          results.push({
            id: cmd.id || `${cmd.tool}_${i}`,
            tool: cmd.tool,
            success: true,
            result,
            duration,
            index: i
          });
        } catch (error: any) {
          const duration = Date.now() - startTime;
          logger.error(`Command ${cmd.tool} failed:`, error);
          results.push({
            id: cmd.id || `${cmd.tool}_${i}`,
            tool: cmd.tool,
            success: false,
            error: {
              message: error.message || error.toString(),
              code: error.code,
              details: error.details
            },
            duration,
            index: i,
            params: cmd.params // Include params for debugging
          });
        }
      }
    } else {
      // Execute commands in parallel
      const promises = commands.map(async (cmd, index) => {
        const startTime = Date.now();
        try {
          logger.debug(`Executing parallel command: ${cmd.tool}`);
          const result = await this.communicator.executeCommand(cmd.tool, cmd.params);
          const duration = Date.now() - startTime;
          return {
            id: cmd.id || `${cmd.tool}_${index}`,
            tool: cmd.tool,
            success: true,
            result,
            duration,
            index
          };
        } catch (error: any) {
          const duration = Date.now() - startTime;
          logger.error(`Command ${cmd.tool} failed:`, error);
          return {
            id: cmd.id || `${cmd.tool}_${index}`,
            tool: cmd.tool,
            success: false,
            error: {
              message: error.message || error.toString(),
              code: error.code,
              details: error.details
            },
            duration,
            index,
            params: cmd.params // Include params for debugging
          };
        }
      });
      
      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);
    }
    
    // Calculate statistics
    const stats = {
      total: commands.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      averageDuration: results.length > 0 ? 
        results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length : 0
    };
    
    // Log summary
    logger.info(`Batch execution complete: ${stats.successful}/${stats.total} successful`);
    if (stats.failed > 0) {
      logger.warn(`${stats.failed} commands failed`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...stats,
            executionMode: sequential ? 'sequential' : 'parallel',
            results
          }, null, 2)
        }
      ]
    };
  }
}

// Main entry point
const server = new StdioMCPServer();
server.start();

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});
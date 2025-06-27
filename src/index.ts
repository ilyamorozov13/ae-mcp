// Use stub for now - replace with actual SDK in production
// import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// import {
//   CallToolRequestSchema,
//   ListResourcesRequestSchema,
//   ListToolsRequestSchema,
//   ReadResourceRequestSchema,
// } from '@modelcontextprotocol/sdk/types.js';

import {
  Server,
  StdioServerTransport,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from './mcp-sdk-stub.js';
import winston from 'winston';
import { AECommunicator } from './ae-integration/communicator.js';
import { projectTools } from './server/tools/projectTools.js';
import { compositionTools } from './server/tools/compositionTools.js';
import { layerTools } from './server/tools/layerTools.js';
import { renderTools } from './server/tools/renderTools.js';

// Configure logger
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

// Only add console transport if not in stdio mode
if (process.env.MCP_MODE !== 'stdio') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

class AfterEffectsMCPServer {
  private server: Server;
  private communicator: AECommunicator;
  private tools: Map<string, any>;

  constructor() {
    this.communicator = new AECommunicator(logger);
    this.tools = new Map();
    
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'adobe-after-effects',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupHandlers();
  }

  private setupTools() {
    const allTools = [
      ...projectTools,
      ...compositionTools,
      ...layerTools,
      ...renderTools
    ];
    
    allTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
  }

  private setupHandlers() {
    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;
      const tool = this.tools.get(name);
      
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }
      
      try {
        await this.communicator.connect(
          parseInt(process.env.AE_BRIDGE_PORT || '8080'),
          'localhost'
        );
        
        const result = await this.communicator.executeCommand(name, args);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Tool execution error: ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'ae://project/current',
          name: 'Current Project',
          description: 'Information about the currently open After Effects project',
          mimeType: 'application/json',
        },
        {
          uri: 'ae://compositions',
          name: 'Compositions',
          description: 'List of all compositions in the current project',
          mimeType: 'application/json',
        },
        {
          uri: 'ae://render-queue',
          name: 'Render Queue',
          description: 'Current render queue status and items',
          mimeType: 'application/json',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
      const { uri } = request.params;
      
      await this.communicator.connect(
        parseInt(process.env.AE_BRIDGE_PORT || '8080'),
        'localhost'
      );
      
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
          throw new Error(`Unknown resource: ${uri}`);
      }
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Adobe After Effects MCP server started');
  }
}

// Main entry point
const server = new AfterEffectsMCPServer();
server.run().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
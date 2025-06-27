import express, { Request, Response } from 'express';
import { Logger } from 'winston';
import { AECommunicator } from '../ae-integration/communicator.js';
import { projectTools } from './tools/projectTools.js';
import { compositionTools } from './tools/compositionTools.js';
import { layerTools } from './tools/layerTools.js';
import { renderTools } from './tools/renderTools.js';

export class AfterEffectsServer {
  private app: express.Application;
  private communicator: AECommunicator;
  private logger: Logger;
  private server: any;
  private tools: Map<string, any>;
  
  constructor(logger: Logger) {
    this.logger = logger;
    this.app = express();
    this.app.use(express.json());
    this.communicator = new AECommunicator(logger);
    this.tools = new Map();
    
    this.setupTools();
    this.setupRoutes();
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
  
  private setupRoutes() {
    this.app.post('/jsonrpc', this.handleJsonRpc.bind(this));
    
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', version: '1.0.0' });
    });
  }
  
  private async handleJsonRpc(req: Request, res: Response) {
    const { jsonrpc, method, params, id } = req.body;
    
    if (jsonrpc !== '2.0') {
      res.json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id
      });
      return;
    }
    
    try {
      let result;
      
      switch (method) {
        case 'initialize':
          result = await this.handleInitialize(params);
          break;
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
          throw { code: -32601, message: 'Method not found' };
      }
      
      res.json({ jsonrpc: '2.0', result, id });
    } catch (error: any) {
      this.logger.error('JSON-RPC error:', error);
      res.json({
        jsonrpc: '2.0',
        error: error.code ? error : { code: -32603, message: error.message || 'Internal error' },
        id
      });
    }
  }
  
  private async handleInitialize(params: any) {
    await this.communicator.connect();
    
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          listChanged: true
        },
        resources: {
          subscribe: false,
          listChanged: true
        }
      },
      serverInfo: {
        name: 'adobe-after-effects',
        version: '1.0.0'
      }
    };
  }
  
  private async handleListTools() {
    const tools = Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
    
    return { tools };
  }
  
  private async handleToolCall(params: any) {
    const { name, arguments: args } = params;
    const tool = this.tools.get(name);
    
    if (!tool) {
      throw { code: -32602, message: `Unknown tool: ${name}` };
    }
    
    try {
      const result = await this.communicator.executeCommand(name, args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
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
    
    switch (uri) {
      case 'ae://project/current':
        const projectInfo = await this.communicator.executeCommand('getProjectInfo', {});
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(projectInfo, null, 2)
          }]
        };
        
      case 'ae://compositions':
        const compositions = await this.communicator.executeCommand('listCompositions', {});
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(compositions, null, 2)
          }]
        };
        
      case 'ae://render-queue':
        const renderQueue = await this.communicator.executeCommand('getRenderQueue', {});
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(renderQueue, null, 2)
          }]
        };
        
      default:
        throw { code: -32602, message: `Unknown resource: ${uri}` };
    }
  }
  
  async start(port: number = 3000) {
    return new Promise<void>((resolve) => {
      this.server = this.app.listen(port, () => {
        this.logger.info(`MCP server listening on port ${port}`);
        resolve();
      });
    });
  }
  
  async stop() {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
    }
    await this.communicator.disconnect();
  }
}
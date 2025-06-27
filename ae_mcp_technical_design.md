# Adobe After Effects MCP Server - Technical Design Document

## Architecture Overview

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │    │   MCP Server    │    │ After Effects   │
│   (Claude,      │◄──►│   (Node.js)     │◄──►│   ExtendScript  │
│   Other AIs)    │    │                 │    │   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Communication Flow
1. **MCP Client** sends JSON-RPC requests to MCP Server
2. **MCP Server** translates requests to ExtendScript commands
3. **ExtendScript** executes operations within After Effects
4. **Results** flow back through the chain with appropriate formatting

## Technical Stack

### MCP Server (Node.js)
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js for HTTP handling
- **MCP Library**: `@modelcontextprotocol/sdk`
- **AE Communication**: TCP socket or file-based IPC
- **Validation**: Zod for schema validation
- **Logging**: Winston for structured logging

### After Effects Integration
- **Scripting**: ExtendScript (JavaScript ES3)
- **Communication**: CEP (Common Extensibility Platform) panel
- **File Format**: JSON for data exchange
- **Error Handling**: Try-catch with detailed error reporting

## Detailed Architecture

### 1. MCP Server Structure

```typescript
src/
├── index.ts                 // Entry point and MCP server setup
├── server/
│   ├── aeServer.ts         // Main MCP server implementation
│   ├── resources/          // Resource handlers
│   │   ├── projectResource.ts
│   │   ├── compositionResource.ts
│   │   └── assetResource.ts
│   └── tools/              // Tool implementations
│       ├── projectTools.ts
│       ├── layerTools.ts
│       ├── animationTools.ts
│       └── renderTools.ts
├── ae-integration/
│   ├── communicator.ts     // AE communication layer
│   ├── scriptGenerator.ts  // ExtendScript code generation
│   └── errorHandler.ts     // Error mapping and handling
├── types/
│   ├── aeTypes.ts         // After Effects type definitions
│   ├── mcpTypes.ts        // MCP-specific types
│   └── schemas.ts         // Zod validation schemas
└── utils/
    ├── logger.ts          // Logging utilities
    ├── validators.ts      // Input validation
    └── formatters.ts      // Response formatting
```

### 2. After Effects Extension

```
ae-extension/
├── CSXS/
│   └── manifest.xml       // CEP manifest
├── index.html            // Panel UI (minimal)
├── js/
│   ├── main.js           // CEP panel logic
│   ├── ae-bridge.jsx     // ExtendScript bridge
│   └── communication.js  // Server communication
└── css/
    └── styles.css        // Minimal styling
```

## Core Components

### 1. MCP Server Implementation

```typescript
// aeServer.ts
export class AfterEffectsServer {
  private communicator: AECommunicator;
  private server: Server;

  constructor() {
    this.communicator = new AECommunicator();
    this.server = new Server(
      { name: "after-effects", version: "1.0.0" },
      { capabilities: this.getCapabilities() }
    );
    this.setupHandlers();
  }

  private getCapabilities() {
    return {
      resources: {},
      tools: {},
      prompts: {},
      logging: {}
    };
  }

  private setupHandlers() {
    // Resource handlers
    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      this.handleListResources.bind(this)
    );

    // Tool handlers
    this.server.setRequestHandler(
      CallToolRequestSchema,
      this.handleToolCall.bind(this)
    );
  }

  async handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;
    
    try {
      const result = await this.communicator.executeCommand(name, args);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return { 
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true 
      };
    }
  }
}
```

### 2. After Effects Communicator

```typescript
// communicator.ts
export class AECommunicator {
  private socket: net.Socket | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(
        { port: 8080, host: 'localhost' },
        () => {
          this.isConnected = true;
          resolve();
        }
      );
      
      this.socket.on('error', reject);
    });
  }

  async executeCommand(command: string, params: any): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    const script = this.generateScript(command, params);
    return this.sendScript(script);
  }

  private generateScript(command: string, params: any): string {
    const scriptGen = new ScriptGenerator();
    return scriptGen.generate(command, params);
  }

  private async sendScript(script: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const message = JSON.stringify({ script, id: Date.now() });
      
      this.socket?.write(message);
      this.socket?.once('data', (data) => {
        try {
          const result = JSON.parse(data.toString());
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.data);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
```

### 3. ExtendScript Generator

```typescript
// scriptGenerator.ts
export class ScriptGenerator {
  generate(command: string, params: any): string {
    switch (command) {
      case 'createComposition':
        return this.generateCreateComposition(params);
      case 'addLayer':
        return this.generateAddLayer(params);
      case 'setKeyframe':
        return this.generateSetKeyframe(params);
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  private generateCreateComposition(params: {
    name: string;
    width: number;
    height: number;
    duration: number;
    frameRate: number;
  }): string {
    return `
      (function() {
        try {
          var comp = app.project.items.addComp(
            "${params.name}",
            ${params.width},
            ${params.height},
            1.0,
            ${params.duration},
            ${params.frameRate}
          );
          return {
            success: true,
            data: {
              id: comp.id,
              name: comp.name,
              width: comp.width,
              height: comp.height,
              duration: comp.duration,
              frameRate: comp.frameRate
            }
          };
        } catch (error) {
          return { success: false, error: error.toString() };
        }
      })();
    `;
  }

  private generateAddLayer(params: {
    compId: number;
    type: 'solid' | 'text' | 'shape';
    properties: any;
  }): string {
    return `
      (function() {
        try {
          var comp = app.project.itemByID(${params.compId});
          if (!comp) throw new Error("Composition not found");
          
          var layer;
          switch ("${params.type}") {
            case "solid":
              layer = comp.layers.addSolid(
                [${params.properties.color?.join(',') || '1,1,1'}],
                "${params.properties.name || 'Solid'}",
                comp.width,
                comp.height,
                1.0
              );
              break;
            case "text":
              layer = comp.layers.addText("${params.properties.text || 'Text'}");
              break;
            default:
              throw new Error("Unsupported layer type");
          }
          
          return {
            success: true,
            data: {
              id: layer.index,
              name: layer.name,
              type: "${params.type}"
            }
          };
        } catch (error) {
          return { success: false, error: error.toString() };
        }
      })();
    `;
  }
}
```

## MCP Tools Definition

### Project Management Tools

```typescript
const projectTools = [
  {
    name: "create_project",
    description: "Create a new After Effects project",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name" },
        settings: {
          type: "object",
          properties: {
            frameRate: { type: "number", default: 30 },
            resolution: { 
              type: "object",
              properties: {
                width: { type: "number", default: 1920 },
                height: { type: "number", default: 1080 }
              }
            }
          }
        }
      },
      required: ["name"]
    }
  },
  {
    name: "open_project",
    description: "Open an existing After Effects project",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Path to .aep file" }
      },
      required: ["filePath"]
    }
  }
];
```

### Composition Tools

```typescript
const compositionTools = [
  {
    name: "create_composition",
    description: "Create a new composition",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        width: { type: "number", default: 1920 },
        height: { type: "number", default: 1080 },
        duration: { type: "number", default: 10 },
        frameRate: { type: "number", default: 30 }
      },
      required: ["name"]
    }
  },
  {
    name: "modify_composition",
    description: "Modify composition properties",
    inputSchema: {
      type: "object",
      properties: {
        compId: { type: "number" },
        properties: {
          type: "object",
          properties: {
            name: { type: "string" },
            width: { type: "number" },
            height: { type: "number" },
            duration: { type: "number" },
            backgroundColor: { 
              type: "array", 
              items: { type: "number" },
              minItems: 3,
              maxItems: 3
            }
          }
        }
      },
      required: ["compId", "properties"]
    }
  }
];
```

## Implementation Steps

### Phase 1: Core Infrastructure (Week 1-2)

1. **Set up development environment**
   ```bash
   mkdir ae-mcp-server
   cd ae-mcp-server
   npm init -y
   npm install @modelcontextprotocol/sdk typescript @types/node
   npm install -D nodemon ts-node
   ```

2. **Create basic MCP server structure**
   - Implement server initialization
   - Set up TypeScript configuration
   - Create basic logging and error handling

3. **Establish After Effects communication**
   - Create CEP extension skeleton
   - Implement socket-based communication
   - Test basic script execution

### Phase 2: Core Functionality (Week 3-4)

1. **Implement project management tools**
   - Create/open/save projects
   - Project information retrieval
   - Basic error handling

2. **Add composition operations**
   - Composition creation and modification
   - Property access and manipulation
   - Validation and error checking

3. **Basic layer management**
   - Layer creation (solid, text)
   - Property modification
   - Layer organization

### Phase 3: Advanced Features (Week 5-6)

1. **Animation and keyframes**
   - Keyframe creation and modification
   - Easing and interpolation
   - Timeline navigation

2. **Asset management**
   - Import functionality
   - Asset organization
   - Footage replacement

3. **Rendering capabilities**
   - Render queue management
   - Export settings configuration
   - Progress monitoring

### Phase 4: Templates and Polish (Week 7-8)

1. **Template system**
   - Template creation and instantiation
   - Parameter substitution
   - Validation framework

2. **Performance optimization**
   - Batch operation support
   - Asynchronous processing
   - Memory management

3. **Documentation and testing**
   - Comprehensive API documentation
   - Unit and integration tests
   - Example projects and tutorials

## Installation and Setup Instructions

### Prerequisites

1. **Adobe After Effects CC 2020 or newer**
2. **Node.js 18+**
3. **Enable CEP debugging** in After Effects

### Installation Steps

1. **Clone and install the MCP server**
   ```bash
   git clone <repository-url>
   cd ae-mcp-server
   npm install
   npm run build
   ```

2. **Install the After Effects extension**
   ```bash
   # Copy extension to AE extensions directory
   # Windows: %APPDATA%/Adobe/CEP/extensions/
   # macOS: ~/Library/Application Support/Adobe/CEP/extensions/
   cp -r ae-extension/ "$(AE_EXTENSIONS_DIR)/ae-mcp-bridge/"
   ```

3. **Configure After Effects**
   - Enable "Allow Scripts to Write Files and Access Network"
   - Set CEP debug mode flag
   - Restart After Effects

4. **Start the MCP server**
   ```bash
   npm start
   # Server will start on localhost:3000
   ```

5. **Test the connection**
   ```bash
   # Use MCP client to test basic functionality
   node test-client.js
   ```

## Security Considerations

### Input Validation
- Sanitize all file paths to prevent directory traversal
- Validate ExtendScript code before execution
- Limit resource usage and operation timeouts

### Access Control
- Implement authentication for sensitive operations
- Restrict file system access to designated folders
- Log all operations for audit purposes

### Error Handling
- Never expose internal system information in errors
- Implement proper error boundaries
- Provide meaningful error messages to users

## Performance Considerations

### ExtendScript Optimization
- Minimize object access in loops
- Cache frequently accessed properties
- Use efficient data structures for large operations

### Communication Efficiency
- Batch operations when possible
- Implement connection pooling
- Use compression for large data transfers

### Resource Management
- Monitor memory usage during long operations
- Implement operation queuing
- Provide progress feedback for slow operations

## Testing Strategy

### Unit Tests
- Test individual tool functions
- Validate input schemas
- Test error handling scenarios

### Integration Tests
- Test MCP protocol compliance
- Verify After Effects communication
- Test end-to-end workflows

### Performance Tests
- Benchmark operation speeds
- Test with large projects
- Memory usage monitoring

## Deployment and Distribution

### Packaging
- Create npm package for the MCP server
- Bundle After Effects extension
- Include documentation and examples

### Distribution Channels
- npm registry for the server component
- Adobe Exchange for the AE extension
- GitHub for source code and documentation

This technical design provides a comprehensive foundation for implementing a robust MCP server for Adobe After Effects that enables powerful AI-driven automation while maintaining security and performance standards.
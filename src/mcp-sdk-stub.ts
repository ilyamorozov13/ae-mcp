// Stub for MCP SDK types since we can't install the package
// In production, remove this file and use the actual @modelcontextprotocol/sdk

export class Server {
  constructor(info: any, options: any) {}
  
  setRequestHandler(schema: any, handler: any) {}
  
  async connect(transport: any) {}
}

export class StdioServerTransport {
  constructor() {}
}

export const CallToolRequestSchema = {};
export const ListResourcesRequestSchema = {};
export const ListToolsRequestSchema = {};
export const ReadResourceRequestSchema = {};
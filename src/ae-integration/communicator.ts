import net from 'net';
import { Logger } from 'winston';
import { ScriptGenerator } from './scriptGenerator.js';
import { AEError, AEErrorHandler } from './errorHandler.js';

interface PendingCommand {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
}

export class AECommunicator {
  private socket: net.Socket | null = null;
  private isConnected = false;
  private logger: Logger;
  private scriptGenerator: ScriptGenerator;
  private pendingCommands: Map<string, PendingCommand> = new Map();
  private buffer = '';
  private clientPrefix: string;
  
  constructor(logger: Logger, clientPrefix?: string) {
    this.logger = logger;
    this.scriptGenerator = new ScriptGenerator();
    
    // Generate unique client prefix if not provided
    this.clientPrefix = clientPrefix || `client_${process.pid}_${Date.now().toString(36)}`;
    this.logger.info(`Socket communicator initialized with prefix: ${this.clientPrefix}`);
  }
  
  async connect(port: number = 8080, host: string = 'localhost'): Promise<void> {
    if (this.isConnected) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection({ port, host }, () => {
        this.isConnected = true;
        this.logger.info(`Connected to After Effects on ${host}:${port}`);
        resolve();
      });
      
      this.socket.on('data', this.handleData.bind(this));
      this.socket.on('error', (error) => {
        this.logger.error('Socket error:', error);
        this.isConnected = false;
        reject(error);
      });
      
      this.socket.on('close', () => {
        this.logger.info('Connection to After Effects closed');
        this.isConnected = false;
        this.clearPendingCommands();
      });
      
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }
  
  private handleData(data: Buffer) {
    this.buffer += data.toString();
    
    let messageEnd;
    while ((messageEnd = this.buffer.indexOf('\\n\\n')) !== -1) {
      const message = this.buffer.substring(0, messageEnd);
      this.buffer = this.buffer.substring(messageEnd + 4);
      
      try {
        const parsed = JSON.parse(message);
        this.handleMessage(parsed);
      } catch (error) {
        this.logger.error('Failed to parse message:', error);
      }
    }
  }
  
  private handleMessage(message: any) {
    const { id, result, error } = message;
    
    // Only process messages for this client
    if (!id || !id.startsWith(this.clientPrefix)) {
      this.logger.debug(`Ignoring message for different client: ${id}`);
      return;
    }
    
    const pending = this.pendingCommands.get(id);
    
    if (!pending) {
      this.logger.warn(`Received response for unknown command: ${id}`);
      return;
    }
    
    clearTimeout(pending.timeout);
    this.pendingCommands.delete(id);
    
    if (error) {
      pending.reject(new AEError(error.message, error.code));
    } else {
      pending.resolve(result);
    }
  }
  
  async executeCommand(command: string, params: any): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    // Validate parameters before execution
    const validation = AEErrorHandler.validateParams(command, params);
    if (!validation.valid) {
      throw new AEError(
        `Invalid parameters for ${command}: ${validation.errors.join(', ')}`,
        'INVALID_PARAMS',
        { errors: validation.errors },
        { command, params }
      );
    }
    
    try {
      const script = this.scriptGenerator.generate(command, params);
      return await this.sendScript(script, command);
    } catch (error: any) {
      // Enhanced error with context
      throw AEErrorHandler.formatError(error, {
        command,
        params,
        scriptSnippet: error.script
      });
    }
  }
  
  private async sendScript(script: string, command: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `${this.clientPrefix}_${command}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new Error(`Command timeout: ${command}`));
      }, 30000);
      
      this.pendingCommands.set(id, { resolve, reject, timeout });
      
      const message = JSON.stringify({ id, script }) + '\\n\\n';
      
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }
      
      this.socket.write(message, (error) => {
        if (error) {
          clearTimeout(timeout);
          this.pendingCommands.delete(id);
          reject(error);
        }
      });
    });
  }
  
  private clearPendingCommands() {
    this.pendingCommands.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    });
    this.pendingCommands.clear();
  }
  
  async disconnect() {
    if (this.socket && this.isConnected) {
      return new Promise<void>((resolve) => {
        this.socket!.end(() => {
          this.isConnected = false;
          resolve();
        });
      });
    }
  }
  
  getClientPrefix(): string {
    return this.clientPrefix;
  }
}
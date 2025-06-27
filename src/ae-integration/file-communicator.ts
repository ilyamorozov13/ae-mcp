import fs from 'fs';
import path from 'path';
import os from 'os';
import { Logger } from 'winston';
import { ScriptGenerator } from './scriptGenerator.js';
import { AEError } from './errorHandler.js';

interface PendingCommand {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
  commandFile: string;
  responseFile: string;
}

export class AEFileCommunicator {
  private logger: Logger;
  private scriptGenerator: ScriptGenerator;
  private pendingCommands: Map<string, PendingCommand> = new Map();
  private commandsDir: string;
  private checkInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  
  constructor(logger: Logger) {
    this.logger = logger;
    this.scriptGenerator = new ScriptGenerator();
    
    // Use Documents folder for better write permissions
    const homeDir = os.homedir();
    this.commandsDir = path.join(homeDir, 'Documents', 'ae-mcp-commands');
    
    this.logger.info('Using Documents folder for file-based communication');
    
    // Ensure commands directory exists
    if (!fs.existsSync(this.commandsDir)) {
      fs.mkdirSync(this.commandsDir, { recursive: true });
    }
  }
  
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    
    this.logger.info('Starting file-based communication bridge');
    this.logger.info(`Commands directory: ${this.commandsDir}`);
    
    // Start checking for responses
    this.startResponseChecker();
    this.isConnected = true;
  }
  
  private startResponseChecker() {
    this.checkInterval = setInterval(() => {
      this.checkForResponses();
    }, 100); // Check every 100ms
  }
  
  private async checkForResponses() {
    try {
      const files = fs.readdirSync(this.commandsDir);
      const responseFiles = files.filter(f => f.endsWith('.json.response'));
      
      for (const file of responseFiles) {
        const filePath = path.join(this.commandsDir, file);
        
        try {
          // Check file size to ensure it's been written
          const stats = fs.statSync(filePath);
          if (stats.size === 0) {
            // File is empty, skip for now
            continue;
          }
          
          // Add small delay to ensure file is fully written
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Read response
          const content = fs.readFileSync(filePath, 'utf8');
          if (!content || content.trim().length === 0) {
            this.logger.warn(`Empty response file: ${file}`);
            continue;
          }
          
          let response;
          try {
            response = JSON.parse(content);
          } catch (parseError) {
            this.logger.error(`Invalid JSON in response ${file}: ${content.substring(0, 100)}`);
            // Delete corrupted file
            fs.unlinkSync(filePath);
            continue;
          }
          
          // Find pending command
          const pending = this.pendingCommands.get(response.id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingCommands.delete(response.id);
            
            // Clean up files
            try {
              fs.unlinkSync(filePath);
              if (fs.existsSync(pending.commandFile)) {
                fs.unlinkSync(pending.commandFile);
              }
            } catch (e) {
              // Ignore cleanup errors
            }
            
            // Resolve promise
            if (response.result.success) {
              pending.resolve(response.result.data);
            } else {
              pending.reject(new AEError(response.result.error.message, response.result.error.code));
            }
          } else {
            // Clean up orphaned response
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          this.logger.error(`Error processing response ${file}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error checking for responses:', error);
    }
  }
  
  async executeCommand(command: string, params: any): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    const script = this.scriptGenerator.generate(command, params);
    return this.sendScript(script, command);
  }
  
  private async sendScript(script: string, command: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `${command}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const commandFile = path.join(this.commandsDir, `${id}.json`);
      const responseFile = `${commandFile}.response`;
      
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(id);
        
        // Log timeout details
        this.logger.error(`Command timeout for ${command}:`, {
          commandFile,
          responseFile,
          fileExists: fs.existsSync(commandFile),
          responseExists: fs.existsSync(responseFile)
        });
        
        // Clean up files
        try {
          if (fs.existsSync(commandFile)) fs.unlinkSync(commandFile);
          if (fs.existsSync(responseFile)) fs.unlinkSync(responseFile);
        } catch (e) {}
        
        reject(new Error(`Command timeout: ${command}`));
      }, 60000); // 60 second timeout
      
      // Store pending command
      this.pendingCommands.set(id, { 
        resolve, 
        reject, 
        timeout,
        commandFile,
        responseFile
      });
      
      // Write command file
      try {
        const commandData = { id, script };
        fs.writeFileSync(commandFile, JSON.stringify(commandData, null, 2));
        this.logger.info(`Wrote command file: ${path.basename(commandFile)} for ${command}`);
        
        // Verify file was written
        const stats = fs.statSync(commandFile);
        this.logger.debug(`Command file size: ${stats.size} bytes`);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingCommands.delete(id);
        reject(error);
      }
    });
  }
  
  async disconnect() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Cancel all pending commands
    this.pendingCommands.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Communicator disconnected'));
    });
    this.pendingCommands.clear();
    
    this.isConnected = false;
  }
}
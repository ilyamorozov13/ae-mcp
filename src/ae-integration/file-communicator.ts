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
  private isFirstCommand = true;
  
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
    
    // Check for .processed files to see if CEP extension is running
    const files = fs.readdirSync(this.commandsDir);
    const processedFiles = files.filter(f => f.endsWith('.processed'));
    if (processedFiles.length > 0) {
      this.logger.info(`Found ${processedFiles.length} processed command files - CEP extension appears to be active`);
    } else {
      this.logger.warn('No processed command files found - CEP extension may not be running in After Effects');
      this.logger.warn('Please ensure the AE MCP Bridge panel is open in After Effects with Auto Process enabled');
    }
    
    // Start checking for responses
    this.startResponseChecker();
    this.isConnected = true;
    
    // Add a small delay to allow CEP extension to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
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
          
          // Add longer delay to ensure file is fully written and closed
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Read response with retry logic
          let content = '';
          let retries = 3;
          while (retries > 0) {
            try {
              content = fs.readFileSync(filePath, 'utf8');
              break;
            } catch (readErr) {
              retries--;
              if (retries === 0) throw readErr;
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
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
          
          // Validate response has required properties
          if (!response || typeof response !== 'object' || !response.id) {
            this.logger.error(`Invalid response format in ${file}: missing id property`);
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
              // Check for both the original and processed command file
              if (fs.existsSync(pending.commandFile)) {
                fs.unlinkSync(pending.commandFile);
              } else {
                // Check for .processed version
                const processedFile = pending.commandFile + '.processed';
                if (fs.existsSync(processedFile)) {
                  fs.unlinkSync(processedFile);
                }
              }
            } catch (e) {
              // Ignore cleanup errors
              this.logger.debug(`Cleanup error (non-critical): ${e}`);
            }
            
            // Resolve promise
            if (!response.result || typeof response.result !== 'object') {
              pending.reject(new AEError('Invalid response format: missing result property', 'INVALID_RESPONSE'));
            } else if (response.result.success) {
              // Mark that we've successfully completed at least one command
              this.isFirstCommand = false;
              pending.resolve(response.result.data);
            } else {
              // Handle error response
              let errorMessage = 'Unknown error';
              let errorCode = 'UNKNOWN_ERROR';
              
              if (response.result.error && typeof response.result.error === 'object') {
                errorMessage = response.result.error.message || errorMessage;
                errorCode = response.result.error.code || errorCode;
              } else if (typeof response.result.error === 'string') {
                errorMessage = response.result.error;
              }
              
              pending.reject(new AEError(errorMessage, errorCode));
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
        
        // Check if command was processed but response wasn't read
        const processedFile = commandFile + '.processed';
        const wasProcessed = fs.existsSync(processedFile);
        
        // Log timeout details
        this.logger.error(`Command timeout for ${command}:`, {
          commandFile,
          responseFile,
          fileExists: fs.existsSync(commandFile),
          processedExists: wasProcessed,
          responseExists: fs.existsSync(responseFile)
        });
        
        if (!wasProcessed && !fs.existsSync(responseFile)) {
          this.logger.error('Command was not processed - CEP extension may not be running in After Effects');
          this.logger.error('Please ensure the AE MCP Bridge panel is open with Auto Process enabled');
        }
        
        // Clean up files
        try {
          if (fs.existsSync(commandFile)) fs.unlinkSync(commandFile);
          if (fs.existsSync(processedFile)) fs.unlinkSync(processedFile);
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
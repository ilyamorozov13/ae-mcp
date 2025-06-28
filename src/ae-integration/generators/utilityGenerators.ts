import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const utilityGenerators: ScriptGeneratorModule = {
  ping: () => `
    var now = new Date();
    var timestamp = now.getFullYear() + '-' + 
                   ('0' + (now.getMonth() + 1)).slice(-2) + '-' + 
                   ('0' + now.getDate()).slice(-2) + 'T' + 
                   ('0' + now.getHours()).slice(-2) + ':' + 
                   ('0' + now.getMinutes()).slice(-2) + ':' + 
                   ('0' + now.getSeconds()).slice(-2) + '.' + 
                   ('00' + now.getMilliseconds()).slice(-3) + 'Z';
    
    return {
      success: true,
      data: {
        message: "pong",
        timestamp: timestamp
      }
    };
  `,
  
  getAeVersion: () => `
    var versionString = app.version;
    var versionParts = versionString.split(".");
    var majorVersion = parseInt(versionParts[0]) || 0;
    var minorVersion = parseInt(versionParts[1]) || 0;
    
    // Determine year based on version number
    var yearMap = {
      "23": "2023",
      "24": "2024",
      "22": "2022"
    };
    
    var year = yearMap[majorVersion.toString()] || "Unknown";
    
    return {
      success: true,
      data: {
        version: versionString,
        majorVersion: majorVersion,
        minorVersion: minorVersion,
        year: year,
        productName: "After Effects " + year
      }
    };
  `,
  
  executeScript: (params: { script: string; undoGroupName?: string; wrapInTransaction?: boolean }) => `
    ${params.wrapInTransaction !== false ? `app.beginUndoGroup("${helpers.escapeString(params.undoGroupName || 'Script Execution')}");` : ''}
    
    try {
      // Execute the provided script
      ${params.script}
      
      ${params.wrapInTransaction !== false ? `app.endUndoGroup();` : ''}
      
      return {
        success: true,
        data: {
          message: "Script executed successfully"
        }
      };
    } catch (error) {
      ${params.wrapInTransaction !== false ? `app.endUndoGroup();` : ''}
      throw error;
    }
  `
};
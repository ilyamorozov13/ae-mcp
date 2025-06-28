import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const utilityGenerators: ScriptGeneratorModule = {
  ping: () => `
    function pad(num) {
      return (num < 10 ? "0" : "") + num;
    }
    
    var now = new Date();
    var timestamp = now.getFullYear() + "-" + 
                   pad(now.getMonth() + 1) + "-" + 
                   pad(now.getDate()) + "T" + 
                   pad(now.getHours()) + ":" + 
                   pad(now.getMinutes()) + ":" + 
                   pad(now.getSeconds()) + "Z";
    
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
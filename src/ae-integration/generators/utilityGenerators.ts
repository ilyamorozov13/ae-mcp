import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const utilityGenerators: ScriptGeneratorModule = {
  ping: () => {
    return 'var now = new Date();\n' +
    'var timestamp = now.getFullYear() + "-" + \n' +
    '               ("0" + (now.getMonth() + 1)).slice(-2) + "-" + \n' +
    '               ("0" + now.getDate()).slice(-2) + "T" + \n' +
    '               ("0" + now.getHours()).slice(-2) + ":" + \n' +
    '               ("0" + now.getMinutes()).slice(-2) + ":" + \n' +
    '               ("0" + now.getSeconds()).slice(-2) + "." + \n' +
    '               ("00" + now.getMilliseconds()).slice(-3) + "Z";\n' +
    '\n' +
    'return {\n' +
    '  success: true,\n' +
    '  data: {\n' +
    '    message: "pong",\n' +
    '    timestamp: timestamp\n' +
    '  }\n' +
    '};';
  },
  
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
  
  executeScript: (params: { script: string; undoGroupName?: string; wrapInTransaction?: boolean }) => {
    // Host.jsx already wraps mutating MCP commands in one undo group.
    // Nested beginUndoGroup/endUndoGroup leaves AE's undo stack corrupt and
    // crashes on the next user edit (BEE_WorkQueue / PreCloseProject).
    const wrap = params.wrapInTransaction === true;
    let script = '';

    script += 'var mcpScriptResult = undefined;\n';
    if (wrap) {
      script += 'app.beginUndoGroup("' + helpers.escapeString(params.undoGroupName || 'Script Execution') + '");\n';
    }
    script += 'try {\n';
    script += '  mcpScriptResult = (function() {\n';
    script += params.script + '\n';
    script += '  })();\n';
    script += '} finally {\n';
    script += '  try { app.endSuppressDialogs(false); } catch (eDialog) {}\n';
    if (wrap) {
      script += '  try { app.endUndoGroup(); } catch (eUndo) {}\n';
    }
    script += '}\n';
    script += 'var result = {};\n';
    script += 'result.success = true;\n';
    script += 'result.data = {};\n';
    script += 'if (mcpScriptResult !== undefined && mcpScriptResult !== null) {\n';
    script += '  result.data.result = mcpScriptResult;\n';
    script += '} else {\n';
    script += '  result.data.message = "Script executed successfully";\n';
    script += '}\n';
    script += 'return result;\n';

    return script;
  }
};
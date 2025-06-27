// Debug Bridge - Shows exact values causing divide by zero

(function() {
    var documentsFolder = Folder.myDocuments;
    var COMMANDS_DIR = documentsFolder.fsName + "/ae-mcp-commands";
    var commandsFolder = new Folder(COMMANDS_DIR);
    
    if (!commandsFolder.exists) {
        commandsFolder.create();
    }
    
    var dialog = new Window("dialog", "AE MCP Debug Bridge");
    dialog.preferredSize.width = 1200;
    
    var log = dialog.add("edittext", undefined, "", {multiline: true, readonly: true});
    log.preferredSize.height = 500;
    log.preferredSize.width = 1180;
    
    var processBtn = dialog.add("button", undefined, "Process Commands");
    processBtn.preferredSize.height = 40;
    
    function addLog(msg) {
        log.text = new Date().toLocaleTimeString() + " - " + msg + "\n" + log.text;
    }
    
    function analyzeScript(script) {
        // Extract key information
        var info = {
            hasSetValueAtTime: script.indexOf("setValueAtTime") !== -1,
            hasScale: script.indexOf("Scale") !== -1,
            hasPosition: script.indexOf("Position") !== -1,
            hasRotation: script.indexOf("Rotation") !== -1,
            hasOpacity: script.indexOf("Opacity") !== -1
        };
        
        // Extract setValueAtTime calls
        var setValueCalls = script.match(/setValueAtTime\([^)]+\)/g) || [];
        info.setValueCalls = setValueCalls;
        
        // Extract property access
        var propAccess = script.match(/property\("[^"]+"\)/g) || [];
        info.properties = propAccess;
        
        // Look for problematic values
        var problems = [];
        
        // Check for zero scale
        if (script.match(/Scale.*setValueAtTime.*\[0[,\s]+0\]/)) {
            problems.push("Zero scale detected");
        }
        
        // Check for divide operations
        if (script.indexOf("/") !== -1) {
            problems.push("Division operation found");
        }
        
        // Check for setValue with scale
        if (script.match(/Scale.*setValue.*\[0[,\s]+0\]/)) {
            problems.push("Zero scale in setValue");
        }
        
        info.problems = problems;
        
        return info;
    }
    
    function processFile(file) {
        try {
            addLog("=== PROCESSING: " + file.name + " ===");
            
            file.open("r");
            var content = file.read();
            file.close();
            
            var cmd = JSON.parse(content);
            
            // Analyze script
            var analysis = analyzeScript(cmd.script);
            addLog("Script analysis:");
            addLog("  Properties: " + analysis.properties.join(", "));
            addLog("  SetValue calls: " + analysis.setValueCalls.join("; "));
            if (analysis.problems.length > 0) {
                addLog("  ⚠️ PROBLEMS: " + analysis.problems.join(", "));
            }
            
            // Show relevant part of script
            if (analysis.hasSetValueAtTime) {
                var relevantPart = cmd.script.match(/.{0,100}setValueAtTime.{0,100}/g);
                if (relevantPart) {
                    addLog("  Context: " + relevantPart[0]);
                }
            }
            
            var result;
            
            // Create a wrapped version that logs values
            var wrappedScript = cmd.script;
            
            // Wrap setValueAtTime to log values
            wrappedScript = wrappedScript.replace(
                /(\w+)\.setValueAtTime\(([^,]+),\s*([^)]+)\)/g,
                function(match, prop, time, value) {
                    return '(function() {\n' +
                           '  var t = ' + time + ';\n' +
                           '  var v = ' + value + ';\n' +
                           '  $.writeln("setValueAtTime on ' + prop + ':");\n' +
                           '  $.writeln("  time = " + t + " (type: " + typeof t + ")");\n' +
                           '  $.writeln("  value = " + v + " (type: " + typeof v + ")");\n' +
                           '  if (v instanceof Array) {\n' +
                           '    $.writeln("  array length = " + v.length);\n' +
                           '    $.writeln("  array values = [" + v.join(", ") + "]");\n' +
                           '    for (var i = 0; i < v.length; i++) {\n' +
                           '      if (v[i] === 0) $.writeln("  WARNING: Zero at index " + i);\n' +
                           '    }\n' +
                           '  }\n' +
                           '  return ' + prop + '.setValueAtTime(t, v);\n' +
                           '})()';
                }
            );
            
            // Also wrap setValue
            wrappedScript = wrappedScript.replace(
                /(\w+)\.setValue\(([^)]+)\)/g,
                function(match, prop, value) {
                    return '(function() {\n' +
                           '  var v = ' + value + ';\n' +
                           '  $.writeln("setValue on ' + prop + ':");\n' +
                           '  $.writeln("  value = " + v);\n' +
                           '  if (v instanceof Array && v.indexOf(0) !== -1) {\n' +
                           '    $.writeln("  WARNING: Contains zero!");\n' +
                           '  }\n' +
                           '  return ' + prop + '.setValue(v);\n' +
                           '})()';
                }
            );
            
            try {
                addLog("Executing wrapped script...");
                result = eval(wrappedScript);
                if (!result) result = {success: true, data: null};
                addLog("✅ Success!");
            } catch (e) {
                result = {
                    success: false,
                    error: {
                        message: e.toString(),
                        code: e.number || "UNKNOWN"
                    }
                };
                addLog("❌ Error: " + e.toString());
                
                if (e.toString().indexOf("divide by zero") !== -1) {
                    addLog("This is the divide by zero error!");
                    addLog("Check the Info panel for $.writeln output");
                }
            }
            
            // Write response
            var responseFile = new File(file.fsName + ".response");
            responseFile.open("w");
            responseFile.write(JSON.stringify({id: cmd.id, result: result}));
            responseFile.close();
            
            file.remove();
            
            addLog("=== END ===\n");
            
        } catch (e) {
            addLog("Process error: " + e);
        }
    }
    
    processBtn.onClick = function() {
        addLog("Checking for commands...");
        
        var files = commandsFolder.getFiles("*.json");
        var found = 0;
        
        for (var i = 0; i < files.length; i++) {
            if (files[i].name.indexOf(".response") === -1) {
                found++;
                processFile(files[i]);
            }
        }
        
        if (found === 0) {
            addLog("No commands found");
        } else {
            addLog("Processed " + found + " command(s)");
            addLog("*** CHECK THE INFO PANEL (Window > Info) FOR DETAILED OUTPUT ***");
        }
    };
    
    dialog.onClose = function() {
        // Clean up any remaining files
        var files = commandsFolder.getFiles("*.json");
        for (var i = 0; i < files.length; i++) {
            try { files[i].remove(); } catch (e) {}
        }
    };
    
    addLog("Debug bridge ready - " + COMMANDS_DIR);
    addLog("This will show detailed information about values causing errors");
    
    dialog.show();
})();